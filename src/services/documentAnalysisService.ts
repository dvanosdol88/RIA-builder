import { GoogleGenAI } from '@google/genai';

export interface DocumentSuggestions {
  suggestedPage: string;
  suggestedSection: string;
  suggestedTags: string[];
  summary: string;
  relatedTo: string[];
}

interface AnalyzeDocumentInput {
  text: string;
  filename: string;
  existingTags: string[];
  existingDocNames: string[];
}

function extractTextFromResponse(responseText: string): string {
  const trimmed = responseText.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }
  return trimmed;
}

export async function analyzeDocument({
  text,
  filename,
  existingTags,
  existingDocNames,
}: AnalyzeDocumentInput): Promise<DocumentSuggestions> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string);
  
  if (!apiKey) {
    console.error('Gemini API Key is missing');
    throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
  });

  const prompt = `
You are an assistant for the Finwise RIA Builder app. Analyze the document content and suggest metadata.

Document filename: ${filename}
Existing tags: ${existingTags.join(', ') || 'none'}
Existing documents: ${existingDocNames.join(', ') || 'none'}

Return ONLY a JSON object with this shape:
{
  "suggestedPage": "string",
  "suggestedSection": "string",
  "suggestedTags": ["string"],
  "summary": "string",
  "relatedTo": ["string"]
}

Rules:
- Suggest the most relevant page and section in the app.
- Suggest 2-4 relevant tags, preferring existing tags when appropriate.
- Summary should be 1-2 sentences.
- relatedTo should list the most relevant existing document names (or empty array).

Document text:
${text}
`.trim();

  const result = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const responseText =
    result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('') || '';

  const jsonPayload = extractTextFromResponse(responseText);
  const parsed = JSON.parse(jsonPayload) as DocumentSuggestions;

  return {
    suggestedPage: parsed.suggestedPage || '',
    suggestedSection: parsed.suggestedSection || '',
    suggestedTags: parsed.suggestedTags || [],
    summary: parsed.summary || '',
    relatedTo: parsed.relatedTo || [],
  };
}
