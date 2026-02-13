import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  CATEGORY_STRUCTURE,
  Category,
  Idea,
  Stage,
  useIdeaStore,
  PAGE_NAME_MAX_LENGTH,
  PAGE_DESCRIPTION_MAX_LENGTH,
} from './ideaStore';
import {
  Search,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  FolderOpen,
  Lightbulb,
  CheckSquare,
  User,
  Pencil,
  Trash2,
  GripVertical,
  List,
  Rocket,
  Megaphone,
  Briefcase,
  Cpu,
  Scale,
  Map,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import GeminiSidebar from './components/GeminiSidebar';
import CollapsibleSection from './components/CollapsibleSection';
import CardDetailSidebar from './components/CardDetailSidebar';
import DocumentsView from './components/DocumentsView';
import IdeaHopperView from './components/IdeaHopperView';
import TodoView from './components/TodoView';
import OutlineView from './components/OutlineView';
import PreLaunchChecklistView from './components/PreLaunchChecklistView';
import Auth from './components/Auth';
import ResizableSidebar from './components/ResizableSidebar';
import MapsView from './components/MapsView';
import CapacityCalculator from './components/CapacityCalculator';
import { useDocumentStore } from './documentStore';
import { Tag, FileType, XCircle } from 'lucide-react';

// Deterministic color assignment for tag pills
const TAG_PILL_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', activeBg: 'bg-blue-600', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', activeBg: 'bg-emerald-600', border: 'border-emerald-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', activeBg: 'bg-purple-600', border: 'border-purple-200' },
  { bg: 'bg-pink-100', text: 'text-pink-700', activeBg: 'bg-pink-600', border: 'border-pink-200' },
  { bg: 'bg-amber-100', text: 'text-amber-700', activeBg: 'bg-amber-600', border: 'border-amber-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', activeBg: 'bg-teal-600', border: 'border-teal-200' },
  { bg: 'bg-rose-100', text: 'text-rose-700', activeBg: 'bg-rose-600', border: 'border-rose-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', activeBg: 'bg-indigo-600', border: 'border-indigo-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', activeBg: 'bg-cyan-600', border: 'border-cyan-200' },
  { bg: 'bg-orange-100', text: 'text-orange-700', activeBg: 'bg-orange-600', border: 'border-orange-200' },
];

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_PILL_COLORS[Math.abs(hash) % TAG_PILL_COLORS.length];
}

const FILE_TYPE_COLORS: Record<string, { bg: string; text: string; activeBg: string; border: string }> = {
  pdf: { bg: 'bg-red-100', text: 'text-red-700', activeBg: 'bg-red-600', border: 'border-red-200' },
  jpg: { bg: 'bg-sky-100', text: 'text-sky-700', activeBg: 'bg-sky-600', border: 'border-sky-200' },
  jpeg: { bg: 'bg-sky-100', text: 'text-sky-700', activeBg: 'bg-sky-600', border: 'border-sky-200' },
  png: { bg: 'bg-sky-100', text: 'text-sky-700', activeBg: 'bg-sky-600', border: 'border-sky-200' },
  gif: { bg: 'bg-sky-100', text: 'text-sky-700', activeBg: 'bg-sky-600', border: 'border-sky-200' },
  webp: { bg: 'bg-sky-100', text: 'text-sky-700', activeBg: 'bg-sky-600', border: 'border-sky-200' },
  doc: { bg: 'bg-blue-100', text: 'text-blue-700', activeBg: 'bg-blue-600', border: 'border-blue-200' },
  docx: { bg: 'bg-blue-100', text: 'text-blue-700', activeBg: 'bg-blue-600', border: 'border-blue-200' },
  xls: { bg: 'bg-green-100', text: 'text-green-700', activeBg: 'bg-green-600', border: 'border-green-200' },
  xlsx: { bg: 'bg-green-100', text: 'text-green-700', activeBg: 'bg-green-600', border: 'border-green-200' },
  csv: { bg: 'bg-green-100', text: 'text-green-700', activeBg: 'bg-green-600', border: 'border-green-200' },
  txt: { bg: 'bg-slate-100', text: 'text-slate-700', activeBg: 'bg-slate-600', border: 'border-slate-200' },
  md: { bg: 'bg-slate-100', text: 'text-slate-700', activeBg: 'bg-slate-600', border: 'border-slate-200' },
  html: { bg: 'bg-orange-100', text: 'text-orange-700', activeBg: 'bg-orange-600', border: 'border-orange-200' },
};

const DEFAULT_FILE_TYPE_COLOR = { bg: 'bg-gray-100', text: 'text-gray-600', activeBg: 'bg-gray-600', border: 'border-gray-200' };

function getFileTypeColor(fileType: string) {
  return FILE_TYPE_COLORS[fileType] || DEFAULT_FILE_TYPE_COLOR;
}

type ActiveView =
  | 'construction'
  | 'documents'
  | 'ideaHopper'
  | 'todo'
  | 'outline'
  | 'preLaunchChecklist'
  | 'calculator';

// Helper to render category icon using lucide-react icons keyed in CATEGORY_STRUCTURE.
const CategoryIcon = ({
  category,
  size = 16,
}: {
  category: Category;
  size?: number;
}) => {
  const iconKey = CATEGORY_STRUCTURE[category].emoji;
  switch (iconKey) {
    case 'megaphone':
      return <Megaphone size={size} className="inline" />;
    case 'user':
      return <User size={size} className="inline" />;
    case 'briefcase':
      return <Briefcase size={size} className="inline" />;
    case 'cpu':
      return <Cpu size={size} className="inline" />;
    case 'scale':
      return <Scale size={size} className="inline" />;
    case 'map':
      return <Map size={size} className="inline" />;
    default:
      return <span>{iconKey}</span>;
  }
};

const STAGE_LABELS: Record<Stage, string> = {
  current_best: '00_Current best',
  workshopping: '10_Workshopping',
  ready_to_go: '20_Ready_to_go',
  archived: '30_archived',
};

export default function ConstructionZone() {
  const {
    ideas,
    customPages,
    pageOrders,
    isLoading,
    error,
    loadIdeas,
    addIdea,
    toggleIdeaPinned,
    // Custom pages
    addCustomPage,
    deleteCustomPage,
    renameCustomPage,
    updateCustomPageDescription,
    getPagesForCategory,
    getPageDescription,
    getIdeasForPage,
    isCustomPage,
    reorderPages,
  } = useIdeaStore();

  const {
    selectedTags,
    selectedFileTypes,
    toggleTagFilter,
    toggleFileTypeFilter,
    clearFilters,
    getAllTags,
    getAllFileTypes,
    documents: allDocuments,
  } = useDocumentStore();

  const [activeView, setActiveView] = useState<ActiveView>('construction');
  const [activeTab, setActiveTab] = useState<Category>('A');

  // Load ideas from Firebase on mount
  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);
  const [activePage, setActivePage] = useState<string>(
    CATEGORY_STRUCTURE['A'].pages[0].name
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  // Custom pages state
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageDescription, setNewPageDescription] = useState('');
  const [newPageError, setNewPageError] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string | null>(null);
  const [editPageValue, setEditPageValue] = useState('');
  const [editPageDescription, setEditPageDescription] = useState('');
  const [editPageError, setEditPageError] = useState<string | null>(null);
  const [deleteConfirmPage, setDeleteConfirmPage] = useState<{
    id: string;
    name: string;
    ideaCount: number;
  } | null>(null);
  const addPageInputRef = useRef<HTMLInputElement>(null);
  const editPageInputRef = useRef<HTMLInputElement>(null);
  const [draggedPage, setDraggedPage] = useState<string | null>(null);
  const [dragOverPage, setDragOverPage] = useState<string | null>(null);

  const handleTabChange = (tab: Category) => {
    setActiveView('construction');
    setActiveTab(tab);
    const pages = getPagesForCategory(tab);
    setActivePage(pages[0] || CATEGORY_STRUCTURE[tab].pages[0].name);
    // Reset any add/edit states
    setIsAddingPage(false);
    setEditingPageName(null);
    setIsAddingItem(false);
    setNewItemText('');
  };

  // Get pages for the current category (default + custom)
  const currentPages = useMemo(
    () => getPagesForCategory(activeTab),
    [activeTab, customPages, pageOrders, getPagesForCategory]
  );

  // Custom page handlers
  const handleStartAddPage = () => {
    setIsAddingPage(true);
    setNewPageName('');
    setNewPageDescription('');
    setNewPageError(null);
    setTimeout(() => addPageInputRef.current?.focus(), 0);
  };

  const handleCancelAddPage = () => {
    setIsAddingPage(false);
    setNewPageName('');
    setNewPageDescription('');
    setNewPageError(null);
  };

  const handleConfirmAddPage = async () => {
    const result = await addCustomPage(
      activeTab,
      newPageName,
      newPageDescription
    );
    if (result.success) {
      setIsAddingPage(false);
      setNewPageName('');
      setNewPageDescription('');
      setNewPageError(null);
      // Switch to the new page
      setActivePage(newPageName.trim());
    } else {
      setNewPageError(result.error || 'Failed to add page');
    }
  };

  const handleStartRenamePage = (pageName: string) => {
    setEditingPageName(pageName);
    setEditPageValue(pageName);
    setEditPageDescription(getPageDescription(activeTab, pageName));
    setEditPageError(null);
    setTimeout(() => editPageInputRef.current?.focus(), 0);
  };

  const handleCancelRenamePage = () => {
    setEditingPageName(null);
    setEditPageValue('');
    setEditPageDescription('');
    setEditPageError(null);
  };

  const handleConfirmRenamePage = async () => {
    if (!editingPageName) return;

    // Find the custom page by name
    const customPage = customPages.find(
      (p) => p.category === activeTab && p.pageName === editingPageName
    );
    if (!customPage) return;

    // Rename page if name changed
    if (editPageValue.trim() !== editingPageName) {
      const result = await renameCustomPage(customPage.id, editPageValue);
      if (!result.success) {
        setEditPageError(result.error || 'Failed to rename page');
        return;
      }
      // Update active page if we renamed the current page
      if (activePage === editingPageName) {
        setActivePage(editPageValue.trim());
      }
    }

    // Update description (always update to capture any changes)
    const descResult = await updateCustomPageDescription(
      customPage.id,
      editPageDescription
    );
    if (!descResult.success) {
      setEditPageError(descResult.error || 'Failed to update description');
      return;
    }

    // Success - close edit mode
    setEditingPageName(null);
    setEditPageValue('');
    setEditPageDescription('');
    setEditPageError(null);
  };

  const handleStartDeletePage = (pageName: string) => {
    const customPage = customPages.find(
      (p) => p.category === activeTab && p.pageName === pageName
    );
    if (!customPage) return;

    const ideasInPage = getIdeasForPage(activeTab, pageName);
    setDeleteConfirmPage({
      id: customPage.id,
      name: pageName,
      ideaCount: ideasInPage.length,
    });
  };

  const handleConfirmDeletePage = async (action: 'delete' | 'archive') => {
    if (!deleteConfirmPage) return;

    // If we're deleting the currently active page, switch to first page
    if (activePage === deleteConfirmPage.name) {
      const pages = getPagesForCategory(activeTab);
      const newActivePage =
        pages.find((p) => p !== deleteConfirmPage.name) ||
        CATEGORY_STRUCTURE[activeTab].pages[0].name;
      setActivePage(newActivePage);
    }

    await deleteCustomPage(deleteConfirmPage.id, action);
    setDeleteConfirmPage(null);
  };

  const handleDragStart = (e: React.DragEvent, page: string) => {
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
    // Set a ghost image or just let it be
  };

  const handleDragOver = (e: React.DragEvent, page: string) => {
    e.preventDefault();
    if (!draggedPage || draggedPage === page) return;
    setDragOverPage(page);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPage: string) => {
    e.preventDefault();
    setDragOverPage(null);
    if (!draggedPage || draggedPage === targetPage) {
      setDraggedPage(null);
      return;
    }

    const pages = [...getPagesForCategory(activeTab)];
    const draggedIndex = pages.indexOf(draggedPage);
    const targetIndex = pages.indexOf(targetPage);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedPage(null);
      return;
    }

    // Reorder
    pages.splice(draggedIndex, 1);
    pages.splice(targetIndex, 0, draggedPage);

    reorderPages(activeTab, pages);
    setDraggedPage(null);
  };

  const handleCancelDeletePage = () => {
    setDeleteConfirmPage(null);
  };

  const filteredItems = useMemo(() => {
    return ideas.filter((idea) => {
      if (!idea || !idea.text) return false;
      const matchesContext =
        idea.category === activeTab && idea.subcategory === activePage;
      const matchesSearch = idea.text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesContext && matchesSearch;
    });
  }, [ideas, activeTab, activePage, searchQuery]);

  const pinnedItems = useMemo(
    () =>
      filteredItems.filter(
        (idea) => idea.pinned || idea.stage === 'current_best'
      ),
    [filteredItems]
  );

  const workshoppingItems = useMemo(
    () =>
      filteredItems.filter(
        (idea) => idea.stage === 'workshopping' && !idea.pinned
      ),
    [filteredItems]
  );

  const readyItems = useMemo(
    () =>
      filteredItems.filter(
        (idea) => idea.stage === 'ready_to_go' && !idea.pinned
      ),
    [filteredItems]
  );

  const archivedItems = useMemo(
    () => filteredItems.filter((idea) => idea.stage === 'archived'),
    [filteredItems]
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    addIdea({
      text: newItemText,
      category: activeTab,
      subcategory: activePage,
      timestamp: Date.now(),
      type: 'idea',
      notes: [],
    });

    setNewItemText('');
    setIsAddingItem(false);
  };

  const handleStartAddItem = () => {
    setIsAddingItem(true);
    setTimeout(() => newItemInputRef.current?.focus(), 0);
  };

  const handleCancelAddItem = () => {
    setIsAddingItem(false);
    setNewItemText('');
  };

  const IdeaCard = ({ idea }: { idea: Idea }) => {
    const stageName = STAGE_LABELS[idea.stage];
    const displayName = stageName.replace(/^\d+_/, '').replace(/_/g, ' ');

    const isFocused = idea.focused === true && idea.stage === 'workshopping';
    const focusClasses = isFocused
      ? 'border-4 border-red-500 focus-pulse'
      : 'border border-slate-200';

    return (
      <div
        className={`bg-white ${focusClasses} rounded-md shadow-sm hover:shadow-md hover:border-slate-300 p-3 space-y-2 transition-shadow group cursor-pointer`}
        onClick={() => setSelectedIdeaId(idea.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
              {displayName}
            </div>
            <p className="text-slate-900 font-medium leading-snug">
              {idea.text}
            </p>

            {/* Goal Preview - First 2 lines */}
            {idea.goal && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Goal
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {idea.goal}
                </p>
              </div>
            )}

            {/* Notes Preview - First 2 lines of combined notes */}
            {idea.notes && idea.notes.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Notes
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
                  {idea.notes.map((n) => n.text).join(' • ')}
                </p>
              </div>
            )}

            {/* URLs Preview */}
            <div className="mt-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                URLs
              </p>
              {idea.referenceUrls && idea.referenceUrls.length > 0 ? (
                <div className="space-y-0.5">
                  {idea.referenceUrls.slice(0, 2).map((url, index) => (
                    <p
                      key={`${url}-${index}`}
                      className="text-xs text-slate-600 truncate"
                    >
                      {url}
                    </p>
                  ))}
                  {idea.referenceUrls.length > 2 && (
                    <p className="text-[10px] text-slate-400">
                      +{idea.referenceUrls.length - 2} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No URLs yet.</p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleIdeaPinned(idea.id);
            }}
            className={`text-xs px-2 py-0.5 rounded border transition-all shrink-0 ${
              idea.pinned
                ? 'border-amber-400 bg-amber-50 text-amber-700 opacity-100'
                : 'border-transparent text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100'
            }`}
          >
            {idea.pinned ? 'Unpin' : 'Pin'}
          </button>
        </div>
      </div>
    );
  };

  const renderSidebarContent = () => (
    <nav className="h-full flex flex-col pt-6 pb-4 overflow-y-auto no-scrollbar overflow-x-hidden">
      {/* Page Navigation (only in construction view) */}
      {activeView === 'construction' && (
        <div className="space-y-1 px-3 flex-1">
          {currentPages.map((page) => {
            const isCustom = isCustomPage(activeTab, page);
            const isEditing = editingPageName === page;

            // Render rename input for custom pages being edited
            if (isEditing) {
              return (
                <div
                  key={page}
                  className="space-y-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <input
                    ref={editPageInputRef}
                    type="text"
                    value={editPageValue}
                    onChange={(e) => setEditPageValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey)
                        handleConfirmRenamePage();
                      if (e.key === 'Escape') handleCancelRenamePage();
                    }}
                    maxLength={PAGE_NAME_MAX_LENGTH}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Page name..."
                  />
                  <textarea
                    value={editPageDescription}
                    onChange={(e) => setEditPageDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleCancelRenamePage();
                    }}
                    maxLength={PAGE_DESCRIPTION_MAX_LENGTH}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Description (optional)..."
                  />
                  {editPageError && (
                    <p className="text-xs text-red-500 px-1">
                      {editPageError}
                    </p>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={handleCancelRenamePage}
                      className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRenamePage}
                      className="flex-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      Save
                    </button>
                  </div>
                </div>
              );
            }

            // Render normal page button
            return (
              <div
                key={page}
                draggable={!isAddingPage && !editingPageName}
                onDragStart={(e) => handleDragStart(e, page)}
                onDragOver={(e) => handleDragOver(e, page)}
                onDragLeave={() => setDragOverPage(null)}
                onDrop={(e) => handleDrop(e, page)}
                className={`group relative flex items-center rounded-lg transition-all ${
                  activePage === page
                    ? 'bg-white shadow-sm border border-gray-200'
                    : 'hover:bg-gray-100'
                } ${draggedPage === page ? 'opacity-40' : 'opacity-100'} ${
                  dragOverPage === page
                    ? 'border-t-2 border-t-blue-500'
                    : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="pl-2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                  <GripVertical size={14} />
                </div>

                <button
                  onClick={() => {
                    setActivePage(page);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex-1 text-left px-2 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${
                    activePage === page ? 'text-blue-700' : 'text-gray-600'
                  }`}
                >
                  <span className="truncate">{page}</span>
                  <span
                    className={`text-[10px] ml-2 px-1.5 py-0.5 rounded-full ${
                      activePage === page
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {
                      ideas.filter(
                        (i) =>
                          i.category === activeTab &&
                          i.subcategory === page &&
                          i.stage !== 'archived'
                      ).length
                    }
                  </span>
                </button>

                {/* Edit/Delete buttons for custom pages */}
                {isCustom && (
                  <div className="absolute right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRenamePage(page);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Rename page"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartDeletePage(page);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete page"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Page Input */}
          {isAddingPage ? (
            <div className="space-y-2 mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <input
                ref={addPageInputRef}
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey)
                    handleConfirmAddPage();
                  if (e.key === 'Escape') handleCancelAddPage();
                }}
                maxLength={PAGE_NAME_MAX_LENGTH}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Page name..."
              />
              <textarea
                value={newPageDescription}
                onChange={(e) => setNewPageDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelAddPage();
                }}
                maxLength={PAGE_DESCRIPTION_MAX_LENGTH}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Description (optional)..."
              />
              {newPageError && (
                <p className="text-xs text-red-500 px-1">{newPageError}</p>
              )}
              <div className="flex gap-1">
                <button
                  onClick={handleCancelAddPage}
                  className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddPage}
                  className="flex-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartAddPage}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 mt-2"
            >
              <Plus size={16} />
              Add Page
            </button>
          )}
        </div>
      )}

      {/* Documents filter panel (mobile) */}
      {activeView === 'documents' && (() => {
        const allTags = getAllTags();
        const allTypes = getAllFileTypes();
        const hasFilters = selectedTags.length > 0 || selectedFileTypes.length > 0;

        return (
          <div className="flex-1 px-3 space-y-5 overflow-y-auto no-scrollbar">
            {hasFilters && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {selectedTags.length + selectedFileTypes.length} filter{selectedTags.length + selectedFileTypes.length !== 1 ? 's' : ''} active
                </span>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <XCircle size={12} />
                  Clear
                </button>
              </div>
            )}
            {allTags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag size={12} className="text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(({ tag, count }) => {
                    const isSelected = selectedTags.includes(tag);
                    const color = getTagColor(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTagFilter(tag)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                          isSelected
                            ? `${color.activeBg} text-white border-transparent shadow-sm`
                            : `${color.bg} ${color.text} ${color.border} hover:shadow-sm`
                        }`}
                      >
                        {tag}
                        <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'opacity-50'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {allTypes.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <FileType size={12} className="text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">File Type</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTypes.map(({ type, count }) => {
                    const isSelected = selectedFileTypes.includes(type);
                    const color = getFileTypeColor(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleFileTypeFilter(type)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                          isSelected
                            ? `${color.activeBg} text-white border-transparent shadow-sm`
                            : `${color.bg} ${color.text} ${color.border} hover:shadow-sm`
                        }`}
                      >
                        .{type}
                        <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'opacity-50'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {allTags.length === 0 && allTypes.length === 0 && (
              <div className="text-center py-8">
                <Tag size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Upload documents with tags to see filters here</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Spacer for other non-construction views */}
      {activeView !== 'construction' && activeView !== 'documents' && <div className="flex-1" />}

      {/* Utility Tabs Section */}
      <div className="px-3 py-3 border-t border-b border-gray-200 mt-4 space-y-1">
        {[
          { id: 'outline', label: 'Outline', icon: List },
          { id: 'todo', label: 'To Do', icon: CheckSquare },
          { id: 'preLaunchChecklist', label: 'Pre-Launch', icon: Rocket },
          { id: 'ideaHopper', label: 'Idea Hopper', icon: Lightbulb },
          { id: 'documents', label: 'Documents', icon: FolderOpen },
          { id: 'calculator', label: 'Capacity', icon: TrendingUp },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id as ActiveView);
              setMobileSidebarOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeView === item.id
                ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Build Stats */}
      <div className="px-6 pt-4 mx-3">
        <div className="text-xs text-gray-400 mb-2">Build Stats</div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-1/4"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Setup</span>
          <span>25%</span>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="h-screen flex flex-col bg-white text-slate-800 font-sans">
      {/* Lighter Top Navbar */}
      <header className="bg-slate-500 text-white py-0 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center overflow-x-auto no-scrollbar">
          <div className="font-bold text-lg py-4 w-52 shrink-0 pl-6 border-r border-slate-400 whitespace-nowrap flex items-center">
            {/* Hamburger Menu - Mobile Only */}
            <button
              className="md:hidden p-2 text-white hover:bg-slate-600 rounded-lg mr-2"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            RIA Builder
          </div>
          <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hide">
            {/* Only Category Tabs in Top Nav */}
            {(Object.keys(CATEGORY_STRUCTURE) as Category[]).map((key) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-4 py-4 text-sm font-medium transition-colors border-b-4 whitespace-nowrap flex-shrink-0 ${
                  activeView === 'construction' && activeTab === key
                    ? 'border-blue-400 text-white bg-slate-600'
                    : 'border-transparent text-slate-200 hover:text-white hover:bg-slate-600'
                }`}
              >
                <span className="mr-2">
                  <CategoryIcon category={key} />
                </span>
                {CATEGORY_STRUCTURE[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 py-2 pr-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search everything..."
              className="bg-slate-600 border-none rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-300 focus:ring-1 focus:ring-blue-400 w-40 md:w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setGeminiOpen(!geminiOpen)}
            className={`p-2 rounded-full transition-colors ai-glow text-white`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <Auth />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Always visible */}
        <ResizableSidebar
          initialWidth={260}
          minWidth={200}
          maxWidth={480}
          className="bg-gray-50 border-r border-gray-200"
        >
          <nav className="h-full flex flex-col pt-6 pb-4 overflow-y-auto no-scrollbar overflow-x-hidden">
            {/* Page Navigation (only in construction view) */}
            {activeView === 'construction' && (
              <div className="space-y-1 px-3 flex-1">
                {currentPages.map((page) => {
                  const isCustom = isCustomPage(activeTab, page);
                  const isEditing = editingPageName === page;

                  // Render rename input for custom pages being edited
                  if (isEditing) {
                    return (
                      <div
                        key={page}
                        className="space-y-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                      >
                        <input
                          ref={editPageInputRef}
                          type="text"
                          value={editPageValue}
                          onChange={(e) => setEditPageValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey)
                              handleConfirmRenamePage();
                            if (e.key === 'Escape') handleCancelRenamePage();
                          }}
                          maxLength={PAGE_NAME_MAX_LENGTH}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Page name..."
                        />
                        <textarea
                          value={editPageDescription}
                          onChange={(e) => setEditPageDescription(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') handleCancelRenamePage();
                          }}
                          maxLength={PAGE_DESCRIPTION_MAX_LENGTH}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Description (optional)..."
                        />
                        {editPageError && (
                          <p className="text-xs text-red-500 px-1">
                            {editPageError}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={handleCancelRenamePage}
                            className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmRenamePage}
                            className="flex-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Render normal page button
                  return (
                    <div
                      key={page}
                      draggable={!isAddingPage && !editingPageName}
                      onDragStart={(e) => handleDragStart(e, page)}
                      onDragOver={(e) => handleDragOver(e, page)}
                      onDragLeave={() => setDragOverPage(null)}
                      onDrop={(e) => handleDrop(e, page)}
                      className={`group relative flex items-center rounded-lg transition-all ${
                        activePage === page
                          ? 'bg-white shadow-sm border border-gray-200'
                          : 'hover:bg-gray-100'
                      } ${draggedPage === page ? 'opacity-40' : 'opacity-100'} ${
                        dragOverPage === page
                          ? 'border-t-2 border-t-blue-500'
                          : ''
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="pl-2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity">
                        <GripVertical size={14} />
                      </div>

                      <button
                        onClick={() => setActivePage(page)}
                        className={`flex-1 text-left px-2 py-2.5 text-sm font-medium transition-all flex items-center justify-between ${
                          activePage === page ? 'text-blue-700' : 'text-gray-600'
                        }`}
                      >
                        <span className="truncate">{page}</span>
                        <span
                          className={`text-[10px] ml-2 px-1.5 py-0.5 rounded-full ${
                            activePage === page
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {
                            ideas.filter(
                              (i) =>
                                i.category === activeTab &&
                                i.subcategory === page &&
                                i.stage !== 'archived'
                            ).length
                          }
                        </span>
                      </button>

                      {/* Edit/Delete buttons for custom pages */}
                      {isCustom && (
                        <div className="absolute right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRenamePage(page);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Rename page"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartDeletePage(page);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete page"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Page Input */}
                {isAddingPage ? (
                  <div className="space-y-2 mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <input
                      ref={addPageInputRef}
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey)
                          handleConfirmAddPage();
                        if (e.key === 'Escape') handleCancelAddPage();
                      }}
                      maxLength={PAGE_NAME_MAX_LENGTH}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Page name..."
                    />
                    <textarea
                      value={newPageDescription}
                      onChange={(e) => setNewPageDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') handleCancelAddPage();
                      }}
                      maxLength={PAGE_DESCRIPTION_MAX_LENGTH}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Description (optional)..."
                    />
                    {newPageError && (
                      <p className="text-xs text-red-500 px-1">{newPageError}</p>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={handleCancelAddPage}
                        className="flex-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmAddPage}
                        className="flex-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleStartAddPage}
                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 mt-2"
                  >
                    <Plus size={16} />
                    Add Page
                  </button>
                )}
              </div>
            )}

            {/* Documents filter panel */}
            {activeView === 'documents' && (() => {
              const allTags = getAllTags();
              const allTypes = getAllFileTypes();
              const hasFilters = selectedTags.length > 0 || selectedFileTypes.length > 0;

              return (
                <div className="flex-1 px-3 space-y-5 overflow-y-auto no-scrollbar">
                  {/* Active Filters Summary */}
                  {hasFilters && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {selectedTags.length + selectedFileTypes.length} filter{selectedTags.length + selectedFileTypes.length !== 1 ? 's' : ''} active
                      </span>
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XCircle size={12} />
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Tags Section */}
                  {allTags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Tag size={12} className="text-gray-400" />
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map(({ tag, count }) => {
                          const isSelected = selectedTags.includes(tag);
                          const color = getTagColor(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTagFilter(tag)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                                isSelected
                                  ? `${color.activeBg} text-white border-transparent shadow-sm`
                                  : `${color.bg} ${color.text} ${color.border} hover:shadow-sm`
                              }`}
                            >
                              {tag}
                              <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'opacity-50'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* File Types Section */}
                  {allTypes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <FileType size={12} className="text-gray-400" />
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">File Type</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {allTypes.map(({ type, count }) => {
                          const isSelected = selectedFileTypes.includes(type);
                          const color = getFileTypeColor(type);
                          return (
                            <button
                              key={type}
                              onClick={() => toggleFileTypeFilter(type)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                                isSelected
                                  ? `${color.activeBg} text-white border-transparent shadow-sm`
                                  : `${color.bg} ${color.text} ${color.border} hover:shadow-sm`
                              }`}
                            >
                              .{type}
                              <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'opacity-50'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state when no documents */}
                  {allTags.length === 0 && allTypes.length === 0 && (
                    <div className="text-center py-8">
                      <Tag size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">
                        Upload documents with tags to see filters here
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Spacer for other non-construction views */}
            {activeView !== 'construction' && activeView !== 'documents' && <div className="flex-1" />}

            {/* Utility Tabs Section */}
            <div className="px-3 py-3 border-t border-b border-gray-200 mt-4 space-y-1">
              <button
                onClick={() => setActiveView('outline')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeView === 'outline'
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List size={16} />
                Outline
              </button>
              <button
                onClick={() => setActiveView('todo')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeView === 'todo'
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CheckSquare size={16} />
                To Do
              </button>
              <button
                onClick={() => setActiveView('preLaunchChecklist')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeView === 'preLaunchChecklist'
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Rocket size={16} />
                Pre-Launch
              </button>
              <button
                onClick={() => setActiveView('ideaHopper')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeView === 'ideaHopper'
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Lightbulb size={16} />
                Idea Hopper
              </button>
              <button
                onClick={() => setActiveView('documents')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeView === 'documents'
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FolderOpen size={16} />
                Documents
              </button>
            </div>

            {/* Build Stats */}
            <div className="px-6 pt-4 mx-3">
              <div className="text-xs text-gray-400 mb-2">Build Stats</div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-1/4"></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Setup</span>
                <span>25%</span>
              </div>
            </div>
          </nav>
        </ResizableSidebar>

        {/* Main Content Area */}
        {/* Show Documents View */}
        {activeView === 'documents' && (
          <main className="flex-1 overflow-y-auto metallic-gradient py-4 pl-8 pr-8">
            <DocumentsView />
          </main>
        )}

        {/* Show Idea Hopper View */}
        {activeView === 'ideaHopper' && (
          <main className="flex-1 overflow-hidden metallic-gradient py-4 pl-8 pr-8">
            <IdeaHopperView />
          </main>
        )}

        {/* Show To Do View */}
        {activeView === 'todo' && (
          <main className="flex-1 overflow-y-auto metallic-gradient py-4 pl-8 pr-8">
            <TodoView />
          </main>
        )}

        {/* Show Pre-Launch Checklist View */}
        {activeView === 'preLaunchChecklist' && (
          <main className="flex-1 overflow-hidden metallic-gradient py-4 pr-8 pl-0">
            <PreLaunchChecklistView />
          </main>
        )}

        {/* Show Outline View */}
        {activeView === 'outline' && (
          <main className="flex-1 overflow-y-auto metallic-gradient py-4 pl-8 pr-8">
            <OutlineView
              onNavigate={(category, page) => {
                setActiveTab(category);
                setActivePage(page);
                setActiveView('construction');
              }}
            />
          </main>
        )}

        {/* Show Capacity Calculator */}
        {activeView === 'calculator' && (
          <main className="flex-1 overflow-hidden">
            <CapacityCalculator />
          </main>
        )}

        {/* Show Construction Zone */}
        {activeView === 'construction' && (
          <main className="flex-1 overflow-y-auto metallic-gradient py-4 pl-8 pr-8">
            {activePage === 'Locations' ? (
              <MapsView />
            ) : (
              <div className="max-w-4xl">
              {/* Category Header Section */}
              <div className="mb-2">
                <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <CategoryIcon category={activeTab} size={18} />
                  {CATEGORY_STRUCTURE[activeTab].label}
                  {CATEGORY_STRUCTURE[activeTab].subtitle && (
                    <span className="text-slate-400 font-normal">
                      - {CATEGORY_STRUCTURE[activeTab].subtitle}
                    </span>
                  )}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Organize your{' '}
                  {CATEGORY_STRUCTURE[activeTab].label.toLowerCase()} workflow.
                </p>
              </div>

              {/* Horizontal Divider */}
              <hr className="border-slate-300 mb-3" />

              {/* Page Header */}
              <div className="mb-5 border-b pb-2">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {activePage}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {getPageDescription(activeTab, activePage) ||
                    `Organize the ${activePage.toLowerCase()} stream across your stages.`}
                </p>
              </div>

              {/* Add Item - Fixed at Top */}
              <div className="mb-6">
                {isAddingItem ? (
                  <form onSubmit={handleAddItem} className="flex gap-2">
                    <input
                      ref={newItemInputRef}
                      type="text"
                      placeholder={`Add a requirement or idea for ${activePage}...`}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 text-sm"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') handleCancelAddItem();
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCancelAddItem}
                      className="px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={handleStartAddItem}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-500 bg-white border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add a requirement or idea...
                  </button>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-500 font-medium">Loading ideas...</p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <p className="text-red-700 font-medium mb-2">
                      Connection Error
                    </p>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button
                      onClick={() => loadIdeas()}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* Main Content */}
              {!isLoading && !error && (
                <>
                  <CollapsibleSection
                    title="Current best"
                    subtitle="Pinned or marked current best"
                    gradientClass="bg-slate-50/50 border-slate-200"
                    count={pinnedItems.length}
                  >
                    {pinnedItems.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                    {pinnedItems.length === 0 && (
                      <div className="text-sm text-gray-400 italic col-span-full">
                        Nothing pinned yet.
                      </div>
                    )}
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Workshopping"
                    gradientClass="bg-slate-50/50 border-slate-200"
                    count={workshoppingItems.length}
                  >
                    {workshoppingItems.length === 0 && (
                      <div className="text-sm text-gray-400 italic col-span-full">
                        No workshopping items.
                      </div>
                    )}
                    {workshoppingItems.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                  </CollapsibleSection>

                  <CollapsibleSection
                    title="Ready to go"
                    gradientClass="bg-slate-50/50 border-slate-200"
                    count={readyItems.length}
                  >
                    {readyItems.length === 0 && (
                      <div className="text-sm text-gray-400 italic col-span-full">
                        No ready items yet.
                      </div>
                    )}
                    {readyItems.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                  </CollapsibleSection>

                  <section className="mt-10">
                    <button
                      onClick={() => setShowArchived((prev) => !prev)}
                      className="text-sm text-blue-700 hover:underline flex items-center gap-2"
                    >
                      {showArchived ? 'Hide archived' : 'Show archived'} (
                      {archivedItems.length})
                      {showArchived ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {showArchived && (
                      <div className="mt-4 space-y-3">
                        {archivedItems.length === 0 && (
                          <div className="text-sm text-gray-400 italic">
                            No archived items.
                          </div>
                        )}
                        {archivedItems.map((idea) => (
                          <IdeaCard key={idea.id} idea={idea} />
                        ))}
                      </div>
                    )}
                  </section>

                </>
              )}
            </div>
            )}
          </main>
        )}

        {geminiOpen && <GeminiSidebar onClose={() => setGeminiOpen(false)} />}

        {selectedIdeaId && (
          <CardDetailSidebar
            ideaId={selectedIdeaId}
            onClose={() => setSelectedIdeaId(null)}
          />
        )}

        {/* Delete Page Confirmation Dialog */}
        {deleteConfirmPage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Page
                  </h3>
                </div>

                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete &ldquo;
                  <span className="font-medium">{deleteConfirmPage.name}</span>
                  &rdquo;?
                </p>

                {deleteConfirmPage.ideaCount > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-amber-800 text-sm font-medium mb-2">
                      This page contains {deleteConfirmPage.ideaCount} idea
                      {deleteConfirmPage.ideaCount === 1 ? '' : 's'}.
                    </p>
                    <p className="text-amber-700 text-sm">
                      What would you like to do with them?
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-4">
                    This page has no ideas and can be safely deleted.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  onClick={handleCancelDeletePage}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                {deleteConfirmPage.ideaCount > 0 ? (
                  <>
                    <button
                      onClick={() => handleConfirmDeletePage('archive')}
                      className="flex-1 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors"
                    >
                      Archive Ideas
                    </button>
                    <button
                      onClick={() => handleConfirmDeletePage('delete')}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Ideas
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConfirmDeletePage('delete')}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Page
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
