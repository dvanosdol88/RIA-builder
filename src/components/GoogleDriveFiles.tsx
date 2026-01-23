import React, { useState } from 'react';
import { useAuthStore } from '../authStore';
import { getDriveFiles } from '../services/googleDriveService';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink: string;
  webViewLink: string;
}

const GoogleDriveFiles = () => {
  const { user, accessToken } = useAuthStore();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const driveFiles = await getDriveFiles();
      console.log('Fetched Drive Files:', driveFiles);
      setFiles(driveFiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render if the user is logged in
  if (!user || !accessToken) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">My Google Drive</h3>
        <button
          onClick={handleFetchFiles}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Fetch Files
        </button>
      </div>

      {isLoading && !files.length && (
        <div className="text-center py-4 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin inline-block" />
          <p>Loading files...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-center">
          <AlertCircle className="w-5 h-5 inline-block mr-2" />
          <strong>Error:</strong> {error}
        </div>
      )}

      {!isLoading && !error && files.length === 0 && (
        <div className="text-center py-4 text-gray-500 italic">
          <p>Click "Fetch Files" to see your 10 most recent Google Drive files.</p>
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id} className="border-b border-gray-100 last:border-b-0 py-2">
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group"
              >
                <img src={file.iconLink} alt="file icon" className="w-5 h-5" />
                <span className="text-sm text-gray-700 group-hover:text-blue-600 group-hover:underline truncate">
                  {file.name}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GoogleDriveFiles;
