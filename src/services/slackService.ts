export interface SlackSendResult {
  ok: boolean;
  channel?: string;
  ts?: string;
  message?: string;
  error?: string;
}

const DEFAULT_SLACK_SEND_URL =
  import.meta.env.VITE_SLACK_SEND_URL ||
  'https://us-central1-mg-dashboard-ee066.cloudfunctions.net/sendSlackMessage';

/**
 * Send a Slack message via the backend function (bot token stored server-side).
 */
export const sendSlackMessage = async (
  text: string
): Promise<SlackSendResult> => {
  const response = await fetch(DEFAULT_SLACK_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to send Slack message.');
  }

  return data as SlackSendResult;
};
