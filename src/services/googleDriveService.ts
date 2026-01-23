import { useAuthStore } from '../authStore';

const BASE_URL = 'https://www.googleapis.com/drive/v3';

export const getDriveFiles = async (pageSize: number = 10) => {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }

  const headers = new Headers({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  // Fetch the user's "My Drive" root folder to start, listing files inside it.
  // You can customize the 'q' parameter for more complex queries.
  const queryParams = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields: 'nextPageToken, files(id, name, mimeType, iconLink, webViewLink)',
    q: "'root' in parents and trashed = false",
  });

  const response = await fetch(`${BASE_URL}/files?${queryParams.toString()}`, {
    method: 'GET',
    headers: headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google Drive API error:', errorData);
    throw new Error(`Failed to fetch files: ${errorData.error.message}`);
  }

  const data = await response.json();
  return data.files;
};
