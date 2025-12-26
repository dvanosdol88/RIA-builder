import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Lightbulb,
  X,
  ExternalLink,
  Tag,
  Link,
  Trash2,
} from 'lucide-react';
import { useIdeaHopperStore, HopperIdea } from '../ideaHopperStore';
import IdeaHopperCard from './IdeaHopperCard';

const STATUS_OPTIONS: Array<{ value: HopperIdea['status']; label: string; color: string; bgColor: string }> = [
  { value: 'new', label: 'New', color: 'text-blue-700', bgColor: 'bg-blue-100 hover:bg-blue-200' },
  { value: 'exploring', label: 'Exploring', color: 'text-purple-700', bgColor: 'bg-purple-100 hover:bg-purple-200' },
  { value: 'developing', label: 'Developing', color: 'text-amber-700', bgColor: 'bg-amber-100 hover:bg-amber-200' },
  { value: 'implemented', label: 'Implemented', color: 'text-green-700', bgColor: 'bg-green-100 hover:bg-green-200' },
  { value: 'parked', label: 'Parked', color: 'text-slate-600', bgColor: 'bg-slate-200 hover:bg-slate-300' },
];

export default function IdeaHopperView() {
  const {
    isLoading,
    error,
    searchQuery,
    selectedIdeaId,
    statusFilters,
    setSearchQuery,
    setSelectedIdeaId,
    toggleStatusFilter,
    clearStatusFilters,
    loadIdeas,
    addIdea,
    updateIdea,
    deleteIdea,
    getFilteredIdeas,
    getSelectedIdea,
    getAllTags,
  } = useIdeaHopperStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    referenceUrls: [''],
    tags: [] as string[],
    tagsInput: '',
    priority: 'medium' as HopperIdea['priority'],
  });

  const allExistingTags = getAllTags();

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const filteredIdeas = getFilteredIdeas();
  const selectedIdea = getSelectedIdea();

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.title.trim()) return;

    // Combine selected tags with any typed tags
    const typedTags = newIdea.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const allTags = [...new Set([...newIdea.tags, ...typedTags])];

    // Filter out empty URLs
    const validUrls = newIdea.referenceUrls
      .map((url) => url.trim())
      .filter(Boolean);

    await addIdea({
      title: newIdea.title.trim(),
      description: newIdea.description.trim(),
      referenceUrls: validUrls,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new',
      priority: newIdea.priority,
      tags: allTags,
      notes: '',
    });

    setNewIdea({
      title: '',
      description: '',
      referenceUrls: [''],
      tags: [],
      tagsInput: '',
      priority: 'medium',
    });
    setShowAddModal(false);
  };

  const addUrlField = () => {
    setNewIdea((prev) => ({
      ...prev,
      referenceUrls: [...prev.referenceUrls, ''],
    }));
  };

  const removeUrlField = (index: number) => {
    setNewIdea((prev) => ({
      ...prev,
      referenceUrls: prev.referenceUrls.filter((_, i) => i !== index),
    }));
  };

  const updateUrlField = (index: number, value: string) => {
    setNewIdea((prev) => ({
      ...prev,
      referenceUrls: prev.referenceUrls.map((url, i) => (i === index ? value : url)),
    }));
  };

  const toggleTagSelection = (tag: string) => {
    setNewIdea((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleStatusChange = (id: string, status: HopperIdea['status']) => {
    updateIdea(id, { status });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading ideas...</p>
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
            onClick={() => loadIdeas()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto metallic-gradient py-4 pl-8 pr-8">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-amber-500" />
                Idea Hopper
              </h1>
              <p className="text-slate-500 mt-1">
                Capture and develop ideas for your RIA practice
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} />
              New Idea
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ideas by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-sm text-slate-500 mr-1">Filter:</span>
            {STATUS_OPTIONS.map((status) => {
              const isActive = statusFilters.has(status.value);
              return (
                <button
                  key={status.value}
                  onClick={() => toggleStatusFilter(status.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
                    isActive
                      ? `${status.bgColor} ${status.color} ring-2 ring-offset-1 ring-current`
                      : `${status.bgColor} ${status.color} opacity-60 hover:opacity-100`
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
            {statusFilters.size > 0 && (
              <button
                onClick={clearStatusFilters}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredIdeas.length === 0 && !searchQuery && statusFilters.size === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
              <Lightbulb className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">No ideas in the hopper yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first idea
              </button>
            </div>
          )}

          {/* No Results */}
          {filteredIdeas.length === 0 && (searchQuery || statusFilters.size > 0) && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">
                No ideas found
                {searchQuery && ` matching "${searchQuery}"`}
                {statusFilters.size > 0 && ` with selected status filters`}
              </p>
              {statusFilters.size > 0 && (
                <button
                  onClick={clearStatusFilters}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Ideas Grid */}
          {filteredIdeas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => (
                <IdeaHopperCard
                  key={idea.id}
                  idea={idea}
                  onSelect={setSelectedIdeaId}
                  onDelete={deleteIdea}
                  onStatusChange={handleStatusChange}
                  onUpdate={updateIdea}
                  allTags={allExistingTags}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedIdea && (
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedIdea.title}
              </h2>
              <button
                onClick={() => setSelectedIdeaId(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-slate-600 mb-6">{selectedIdea.description}</p>

            {/* Reference URLs */}
            {selectedIdea.referenceUrls && selectedIdea.referenceUrls.length > 0 && (
              <div className="mb-6">
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                  Reference URLs
                </label>
                <div className="space-y-2">
                  {selectedIdea.referenceUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline text-sm"
                    >
                      <ExternalLink size={14} />
                      <span className="truncate">{url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedIdea.tags.length > 0 && (
              <div className="mb-6">
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedIdea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                  Status
                </label>
                <select
                  value={selectedIdea.status}
                  onChange={(e) =>
                    updateIdea(selectedIdea.id, {
                      status: e.target.value as HopperIdea['status'],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="new">New</option>
                  <option value="exploring">Exploring</option>
                  <option value="developing">Developing</option>
                  <option value="implemented">Implemented</option>
                  <option value="parked">Parked</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                  Priority
                </label>
                <select
                  value={selectedIdea.priority}
                  onChange={(e) =>
                    updateIdea(selectedIdea.id, {
                      priority: e.target.value as HopperIdea['priority'],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                  Notes
                </label>
                <textarea
                  value={selectedIdea.notes}
                  onChange={(e) =>
                    updateIdea(selectedIdea.id, { notes: e.target.value })
                  }
                  placeholder="Add notes about this idea..."
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Idea Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">
                Add New Idea
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddIdea} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={newIdea.title}
                  onChange={(e) =>
                    setNewIdea({ ...newIdea, title: e.target.value })
                  }
                  placeholder="What's the idea?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Description
                </label>
                <textarea
                  value={newIdea.description}
                  onChange={(e) =>
                    setNewIdea({ ...newIdea, description: e.target.value })
                  }
                  placeholder="Describe the idea in more detail..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {/* Multiple URLs */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Reference URLs
                </label>
                <div className="space-y-2">
                  {newIdea.referenceUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => updateUrlField(index, e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      {newIdea.referenceUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUrlField(index)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addUrlField}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add URL
                </button>
              </div>

              {/* Tags Section */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Tags
                </label>

                {/* Existing tags as clickable pills */}
                {allExistingTags.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-2">Click to add existing tags:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allExistingTags.map((tag) => {
                        const isSelected = newIdea.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTagSelection(tag)}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
                              isSelected
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <Tag size={10} />
                            {tag}
                            {isSelected && <X size={10} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected tags display */}
                {newIdea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {newIdea.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTagSelection(tag)}
                          className="hover:text-blue-900"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* New tags input */}
                <input
                  type="text"
                  value={newIdea.tagsInput}
                  onChange={(e) =>
                    setNewIdea({ ...newIdea, tagsInput: e.target.value })
                  }
                  placeholder="Add new tags (comma-separated)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Priority
                </label>
                <select
                  value={newIdea.priority}
                  onChange={(e) =>
                    setNewIdea({
                      ...newIdea,
                      priority: e.target.value as HopperIdea['priority'],
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newIdea.title.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  Add Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
