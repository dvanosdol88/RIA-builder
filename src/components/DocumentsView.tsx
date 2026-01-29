import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Upload, Loader2, AlertCircle, FolderOpen, Camera } from 'lucide-react';
import { useDocumentStore, DocumentMeta } from '../documentStore';
import DocumentCard from './DocumentCard';
import DocumentPreviewModal from './DocumentPreviewModal';
import UploadDocumentModal from './UploadDocumentModal';
import CameraCaptureModal from './CameraCaptureModal';

export default function DocumentsView() {
  const {
    documents,
    isLoading,
    error,
    uploadError,
    searchQuery,
    setSearchQuery,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    toggleCanonical,
    getCanonicalDocuments,
    getNonCanonicalDocuments,
    getRecentTags,
  } = useDocumentStore();

  const [previewDoc, setPreviewDoc] = useState<DocumentMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recentTags = useMemo(() => getRecentTags(), [documents, getRecentTags]);
  const existingDocNames = useMemo(
    () => documents.map((doc) => doc.filename),
    [documents]
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const canonicalDocs = getCanonicalDocuments();
  const otherDocs = getNonCanonicalDocuments();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
  };

  const handleCameraCapture = (file: File) => {
    setPendingFile(file);
    setShowCamera(false);
  };

  const handleDelete = async (doc: DocumentMeta) => {
    if (
      confirm(
        `Delete "${doc.filename.replace(/"/g, '\\"')}"? This cannot be undone.`
      )
    ) {
      await deleteDocument(doc);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium mb-2">Connection Error</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadDocuments()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (uploadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium mb-2">Upload Failed</p>
          <p className="text-red-600 text-sm mb-4">{uploadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Refresh & Try Again
          </button>
        </div>
      </div>
    );
  }

  const noResults =
    searchQuery && canonicalDocs.length === 0 && otherDocs.length === 0;

  return (
    <main className="flex-1 overflow-y-auto metallic-gradient py-4 pl-8 pr-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-slate-600" />
              Documents
            </h1>
            <p className="text-slate-500 mt-1">
              Upload and manage your global document library
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowCamera(true)}
              disabled={uploading}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              title="Take Photo"
            >
              <Camera size={18} />
              <span className="hidden sm:inline">Take Photo</span>
            </button>
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {noResults && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              No documents found matching &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        )}

        {/* Canonical Documents Section */}
        {canonicalDocs.length > 0 && (
          <section className="mb-10">
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                Canonical Documents
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {canonicalDocs.length}
                </span>
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
                {canonicalDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onToggleCanonical={toggleCanonical}
                    onDelete={handleDelete}
                    onPreview={setPreviewDoc}
                    compact
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Documents Section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            {canonicalDocs.length > 0 ? 'All Other Documents' : 'All Documents'}
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {otherDocs.length}
            </span>
          </h2>

          {otherDocs.length === 0 &&
            canonicalDocs.length === 0 &&
            !searchQuery && (
              <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
                <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">No documents uploaded yet</p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-700 font-medium px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Camera size={18} />
                    Take Photo
                  </button>
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Upload size={18} />
                    Upload File
                  </button>
                </div>
              </div>
            )}

          {otherDocs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {otherDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onToggleCanonical={toggleCanonical}
                  onDelete={handleDelete}
                  onPreview={setPreviewDoc}
                />
              ))}
            </div>
          )}
        </section>

        {/* Preview Modal */}
        {previewDoc && (
          <DocumentPreviewModal
            doc={previewDoc}
            onClose={() => setPreviewDoc(null)}
          />
        )}

        {/* Camera Modal */}
        {showCamera && (
          <CameraCaptureModal
            onCapture={handleCameraCapture}
            onCancel={() => setShowCamera(false)}
          />
        )}

        {pendingFile && (
          <UploadDocumentModal
            file={pendingFile}
            recentTags={recentTags}
            existingDocNames={existingDocNames}
            isUploading={uploading}
            onCancel={() => {
              setPendingFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            onConfirm={async (metadata) => {
              setUploading(true);
              await uploadDocument(pendingFile, metadata);
              setUploading(false);
              setPendingFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
