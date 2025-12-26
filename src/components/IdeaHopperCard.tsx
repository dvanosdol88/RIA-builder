import React, { useState, useRef, useEffect } from 'react';
import {
  ExternalLink,
  Trash2,
  Tag,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  X,
  Plus,
  Check,
  Edit2,
  Link,
} from 'lucide-react';
import type { HopperIdea } from '../ideaHopperStore';

interface IdeaHopperCardProps {
  idea: HopperIdea;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: HopperIdea['status']) => void;
  onUpdate: (id: string, updates: Partial<HopperIdea>) => void;
  allTags: string[];
}

const STATUS_CONFIG: Record<
  HopperIdea['status'],
  { label: string; color: string; bgColor: string }
> = {
  new: { label: 'New', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  exploring: { label: 'Exploring', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  developing: { label: 'Developing', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  implemented: { label: 'Implemented', color: 'text-green-700', bgColor: 'bg-green-100' },
  parked: { label: 'Parked', color: 'text-slate-500', bgColor: 'bg-slate-200' },
};

const PRIORITY_ICONS: Record<HopperIdea['priority'], React.ReactNode> = {
  high: <ArrowUp size={12} className="text-red-500" />,
  medium: <Minus size={12} className="text-amber-500" />,
  low: <ArrowDown size={12} className="text-slate-400" />,
};

export default function IdeaHopperCard({
  idea,
  onSelect,
  onDelete,
  onStatusChange,
  onUpdate,
  allTags,
}: IdeaHopperCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isEditingUrls, setIsEditingUrls] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDescription, setEditDescription] = useState(idea.description);
  const [newTagInput, setNewTagInput] = useState('');
  const [newUrlInput, setNewUrlInput] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const statusConfig = STATUS_CONFIG[idea.status];
  const formattedDate = new Date(idea.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Focus inputs when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
      descriptionInputRef.current.select();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (isEditingTags && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isEditingTags]);

  useEffect(() => {
    if (isEditingUrls && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [isEditingUrls]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${idea.title}"? This cannot be undone.`)) {
      onDelete(idea.id);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(idea.id, e.target.value as HopperIdea['status']);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const startEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(idea.title);
    setIsEditingTitle(true);
  };

  const saveTitle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editTitle.trim() && editTitle.trim() !== idea.title) {
      onUpdate(idea.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const cancelEditTitle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditTitle(idea.title);
    setIsEditingTitle(false);
  };

  const startEditingDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditDescription(idea.description);
    setIsEditingDescription(true);
  };

  const saveDescription = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editDescription.trim() !== idea.description) {
      onUpdate(idea.id, { description: editDescription.trim() });
    }
    setIsEditingDescription(false);
  };

  const cancelEditDescription = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditDescription(idea.description);
    setIsEditingDescription(false);
  };

  const startEditingTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTags(true);
  };

  const removeTag = (tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTags = idea.tags.filter((tag) => tag !== tagToRemove);
    onUpdate(idea.id, { tags: newTags });
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !idea.tags.includes(trimmedTag)) {
      onUpdate(idea.id, { tags: [...idea.tags, trimmedTag] });
    }
    setNewTagInput('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTagInput);
    } else if (e.key === 'Escape') {
      setIsEditingTags(false);
      setNewTagInput('');
    }
  };

  // URL editing functions
  const startEditingUrls = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingUrls(true);
  };

  const removeUrl = (urlToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentUrls = idea.referenceUrls || [];
    const newUrls = currentUrls.filter((url) => url !== urlToRemove);
    onUpdate(idea.id, { referenceUrls: newUrls });
  };

  const addUrl = (url: string) => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      const currentUrls = idea.referenceUrls || [];
      if (!currentUrls.includes(trimmedUrl)) {
        onUpdate(idea.id, { referenceUrls: [...currentUrls, trimmedUrl] });
      }
    }
    setNewUrlInput('');
  };

  const handleUrlInputKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      addUrl(newUrlInput);
    } else if (e.key === 'Escape') {
      setIsEditingUrls(false);
      setNewUrlInput('');
    }
  };

  // Get suggestions: tags that exist but aren't on this idea
  const tagSuggestions = allTags.filter((tag) => !idea.tags.includes(tag));

  // Get URLs to display (handle migration from old format)
  const displayUrls = idea.referenceUrls?.length > 0
    ? idea.referenceUrls
    : (idea.referenceUrl ? [idea.referenceUrl] : []);

  return (
    <div
      onClick={() => onSelect(idea.id)}
      className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-slate-300 p-4 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            <span className="flex items-center gap-1" title={`Priority: ${idea.priority}`}>
              {PRIORITY_ICONS[idea.priority]}
            </span>
          </div>

          {/* Editable Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') cancelEditTitle();
                }}
                className="flex-1 text-slate-900 font-semibold text-base bg-blue-50 border border-blue-300 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={saveTitle} className="p-1 text-green-600 hover:text-green-700">
                <Check size={14} />
              </button>
              <button onClick={cancelEditTitle} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group/title">
              <h3 className="text-slate-900 font-semibold text-base leading-tight truncate">
                {idea.title}
              </h3>
              <button
                onClick={startEditingTitle}
                className="p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity"
                title="Edit title"
              >
                <Edit2 size={12} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
          title="Delete idea"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Editable Description */}
      {isEditingDescription ? (
        <div className="mb-3" onClick={(e) => e.stopPropagation()}>
          <textarea
            ref={descriptionInputRef}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancelEditDescription();
            }}
            rows={3}
            className="w-full text-slate-600 text-sm bg-blue-50 border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button onClick={saveDescription} className="p-1 text-green-600 hover:text-green-700">
              <Check size={14} />
            </button>
            <button onClick={cancelEditDescription} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="group/desc mb-3 flex items-start gap-1">
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 flex-1">
            {idea.description || <span className="text-slate-400 italic">No description</span>}
          </p>
          <button
            onClick={startEditingDescription}
            className="p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover/desc:opacity-100 transition-opacity flex-shrink-0"
            title="Edit description"
          >
            <Edit2 size={12} />
          </button>
        </div>
      )}

      {/* Editable Reference URLs */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        {isEditingUrls ? (
          <div className="space-y-2">
            {/* Current URLs with delete buttons */}
            {displayUrls.length > 0 && (
              <div className="space-y-1.5">
                {displayUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded px-2 py-1"
                  >
                    <Link size={12} className="text-blue-500 flex-shrink-0" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleLinkClick}
                      className="text-blue-600 hover:text-blue-700 text-xs truncate flex-1 hover:underline"
                    >
                      {url}
                    </a>
                    <button
                      onClick={(e) => removeUrl(url, e)}
                      className="p-0.5 text-slate-400 hover:text-red-500 flex-shrink-0"
                      title="Remove URL"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New URL input */}
            <div className="flex items-center gap-1">
              <div className="relative flex-1">
                <Link className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  ref={urlInputRef}
                  type="url"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  onKeyDown={handleUrlInputKeyDown}
                  placeholder="https://..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded pl-7 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => addUrl(newUrlInput)}
                disabled={!newUrlInput.trim()}
                className="p-1 text-blue-600 hover:text-blue-700 disabled:text-slate-300"
                title="Add URL"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditingUrls(false);
                  setNewUrlInput('');
                }}
                className="p-1 text-green-600 hover:text-green-700"
                title="Done"
              >
                <Check size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="group/urls">
            {displayUrls.length > 0 ? (
              <div className="space-y-1">
                {displayUrls.slice(0, 2).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm hover:underline"
                  >
                    <ExternalLink size={14} />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
                {displayUrls.length > 2 && (
                  <span className="text-xs text-slate-400">+{displayUrls.length - 2} more URLs</span>
                )}
                <button
                  onClick={startEditingUrls}
                  className="p-0.5 text-slate-300 hover:text-slate-500 opacity-0 group-hover/urls:opacity-100 transition-opacity"
                  title="Edit URLs"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={startEditingUrls}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <Plus size={12} />
                Add URL
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editable Tags */}
      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
        {isEditingTags ? (
          <div className="space-y-2">
            {/* Current tags with remove buttons */}
            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"
                >
                  <Tag size={10} />
                  {tag}
                  <button
                    onClick={(e) => removeTag(tag, e)}
                    className="hover:text-red-600 ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            {/* Tag suggestions */}
            {tagSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tagSuggestions.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}

            {/* New tag input */}
            <div className="flex items-center gap-1">
              <input
                ref={tagInputRef}
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tag..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => addTag(newTagInput)}
                disabled={!newTagInput.trim()}
                className="p-1 text-blue-600 hover:text-blue-700 disabled:text-slate-300"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => {
                  setIsEditingTags(false);
                  setNewTagInput('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <Check size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 group/tags">
            {idea.tags.length > 0 ? (
              <>
                {idea.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
                {idea.tags.length > 3 && (
                  <span className="text-xs text-slate-400">+{idea.tags.length - 3} more</span>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">No tags</span>
            )}
            <button
              onClick={startEditingTags}
              className="p-0.5 text-slate-300 hover:text-slate-500 opacity-0 group-hover/tags:opacity-100 transition-opacity"
              title="Edit tags"
            >
              <Edit2 size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock size={12} />
          {formattedDate}
        </div>

        <select
          value={idea.status}
          onChange={handleStatusChange}
          onClick={(e) => e.stopPropagation()}
          className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <option value="new">New</option>
          <option value="exploring">Exploring</option>
          <option value="developing">Developing</option>
          <option value="implemented">Implemented</option>
          <option value="parked">Parked</option>
        </select>
      </div>
    </div>
  );
}
