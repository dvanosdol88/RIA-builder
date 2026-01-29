import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Clock,
  Pin,
  Archive,
  ArrowRight,
  FileText,
  Link2,
  Unlink,
} from 'lucide-react';
import { Stage, useIdeaStore } from '../ideaStore';
import { useDocumentStore } from '../documentStore';
import DocumentPickerModal from './DocumentPickerModal';

interface CardDetailSidebarProps {
  ideaId: string;
  onClose: () => void;
}

const STAGE_LABELS: Record<Stage, string> = {
  current_best: '00_Current best',
  workshopping: '10_Workshopping',
  ready_to_go: '20_Ready_to_go',
  archived: '30_archived',
};

const normalizeUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export default function CardDetailSidebar({
  ideaId,
  onClose,
}: CardDetailSidebarProps) {
  const {
    ideas,
    updateIdea,
    toggleIdeaPinned,
    setIdeaStage,
    toggleIdeaFocus,
    linkDocument,
    unlinkDocument,
  } = useIdeaStore();
  const { documents, loadDocuments, linkToCard, unlinkFromCard } =
    useDocumentStore();
  const idea = ideas.find((i) => i.id === ideaId);

  const [title, setTitle] = useState(idea?.text || '');
  const [goal, setGoal] = useState(idea?.goal || '');
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (idea) {
      setTitle(idea.text);
      setGoal(idea.goal);
    }
  }, [idea?.id]);

  if (!idea) return null;

  const linkedDocs = documents.filter((d) =>
    (idea.linkedDocuments || []).includes(d.id)
  );

  const handleLinkDocument = async (docId: string) => {
    await linkDocument(idea.id, docId);
    await linkToCard(docId, idea.id);
  };

  const handleUnlinkDocument = async (docId: string) => {
    await unlinkDocument(idea.id, docId);
    await unlinkFromCard(docId, idea.id);
  };

  const handleTitleBlur = () => {
    if (title.trim() && title !== idea.text) {
      updateIdea(idea.id, { text: title });
    }
  };

  const handleGoalBlur = () => {
    updateIdea(idea.id, { goal });
    if (!goal.trim()) setShowGoalInput(false);
  };

  const addNote = () => {
    const note = {
      id: crypto.randomUUID(),
      text: '',
      timestamp: Date.now(),
    };
    const updatedNotes = [note, ...(idea.notes || [])];
    updateIdea(idea.id, { notes: updatedNotes });
    setEditingNoteId(note.id);
  };

  const updateNote = (noteId: string, text: string) => {
    const updatedNotes = (idea.notes || []).map((n) =>
      n.id === noteId ? { ...n, text } : n
    );
    updateIdea(idea.id, { notes: updatedNotes });
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = (idea.notes || []).filter((n) => n.id !== noteId);
    updateIdea(idea.id, { notes: updatedNotes });
  };

  const addImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      updateIdea(idea.id, { images: [...(idea.images || []), url] });
    }
  };

  const addReferenceUrl = () => {
    const normalizedUrl = normalizeUrl(newUrlInput);
    if (!normalizedUrl) return;
    const currentUrls = idea.referenceUrls || [];
    if (currentUrls.includes(normalizedUrl)) {
      setNewUrlInput('');
      return;
    }
    updateIdea(idea.id, { referenceUrls: [...currentUrls, normalizedUrl] });
    setNewUrlInput('');
  };

  const removeReferenceUrl = (urlToRemove: string) => {
    const currentUrls = idea.referenceUrls || [];
    const nextUrls = currentUrls.filter((url) => url !== urlToRemove);
    updateIdea(idea.id, { referenceUrls: nextUrls });
  };

  const removeImage = (index: number) => {
    const updatedImages = (idea.images || []).filter((_, i) => i !== index);
    updateIdea(idea.id, { images: updatedImages });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[500px] bg-white border-l border-gray-200 shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full text-xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0"
            placeholder="Card Title"
          />
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
        {/* Goal Section */}
        <section>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Goal
          </h3>
          {showGoalInput || goal ? (
            <textarea
              autoFocus={showGoalInput}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={handleGoalBlur}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
              placeholder="What is the goal of this card?"
            />
          ) : (
            <button
              onClick={() => setShowGoalInput(true)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
            >
              <Plus size={16} /> Add goal
            </button>
          )}
        </section>

        {/* Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Notes
            </h3>
            <button
              onClick={addNote}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Add note
            </button>
          </div>

          <div className="space-y-4">
            {(idea.notes || []).map((note) => (
              <div
                key={note.id}
                className="bg-slate-50 rounded-lg p-4 border border-slate-100 group relative"
              >
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                  <Clock size={12} />
                  {formatDate(note.timestamp)}
                </div>
                {editingNoteId === note.id ? (
                  <textarea
                    autoFocus
                    defaultValue={note.text}
                    placeholder="New note..."
                    onBlur={(e) => {
                      updateNote(note.id, e.target.value);
                      setEditingNoteId(null);
                    }}
                    className="w-full bg-white border border-blue-200 rounded p-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p
                    className={`text-sm whitespace-pre-wrap cursor-pointer ${!note.text ? 'text-slate-400 italic' : 'text-slate-700'}`}
                    onClick={() => setEditingNoteId(note.id)}
                  >
                    {note.text || 'Empty note - click to edit'}
                  </p>
                )}
                <button
                  onClick={() => deleteNote(note.id)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(!idea.notes || idea.notes.length === 0) && (
              <p className="text-sm text-slate-400 italic">No notes yet.</p>
            )}
          </div>
        </section>

        {/* Images Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Images
            </h3>
            <button
              onClick={addImage}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Add image
            </button>
          </div>

          {idea.images && idea.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {idea.images.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={addImage}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all"
            >
              <ImageIcon size={32} className="mb-2" />
              <span className="text-sm font-medium">+ Add image</span>
            </div>
          )}
        </section>

        {/* URLs Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              URLs
            </h3>
          </div>

          <div className="space-y-3">
            {(idea.referenceUrls || []).length > 0 ? (
              <div className="space-y-2">
                {(idea.referenceUrls || []).map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 group"
                  >
                    <Link2 size={14} className="text-blue-500 flex-shrink-0" />
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 truncate flex-1 hover:underline"
                    >
                      {url}
                    </a>
                    <button
                      onClick={() => removeReferenceUrl(url)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove URL"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No URLs yet.</p>
            )}

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newUrlInput}
                onChange={(e) => setNewUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addReferenceUrl();
                  }
                }}
                placeholder="https://example.com"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={addReferenceUrl}
                disabled={!newUrlInput.trim()}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                Add URL
              </button>
            </div>
          </div>
        </section>

        {/* Linked Documents Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Linked Documents
            </h3>
            <button
              onClick={() => setShowDocumentPicker(true)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1"
            >
              <Link2 size={14} /> Link Document
            </button>
          </div>

          {linkedDocs.length > 0 ? (
            <div className="space-y-2">
              {linkedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 group"
                >
                  <FileText
                    size={20}
                    className="text-slate-400 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {doc.filename}
                    </p>
                    {(doc.page || doc.section || doc.tab) && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {[doc.page, doc.section, doc.tab]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                    {(doc.tags ?? []).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(doc.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                          >
                            {tag}
                          </span>
                        ))}
                        {(doc.tags ?? []).length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{(doc.tags ?? []).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <a
                    href={doc.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleUnlinkDocument(doc.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Unlink document"
                  >
                    <Unlink size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={() => setShowDocumentPicker(true)}
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all"
            >
              <FileText size={28} className="mb-2" />
              <span className="text-sm font-medium">+ Link a document</span>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => toggleIdeaPinned(idea.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            idea.pinned
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Pin size={16} className={idea.pinned ? 'fill-amber-500' : ''} />
          {idea.pinned ? 'Pinned' : 'Pin to Current best'}
        </button>

        {idea.stage === 'workshopping' && (
          <button
            onClick={() =>
              toggleIdeaFocus(idea.id, idea.category, idea.subcategory)
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              idea.focused
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {idea.focused ? 'Unfocus' : 'Focus'}
          </button>
        )}

        {(Object.entries(STAGE_LABELS) as [Stage, string][]).map(
          ([stage, label]) => {
            if (stage === idea.stage || stage === 'archived') return null;
            return (
              <button
                key={stage}
                onClick={() => setIdeaStage(idea.id, stage)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
              >
                <ArrowRight size={16} />
                Move to {label.replace(/^\d+_/, '').replace(/_/g, ' ')}
              </button>
            );
          }
        )}

        {idea.stage !== 'archived' ? (
          <button
            onClick={() => setIdeaStage(idea.id, 'archived')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all ml-auto"
          >
            <Archive size={16} />
            Archive
          </button>
        ) : (
          <button
            onClick={() => setIdeaStage(idea.id, 'workshopping')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all ml-auto"
          >
            Restore
          </button>
        )}
      </div>

      {/* Document Picker Modal */}
      {showDocumentPicker && (
        <DocumentPickerModal
          linkedDocIds={idea.linkedDocuments || []}
          onLink={handleLinkDocument}
          onUnlink={handleUnlinkDocument}
          onClose={() => setShowDocumentPicker(false)}
        />
      )}
    </div>
  );
}
