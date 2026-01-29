import React, { useState, useEffect, useRef } from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { readGoogleDoc } from '../services/googleDriveService';
import type { DocumentMeta } from '../documentStore';

interface DocumentPreviewModalProps {
  doc: DocumentMeta;
  onClose: () => void;
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const TEXT_EXTENSIONS = ['txt', 'md', 'html'];
const GOOGLE_DOCS_MIME = 'application/vnd.google-apps.document';

export default function DocumentPreviewModal({
  doc,
  onClose,
}: DocumentPreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Check if this is a Google Doc (converted from PDF/Word)
  const isGoogleDoc = doc.driveMimeType === GOOGLE_DOCS_MIME;
  const isImage = !isGoogleDoc && IMAGE_EXTENSIONS.includes(doc.fileType);
  const isText = TEXT_EXTENSIONS.includes(doc.fileType);
  const isPdf = doc.fileType === 'pdf';
  const contextParts = [doc.page, doc.section, doc.tab].filter(Boolean);
  const tags = doc.tags ?? [];

  // Get the appropriate URL for images stored in Google Drive
  const getImageUrl = () => {
    if (doc.driveFileId) {
      // Use Google Drive's direct link format for images
      return `https://drive.google.com/uc?export=view&id=${doc.driveFileId}`;
    }
    return doc.storageUrl;
  };

  useEffect(() => {
    let isActive = true;

    // For Google Docs, fetch the text content
    if (isGoogleDoc && doc.driveFileId) {
      setLoading(true);
      setLoadError(null);
      readGoogleDoc(doc.driveFileId)
        .then((text) => {
          if (!isActive) return;
          setTextContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load Google Doc content:', err);
          if (!isActive) return;
          setLoadError('Preview unavailable. Click "Open in Google Docs" to view.');
          setLoading(false);
        });
    }
    // For plain text files (not converted), try to load from Drive
    else if (isText && doc.driveFileId) {
      setLoading(true);
      setLoadError(null);
      readGoogleDoc(doc.driveFileId)
        .then((text) => {
          if (!isActive) return;
          setTextContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load text content:', err);
          if (!isActive) return;
          setLoadError('Preview unavailable. Use Open or Download.');
          setLoading(false);
        });
    }

    return () => {
      isActive = false;
    };
  }, [doc, isText, isGoogleDoc]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 truncate">
              {doc.filename}
            </h2>
            {doc.summary && (
              <p className="text-xs text-blue-600 font-medium italic mt-0.5 line-clamp-1">
                {doc.summary}
              </p>
            )}
            {(contextParts.length > 0 || tags.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                {contextParts.length > 0 && (
                  <span>{contextParts.join(' • ')}</span>
                )}
                {tags.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={doc.storageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={20} />
            </a>
            <a
              href={doc.storageUrl}
              download={doc.filename}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              title="Download"
            >
              <Download size={20} />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50 flex items-center justify-center">
          {/* Google Docs (converted PDFs/Word docs) - show text preview with link to edit */}
          {isGoogleDoc && (
            <div className="w-full h-full flex flex-col">
              <div className="mb-4 flex items-center justify-center gap-4">
                <a
                  href={doc.storageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <FileText size={20} />
                  Open in Google Docs
                </a>
                <span className="text-sm text-slate-500">
                  (Editable by GenConsult)
                </span>
              </div>
              <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 overflow-auto">
                {loading && (
                  <div className="text-center text-slate-400">Loading preview...</div>
                )}
                {!loading && loadError && (
                  <div className="text-center text-slate-500">{loadError}</div>
                )}
                {!loading && !loadError && textContent && (
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                    {textContent}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Images */}
          {isImage && (
            <img
              src={getImageUrl()}
              alt={doc.filename}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          )}

          {/* Text files (not converted to Google Docs) */}
          {isText && !isGoogleDoc && (
            <div className="w-full h-full bg-white rounded-lg border border-slate-200 p-6 overflow-auto">
              {loading && (
                <div className="text-center text-slate-400">Loading...</div>
              )}
              {!loading && loadError && (
                <div className="text-center text-slate-500">{loadError}</div>
              )}
              {!loading && !loadError && doc.fileType === 'html' && (
                <div dangerouslySetInnerHTML={{ __html: textContent || '' }} />
              )}
              {!loading && !loadError && doc.fileType !== 'html' && (
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                  {textContent}
                </pre>
              )}
            </div>
          )}

          {/* PDFs (legacy - not converted) */}
          {isPdf && !isGoogleDoc && (
            <iframe
              src={`${doc.storageUrl}#toolbar=0`}
              className="w-full h-full rounded-lg shadow-lg bg-white"
              title={doc.filename}
            />
          )}

          {/* Unknown file types */}
          {!isImage && !isText && !isPdf && !isGoogleDoc && (
            <div className="text-center">
              <p className="text-slate-500 mb-4">
                Preview not available for this file type.
              </p>
              <a
                href={doc.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Download size={20} />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
