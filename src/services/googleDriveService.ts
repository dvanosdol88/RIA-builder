import { useAuthStore } from '../authStore';

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const DOCS_BASE_URL = 'https://docs.googleapis.com/v1/documents';

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error('Not authenticated with Google');
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

export const getDriveFiles = async (pageSize: number = 10) => {
  const headers = getHeaders();
  
  // Fetch files, favoring folders and Google Docs
  const queryParams = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields: 'nextPageToken, files(id, name, mimeType, iconLink, webViewLink)',
    q: "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.folder')",
  });

  const response = await fetch(`${DRIVE_BASE_URL}/files?${queryParams.toString()}`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch files: ${errorData.error.message}`);
  }

  const data = await response.json();
  return data.files;
};

export const readGoogleDoc = async (fileId: string): Promise<string> => {
  const headers = getHeaders();
  
  // For Google Docs, we can "export" them as plain text to read them easily
  const response = await fetch(`${DRIVE_BASE_URL}/files/${fileId}/export?mimeType=text/plain`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to read document: ${response.statusText}`);
  }

  return await response.text();
};

export const createGoogleDoc = async (title: string, content: string) => {
  const headers = getHeaders();

  // 1. Create the blank document
  const createResponse = await fetch(DOCS_BASE_URL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ title }),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create document');
  }

  const doc = await createResponse.json();
  const documentId = doc.documentId;

  // 2. Insert content
  if (content) {
    const updateResponse = await fetch(`${DOCS_BASE_URL}/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              text: content,
              location: { index: 1 }, // Insert at the beginning
            },
          },
        ],
      }),
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to add content to document');
    }
  }

  return { id: documentId, title, url: `https://docs.google.com/document/d/${documentId}` };
};