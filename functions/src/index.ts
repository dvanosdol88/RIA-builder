import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import Busboy from "busboy";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import cors from "cors";

const corsHandler = cors({ origin: true });

admin.initializeApp();

export const transcribeAudio = functions
  .runWith({ secrets: ["OPENAI_API_KEY"] })
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      const busboy = Busboy({ headers: req.headers });
      const tmpdir = os.tmpdir();
      let filePath: string | null = null;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      busboy.on(
        "file",
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

      busboy.on("finish", async () => {
        try {
          if (!filePath) {
            res.status(400).send({ error: "No file uploaded." });
            return;
          }

          const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
          });

          fs.unlinkSync(filePath); // Clean up temp file

          res.status(200).send({ text: transcription.text });
        } catch (error: any) {
          console.error("Transcription error:", error);
          if (filePath) {
            fs.unlinkSync(filePath); // Clean up on error too
          }
          res.status(500).send({ error: "Transcription failed." });
        }
      });

      busboy.end(req.rawBody);
    });
  });
