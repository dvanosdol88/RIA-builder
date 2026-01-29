import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import Busboy from 'busboy';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import cors from 'cors';

const corsHandler = cors({ origin: true });
const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';
const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

type JsonRecord = Record<string, unknown>;

const parseJsonBody = (body: unknown): JsonRecord | null => {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') {
        return parsed as JsonRecord;
      }
      return {};
    } catch {
      return null;
    }
  }

  if (body && typeof body === 'object') {
    return body as JsonRecord;
  }

  return {};
};

admin.initializeApp();

export const transcribeAudio = functions
  .runWith({ secrets: ['OPENAI_API_KEY'] })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const busboy = Busboy({ headers: req.headers });
      const tmpdir = os.tmpdir();
      let filePath: string | null = null;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      busboy.on(
        'file',
        (
          fieldname: string,
          file: NodeJS.ReadableStream,
          info: Busboy.FileInfo
        ) => {
          const { filename } = info;
          const saveTo = path.join(tmpdir, filename);
          filePath = saveTo;
          const writeStream = fs.createWriteStream(saveTo);
          file.pipe(writeStream);
        }
      );

      busboy.on('finish', async () => {
        try {
          if (!filePath) {
            res.status(400).send({ error: 'No file uploaded.' });
            return;
          }

          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
          });

          fs.unlinkSync(filePath); // Clean up temp file

          res.status(200).send({ text: transcription.text });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          console.error('Transcription error:', message);
          if (filePath) {
            fs.unlinkSync(filePath); // Clean up on error too
          }
          res.status(500).send({ error: 'Transcription failed.' });
        }
      });

      busboy.end(req.rawBody);
    });
  });

export const sendSlackMessage = functions
  .runWith({ secrets: ['SLACK_BOT_TOKEN'] })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const slackChannelId = functions.config().genconsult?.slack_channel_id;
      if (!slackChannelId) {
        res.status(500).send({ error: 'Slack channel not configured.' });
        return;
      }

      const body = parseJsonBody(req.body);
      if (!body) {
        res.status(400).send({ error: 'Invalid JSON body.' });
        return;
      }

      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        res.status(400).send({ error: 'Message text is required.' });
        return;
      }

      try {
        const slackResponse = await fetch(SLACK_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: slackChannelId,
            text,
          }),
        });

        const slackData = await slackResponse.json();
        if (!slackResponse.ok || !slackData.ok) {
          res.status(500).send({
            error: slackData?.error || 'Slack API error.',
          });
          return;
        }

        res.status(200).send({
          ok: true,
          channel: slackData.channel,
          ts: slackData.ts,
          message: slackData.message?.text || text,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('Slack error:', message);
        res.status(500).send({ error: 'Slack request failed.' });
      }
    });
  });

export const webResearch = functions
  .runWith({ secrets: ['TAVILY_API_KEY'] })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const body = parseJsonBody(req.body);
      if (!body) {
        res.status(400).send({ error: 'Invalid JSON body.' });
        return;
      }

      const query = typeof body.query === 'string' ? body.query.trim() : '';
      if (!query) {
        res.status(400).send({ error: 'Query is required.' });
        return;
      }

      const maxResultsRaw = body.maxResults;
      const maxResults =
        typeof maxResultsRaw === 'number'
          ? maxResultsRaw
          : Number(maxResultsRaw);
      const safeMaxResults = Number.isFinite(maxResults)
        ? Math.min(Math.max(maxResults, 1), 10)
        : 5;

      const searchDepth =
        body.searchDepth === 'advanced' ? 'advanced' : 'basic';
      const topic = typeof body.topic === 'string' ? body.topic : 'general';
      const timeRange =
        typeof body.timeRange === 'string' ? body.timeRange : undefined;

      try {
        const tavilyResponse = await fetch(TAVILY_SEARCH_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            max_results: safeMaxResults,
            search_depth: searchDepth,
            topic,
            include_answer: true,
            include_raw_content: false,
            time_range: timeRange,
          }),
        });

        const tavilyData = await tavilyResponse.json();
        if (!tavilyResponse.ok) {
          res.status(500).send({
            error: tavilyData?.error || 'Tavily API error.',
          });
          return;
        }

        const results = Array.isArray(tavilyData.results)
          ? tavilyData.results.map((result: JsonRecord) => ({
              title: typeof result.title === 'string' ? result.title : '',
              url: typeof result.url === 'string' ? result.url : '',
              content: typeof result.content === 'string' ? result.content : '',
              score:
                typeof result.score === 'number' ? result.score : undefined,
            }))
          : [];

        res.status(200).send({
          query: tavilyData.query || query,
          answer: tavilyData.answer || '',
          results,
          responseTime: tavilyData.response_time,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('Tavily error:', message);
        res.status(500).send({ error: 'Web research request failed.' });
      }
    });
  });

export const integrationStatus = functions
  .runWith({ secrets: ['SLACK_BOT_TOKEN', 'TAVILY_API_KEY'] })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'GET') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const slackChannelId = functions.config().genconsult?.slack_channel_id;
      const slackTokenConfigured = Boolean(process.env.SLACK_BOT_TOKEN);
      const tavilyConfigured = Boolean(process.env.TAVILY_API_KEY);

      res.status(200).send({
        slackConfigured: slackTokenConfigured && Boolean(slackChannelId),
        slackChannelConfigured: Boolean(slackChannelId),
        tavilyConfigured,
      });
    });
  });
