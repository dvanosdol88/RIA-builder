import React, { useState, useMemo, useEffect } from 'react';
import { useIdeaStore } from './ideaStore';
import { Search, Plus, Sparkles, CheckCircle, Circle, Pencil, X, Trash2 } from 'lucide-react';
import GeminiSidebar from './components/GeminiSidebar';

export default function ConstructionZone() {
  const { 
    structure, ideas, 
    addIdea, updateIdea, removeIdea,
    addDomain, updateDomain, deleteDomain,
    addPage, updatePage, deletePage
  } = useIdeaStore();
  
  // Navigation State
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [activePage, setActivePage] = useState<string>('');
  
  // UI State
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  // Initialize selection
  useEffect(() => {
    if (!activeTabId && structure.length > 0) {
        setActiveTabId(structure[0].id);
        setActivePage(structure[0].pages[0] || '');
    }
  }, [structure]);

  // If active tab gets deleted, switch to another
  useEffect(() => {
    const activeExists = structure.find(s => s.id === activeTabId);
    if (!activeExists && structure.length > 0) {
        setActiveTabId(structure[0].id);
        setActivePage(structure[0].pages[0] || '');
    } else if (activeExists && !activeExists.pages.includes(activePage)) {
        // If active page gets deleted, switch to first available
        setActivePage(activeExists.pages[0] || '');
    }
  }, [structure, activeTabId, activePage]);

  const activeDomain = structure.find(d => d.id === activeTabId);

  // Filter Content
  const filteredItems = useMemo(() => {
    return ideas.filter(idea => {
      const matchesContext = idea.category === activeTabId && idea.subcategory === activePage;
      const matchesSearch = idea.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesContext && matchesSearch;
    });
  }, [ideas, activeTabId, activePage, searchQuery]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    addIdea({
      id: crypto.randomUUID(),
      text: newItemText,
      category: activeTabId,
      subcategory: activePage,
      timestamp: Date.now(),
      type: 'idea',
      notes: []
    });
    setNewItemText('');
  };

  const handleAddDomain = () => {
    addDomain('New Domain', '📦');
  };

  return (
    <div className="h-screen flex flex-col bg-white text-slate-800 font-sans">
      
      {/* 1. TOP NAVIGATION (The Domains) */}
      <header className="bg-slate-900 text-white px-4 py-0 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-4 overflow-hidden flex-1 mr-4">
          <div className="font-bold text-lg py-4 pr-4 border-r border-slate-700 whitespace-nowrap shrink-0">
            🚧 RIA Builder
          </div>
          
          {/* Top Tabs */}
          <div className="flex gap-1 items-center overflow-x-auto no-scrollbar">
            {structure.map((domain) => (
              <div 
                key={domain.id}
                className={`group relative flex items-center shrink-0 ${activeTabId === domain.id ? 'bg-slate-800' : ''}`}
              >
                <button
                  onClick={() => {
                      setActiveTabId(domain.id);
                      setActivePage(domain.pages[0] || '');
                  }}
                  className={`px-4 py-4 text-sm font-medium transition-colors border-b-4 flex items-center gap-2 ${
                    activeTabId === domain.id 
                      ? 'border-blue-500 text-white' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isEditMode ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <input 
                            value={domain.emoji}
                            onChange={(e) => updateDomain(domain.id, { emoji: e.target.value })}
                            className="w-8 bg-slate-700 text-center rounded focus:outline-none focus:ring-1 focus:ring-blue-500 px-1"
                          />
                          <input 
                            value={domain.label}
                            onChange={(e) => updateDomain(domain.id, { label: e.target.value })}
                            className="w-28 bg-slate-700 px-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                      </div>
                  ) : (
                      <>
                        <span>{domain.emoji}</span>
                        {domain.label}
                      </>
                  )}
                </button>
                
                {isEditMode && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(confirm(`Delete ${domain.label}? This will delete all ideas within it.`)) {
                                deleteDomain(domain.id);
                            }
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Delete Domain"
                    >
                        <X size={10} />
                    </button>
                )}
              </div>
            ))}

            {isEditMode && (
                <button 
                    onClick={handleAddDomain}
                    className="ml-2 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                    title="Add New Domain"
                >
                    <Plus size={16} />
                </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 py-2 shrink-0 border-l border-slate-700 pl-4">
           {/* Global Search */}
           <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-slate-800 border-none rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 w-48 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Edit Mode Toggle */}
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${
              isEditMode 
                ? 'bg-orange-600 border-orange-500 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
            title={isEditMode ? "Exit Edit Mode" : "Edit Layout"}
          >
            <Pencil size={16} />
            <span className="text-xs font-medium hidden md:inline">
                {isEditMode ? 'Done' : 'Edit'}
            </span>
          </button>

          {/* Gemini Toggle */}
          <button 
            onClick={() => setGeminiOpen(!geminiOpen)}
            className={`p-2 rounded-full transition-colors ${
              geminiOpen ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR (The Subcategories) */}
        <nav className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col pt-6 pb-4 overflow-y-auto shrink-0">
          {activeDomain && (
              <>
                <div className="px-6 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center h-6">
                    {activeDomain.label}
                </div>
                <div className="space-y-1 px-3">
                    {activeDomain.pages.map(page => (
                    <div key={page} className="group relative">
                        {isEditMode ? (
                            <div className="flex items-center gap-1 px-2 py-1">
                                <input 
                                    value={page}
                                    onChange={(e) => updatePage(activeDomain.id, page, e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button 
                                    onClick={() => {
                                        if(confirm(`Delete page "${page}"?`)) {
                                            deletePage(activeDomain.id, page);
                                        }
                                    }}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setActivePage(page)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activePage === page
                                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </div>
                    ))}

                    {isEditMode && (
                        <button
                            onClick={() => addPage(activeDomain.id, "New Page")}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-dashed border-blue-200 mt-2 transition-colors"
                        >
                            <Plus size={14} /> Add Page
                        </button>
                    )}
                </div>
              </>
          )}
          
          <div className="mt-auto px-6 pt-6 border-t mx-3">
            <div className="text-xs text-gray-400 mb-2">Build Stats</div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 w-1/4"></div>
            </div>
          </div>
        </nav>

        {/* CENTER CONTENT (The Page) */}
        <main className="flex-1 overflow-y-auto bg-white p-8 md:p-12">
          {activeDomain && activePage ? (
              <div className="max-w-3xl mx-auto">
                
                {/* Page Header */}
                <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    {activePage}
                </h1>
                <p className="text-gray-500 mt-2">
                    Define the {activePage.toLowerCase()} logic and requirements here.
                </p>
                </div>

                {/* The List of Ideas/Blocks */}
                <div className="space-y-4 min-h-[300px]">
                {filteredItems.map(idea => (
                    <div key={idea.id} className="group relative pl-4 border-l-2 border-gray-200 hover:border-blue-400 transition-colors py-1">
                    {/* Refine/Done Toggle */}
                    <button 
                        onClick={() => updateIdea(idea.id, { refined: !idea.refined })}
                        className="absolute -left-[9px] top-2 bg-white text-gray-300 hover:text-green-500 transition-colors z-10"
                    >
                        {idea.refined ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                    </button>
                    
                    <div className={`${idea.refined ? 'opacity-50 line-through decoration-gray-300' : ''}`}>
                        <p className="text-lg text-slate-800 break-words">{idea.text}</p>
                        {idea.notes.length > 0 && (
                            <div className="mt-2 space-y-1">
                            {idea.notes.map(n => (
                                <div key={n.id} className="text-sm text-gray-500 bg-gray-50 p-2 rounded block">
                                {n.text}
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                    {/* Delete Action */}
                    <button 
                        onClick={() => removeIdea(idea.id)}
                        className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-1"
                        title="Delete Idea"
                    >
                        <Trash2 size={16} />
                    </button>
                    </div>
                ))}

                {filteredItems.length === 0 && (
                    <div className="text-gray-300 text-center py-12 italic">
                    No items yet. Start building {activePage}.
                    </div>
                )}
                </div>

                {/* Input Area */}
                <div className="mt-8 pt-6 border-t sticky bottom-0 bg-white/95 backdrop-blur pb-4">
                <form onSubmit={handleAddItem} className="flex gap-3 shadow-sm rounded-lg">
                    <input 
                    autoFocus
                    type="text" 
                    placeholder={`Add a requirement or idea for ${activePage}...`}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    />
                    <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                    <Plus className="w-4 h-4" /> Add
                    </button>
                </form>
                </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>Select a page or create a new one to get started.</p>
            </div>
          )}
        </main>

        {/* RIGHT GEMINI SIDEBAR */}
        {geminiOpen && (
          <aside className="fixed inset-y-0 right-0 w-[400px] border-l bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
             <GeminiSidebar onClose={() => setGeminiOpen(false)} />
          </aside>
        )}

      </div>
    </div>
  );
}