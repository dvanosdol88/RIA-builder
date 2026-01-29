export interface WebResearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface WebResearchResponse {
  query: string;
  answer: string;
  results: WebResearchResult[];
  responseTime?: number;
}

export interface WebResearchOptions {
  query: string;
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  topic?: string;
  timeRange?: string;
}

const DEFAULT_WEB_RESEARCH_URL =
  import.meta.env.VITE_WEB_RESEARCH_URL ||
  'https://us-central1-mg-dashboard-ee066.cloudfunctions.net/webResearch';

/**
 * Run a web research query via the backend (Tavily API key stored server-side).
 */
export const runWebResearch = async (
  options: WebResearchOptions
): Promise<WebResearchResponse> => {
  const response = await fetch(DEFAULT_WEB_RESEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Web research failed.');
  }

  return data as WebResearchResponse;
};
