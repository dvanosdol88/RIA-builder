import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Tag, X } from 'lucide-react';
import {
  analyzeDocument,
  DocumentSuggestions,
} from '../services/documentAnalysisService';
import {
  extractText,
  generatePdfThumbnail,
} from '../utils/documentTextExtractor';

interface UploadDocumentModalProps {
  file: File;
  recentTags: string[];
  existingDocNames: string[];
  isUploading: boolean;
  onCancel: () => void;
  onConfirm: (metadata: {
    page?: string;
    section?: string;
    tab?: string;
    tags: string[];
    summary?: string;
    thumbnailUrl?: string;
  }) => void;
}

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function UploadDocumentModal({
  file,
  recentTags,
  existingDocNames,
  isUploading,
  onCancel,
  onConfirm,
}: UploadDocumentModalProps) {
  const [page, setPage] = useState('');
  const [section, setSection] = useState('');
  const [tab, setTab] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(
    undefined
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<DocumentSuggestions | null>(
    null
  );

  const normalizedRecentTags = useMemo(
    () => recentTags.filter((tag) => !tags.includes(tag)),
    [recentTags, tags]
  );

  useEffect(() => {
    let isActive = true;

    const runAnalysis = async () => {
      setIsAnalyzing(true);
      setSuggestions(null);
      try {
        // Run thumbnail generation and text extraction in parallel
        const [extractedText, thumb] = await Promise.all([
          extractText(file),
          file.type === 'application/pdf'
            ? generatePdfThumbnail(file)
            : Promise.resolve(null),
        ]);

        if (!isActive) return;

        if (thumb) {
          setThumbnailUrl(thumb);
        }

        const analysis = await analyzeDocument({
          text: extractedText,
          filename: file.name,
          existingTags: recentTags,
          existingDocNames,
        });
        if (!isActive) return;
        setSuggestions(analysis);
        setPage((prev) => prev || analysis.suggestedPage || '');
        setSection((prev) => prev || analysis.suggestedSection || '');
        setTags((prev) =>
          prev.length > 0 ? prev : analysis.suggestedTags || []
        );
      } catch (error) {
        console.error('Document analysis failed:', error);
      } finally {
        if (isActive) {
          setIsAnalyzing(false);
        }
      }
    };

    runAnalysis();

    return () => {
      isActive = false;
    };
  }, [existingDocNames, file, recentTags]);

  const addTags = (incoming: string[]) => {
    if (incoming.length === 0) return;
    setTags((prev) => {
      const next = [...prev];
      for (const tag of incoming) {
        if (!next.includes(tag)) {
          next.push(tag);
        }
      }
      return next;
    });
  };

  const handleTagInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const parsed = parseTags(tagInput);
      addTags(parsed);
      setTagInput('');
    }
  };

  const handleTagInputBlur = () => {
    const parsed = parseTags(tagInput);
    addTags(parsed);
    setTagInput('');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Add context and tags
            </h2>
            <p className="text-sm text-slate-500 truncate max-w-[28rem]">
              {file.name}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing document...</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Page
              </label>
              <input
                value={page}
                onChange={(event) => setPage(event.target.value)}
                placeholder="e.g. Client Portal"
                className="mt-2 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Section
              </label>
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="e.g. Documents"
                className="mt-2 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Tab
              </label>
              <input
                value={tab}
                onChange={(event) => setTab(event.target.value)}
                placeholder="e.g. Uploads"
                className="mt-2 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {suggestions?.summary && (
            <p className="text-xs text-slate-400">
              AI suggested: {suggestions.summary}
            </p>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tags
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1"
                >
                  <Tag size={12} />
                  {tag}
                  <button
                    onClick={() =>
                      setTags((prev) => prev.filter((item) => item !== tag))
                    }
                    className="ml-1 text-blue-500 hover:text-blue-700"
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-slate-400">
                  No tags added yet.
                </span>
              )}
            </div>
            <input
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onBlur={handleTagInputBlur}
              placeholder="Add tags (comma separated)"
              className="mt-3 w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {normalizedRecentTags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                  Recent tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {normalizedRecentTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTags([tag])}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm({
                page: page.trim() || undefined,
                section: section.trim() || undefined,
                tab: tab.trim() || undefined,
                tags,
                summary: suggestions?.summary,
                thumbnailUrl,
              })
            }
            disabled={isUploading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            type="button"
          >
            {isUploading ? 'Uploading...' : 'Upload document'}
          </button>
        </div>
      </div>
    </div>
  );
}
