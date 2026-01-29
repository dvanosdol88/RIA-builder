import { useAuthStore } from '../authStore';

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const DOCS_BASE_URL = 'https://docs.googleapis.com/v1/documents';

// MIME types that can be converted to Google Docs
const CONVERTIBLE_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'application/vnd.google-apps.document',
  'application/msword': 'application/vnd.google-apps.document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/vnd.google-apps.document',
  'text/plain': 'application/vnd.google-apps.document',
  'text/html': 'application/vnd.google-apps.document',
  'application/rtf': 'application/vnd.google-apps.document',
};

const getHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error('Not authenticated with Google');
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

const getAuthHeader = () => {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error('Not authenticated with Google');
  return `Bearer ${accessToken}`;
};

export const getDriveFiles = async (pageSize: number = 20, folderId?: string, mimeTypeFilter?: string) => {
  const headers = getHeaders();

  // Build query - show all file types by default
  let query = "trashed = false";

  // If a folder ID is provided, list contents of that folder
  if (folderId) {
    query += ` and '${folderId}' in parents`;
  }

  // Optional MIME type filter (e.g., only folders, only docs)
  if (mimeTypeFilter) {
    query += ` and mimeType = '${mimeTypeFilter}'`;
  }

  const queryParams = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields: 'nextPageToken, files(id, name, mimeType, iconLink, webViewLink, parents, modifiedTime, size)',
    q: query,
    orderBy: 'folder,modifiedTime desc', // Folders first, then by most recent
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

/**
 * List only folders in Google Drive
 */
export const getDriveFolders = async (parentFolderId?: string): Promise<Array<{ id: string; name: string }>> => {
  return getDriveFiles(100, parentFolderId, 'application/vnd.google-apps.folder');
};

/**
 * Create a new folder in Google Drive
 */
export const createDriveFolder = async (
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; name: string; webViewLink: string }> => {
  const headers = getHeaders();

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch(`${DRIVE_BASE_URL}/files`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create folder: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: `https://drive.google.com/drive/folders/${data.id}`,
  };
};

/**
 * Move a file to a different folder
 */
export const moveFileToFolder = async (
  fileId: string,
  targetFolderId: string,
  removeFromCurrentParents: boolean = true
): Promise<void> => {
  const headers = getHeaders();

  // First, get current parents
  const metadataResponse = await fetch(`${DRIVE_BASE_URL}/files/${fileId}?fields=parents`, {
    method: 'GET',
    headers: headers,
  });

  if (!metadataResponse.ok) {
    throw new Error('Failed to get file metadata');
  }

  const metadataData = await metadataResponse.json();
  const currentParents = metadataData.parents?.join(',') || '';

  // Build update URL with addParents and removeParents
  const params = new URLSearchParams({
    addParents: targetFolderId,
  });

  if (removeFromCurrentParents && currentParents) {
    params.append('removeParents', currentParents);
  }

  const response = await fetch(`${DRIVE_BASE_URL}/files/${fileId}?${params.toString()}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to move file: ${errorData.error?.message || response.statusText}`);
  }
};

/**
 * Rename a file or folder
 */
export const renameFile = async (fileId: string, newName: string): Promise<void> => {
  const headers = getHeaders();

  const response = await fetch(`${DRIVE_BASE_URL}/files/${fileId}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to rename file: ${errorData.error?.message || response.statusText}`);
  }
};

/**
 * Copy a file to a folder (keeps the original)
 */
export const copyFileToFolder = async (
  fileId: string,
  targetFolderId: string,
  newName?: string
): Promise<{ id: string; name: string; webViewLink: string }> => {
  const headers = getHeaders();

  const body: { parents: string[]; name?: string } = {
    parents: [targetFolderId],
  };

  if (newName) {
    body.name = newName;
  }

  const response = await fetch(`${DRIVE_BASE_URL}/files/${fileId}/copy`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to copy file: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink,
  };
};

/**
 * Search for files by name or content
 */
export const searchDriveFiles = async (
  searchQuery: string,
  pageSize: number = 20
): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink: string }>> => {
  const headers = getHeaders();

  const queryParams = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
    q: `trashed = false and (name contains '${searchQuery}' or fullText contains '${searchQuery}')`,
    orderBy: 'modifiedTime desc',
  });

  const response = await fetch(`${DRIVE_BASE_URL}/files?${queryParams.toString()}`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to search files: ${errorData.error?.message || response.statusText}`);
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

/**
 * Upload a file to Google Drive with optional conversion to Google Docs format
 * @param file - The file to upload
 * @param convertToGoogleDoc - If true, converts PDFs/Word docs to editable Google Docs
 * @returns Object containing fileId and webViewLink
 */
export const uploadFileToDrive = async (
  file: File,
  convertToGoogleDoc: boolean = true
): Promise<{ fileId: string; webViewLink: string; mimeType: string }> => {
  const authHeader = getAuthHeader();

  // Determine if we should convert this file
  const shouldConvert = convertToGoogleDoc && CONVERTIBLE_MIME_TYPES[file.type];

  // Create metadata
  const metadata: { name: string; mimeType?: string } = {
    name: file.name,
  };

  // If converting, set the target mimeType to Google Docs
  if (shouldConvert) {
    metadata.mimeType = 'application/vnd.google-apps.document';
  }

  // Use multipart upload for files with content
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const uploadParams = new URLSearchParams({
    uploadType: 'multipart',
    fields: 'id,name,mimeType,webViewLink',
  });

  const response = await fetch(`${DRIVE_UPLOAD_URL}/files?${uploadParams.toString()}`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to upload to Drive: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    mimeType: data.mimeType,
  };
};

/**
 * Delete a file from Google Drive
 */
export const deleteFromDrive = async (fileId: string): Promise<void> => {
  const headers = getHeaders();

  const response = await fetch(`${DRIVE_BASE_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: headers,
  });

  if (!response.ok && response.status !== 404) {
    const errorData = await response.json();
    throw new Error(`Failed to delete from Drive: ${errorData.error?.message || response.statusText}`);
  }
};

/**
 * Get file metadata from Google Drive
 */
export const getDriveFileMetadata = async (fileId: string): Promise<{
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  size?: string;
}> => {
  const headers = getHeaders();

  const params = new URLSearchParams({
    fields: 'id,name,mimeType,webViewLink,size',
  });

  const response = await fetch(`${DRIVE_BASE_URL}/files/${fileId}?${params.toString()}`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to get file metadata: ${errorData.error?.message || response.statusText}`);
  }

  return await response.json();
};

/**
 * Update the content of a Google Doc using batchUpdate
 * This replaces the entire document content with new content
 */
export const updateDocumentContent = async (
  documentId: string,
  newContent: string
): Promise<void> => {
  const headers = getHeaders();

  // First, get the current document to find its length
  const docResponse = await fetch(`${DOCS_BASE_URL}/${documentId}`, {
    method: 'GET',
    headers: headers,
  });

  if (!docResponse.ok) {
    throw new Error(`Failed to read document: ${docResponse.statusText}`);
  }

  const docData = await docResponse.json();
  const endIndex = docData.body?.content?.slice(-1)?.[0]?.endIndex || 1;

  // Build requests array: delete existing content (if any), then insert new content
  const requests: Array<Record<string, unknown>> = [];

  // Delete existing content (if document has content beyond the initial newline)
  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex: endIndex - 1,
        },
      },
    });
  }

  // Insert new content
  if (newContent) {
    requests.push({
      insertText: {
        text: newContent,
        location: { index: 1 },
      },
    });
  }

  if (requests.length === 0) {
    return; // Nothing to update
  }

  const updateResponse = await fetch(`${DOCS_BASE_URL}/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ requests }),
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json();
    throw new Error(`Failed to update document: ${errorData.error?.message || updateResponse.statusText}`);
  }
};

/**
 * Append content to a Google Doc
 */
export const appendToDocument = async (
  documentId: string,
  content: string
): Promise<void> => {
  const headers = getHeaders();

  // Get current document to find the end index
  const docResponse = await fetch(`${DOCS_BASE_URL}/${documentId}`, {
    method: 'GET',
    headers: headers,
  });

  if (!docResponse.ok) {
    throw new Error(`Failed to read document: ${docResponse.statusText}`);
  }

  const docData = await docResponse.json();
  const endIndex = docData.body?.content?.slice(-1)?.[0]?.endIndex || 1;

  const updateResponse = await fetch(`${DOCS_BASE_URL}/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: content,
            location: { index: endIndex - 1 },
          },
        },
      ],
    }),
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json();
    throw new Error(`Failed to append to document: ${errorData.error?.message || updateResponse.statusText}`);
  }
};

/**
 * Check if a file type can be converted to Google Docs
 */
export const canConvertToGoogleDoc = (mimeType: string): boolean => {
  return mimeType in CONVERTIBLE_MIME_TYPES;
};