import React, { useMemo, useState } from 'react';
import {
  CATEGORY_STRUCTURE,
  Category,
  Idea,
  Stage,
  useIdeaStore,
} from './ideaStore';
import { Search, Plus, Sparkles, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

const STAGE_LABELS: Record<Stage, string> = {
  current_best: '00_Current best',
  workshopping: '10_Workshopping',
  ready_to_go: '20_Ready_to_go',
  archived: '30_archived',
};

export default function ConstructionZone() {
  const { ideas, addIdea, updateIdea, setIdeaStage, toggleIdeaPinned } = useIdeaStore();

  const [activeTab, setActiveTab] = useState<Category>('A');
  const [activePage, setActivePage] = useState<string>(CATEGORY_STRUCTURE['A'].pages[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const handleTabChange = (tab: Category) => {
    setActiveTab(tab);
    setActivePage(CATEGORY_STRUCTURE[tab].pages[0]);
  };

  const filteredItems = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesContext = idea.category === activeTab && idea.subcategory === activePage;
      const matchesSearch = idea.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesContext && matchesSearch;
    });
  }, [ideas, activeTab, activePage, searchQuery]);

  const pinnedItems = useMemo(
    () =>
      filteredItems.filter((idea) => idea.pinned || idea.stage === 'current_best'),
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
    () => filteredItems.filter((idea) => idea.stage === 'ready_to_go' && !idea.pinned),
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
  };

  const moveToStage = (id: string, stage: Stage, shouldUnpin = false) => {
    setIdeaStage(id, stage);
    if (shouldUnpin) {
      updateIdea(id, { pinned: false });
    }
  };

  const IdeaCard = ({ idea }: { idea: Idea }) => {
    const actionButtonClass =
      'text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-700 transition-colors';

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs uppercase text-gray-400 font-semibold">
              {STAGE_LABELS[idea.stage]}
            </div>
            <p className="text-slate-900 font-medium leading-snug">{idea.text}</p>
          </div>
          <button
            onClick={() => toggleIdeaPinned(idea.id)}
            className={`text-xs px-2 py-1 rounded-full border ${
              idea.pinned
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-700'
            }`}
          >
            {idea.pinned ? 'Unpin' : 'Pin'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {idea.stage !== 'current_best' && idea.stage !== 'archived' && (
            <button
              onClick={() => moveToStage(idea.id, 'current_best')}
              className={actionButtonClass}
            >
              Move to Current best
            </button>
          )}

          {idea.stage !== 'workshopping' && (
            <button
              onClick={() => moveToStage(idea.id, 'workshopping', true)}
              className={actionButtonClass}
            >
              Move to Workshopping
            </button>
          )}

          {idea.stage !== 'ready_to_go' && (
            <button
              onClick={() => moveToStage(idea.id, 'ready_to_go', true)}
              className={actionButtonClass}
            >
              Move to Ready_to_go
            </button>
          )}

          {idea.stage !== 'archived' && (
            <button
              onClick={() => moveToStage(idea.id, 'archived', true)}
              className={`${actionButtonClass} text-red-600 border-red-200 hover:border-red-400 hover:text-red-700`}
            >
              Archive
            </button>
          )}

          {idea.stage === 'archived' && (
            <>
              <button
                onClick={() => moveToStage(idea.id, 'workshopping', true)}
                className={actionButtonClass}
              >
                Restore to Workshopping
              </button>
              <button
                onClick={() => moveToStage(idea.id, 'ready_to_go', true)}
                className={actionButtonClass}
              >
                Restore to Ready_to_go
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-white text-slate-800 font-sans">
      <header className="bg-slate-900 text-white px-6 py-0 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          <div className="font-bold text-lg py-4 pr-4 border-r border-slate-700 whitespace-nowrap">
            🚧 RIA Builder
          </div>
          <div className="flex gap-1">
            {(Object.keys(CATEGORY_STRUCTURE) as Category[]).map((key) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-4 py-4 text-sm font-medium transition-colors border-b-4 ${
                  activeTab === key
                    ? 'border-blue-500 text-white bg-slate-800'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="mr-2">{CATEGORY_STRUCTURE[key].emoji}</span>
                {CATEGORY_STRUCTURE[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search everything..."
              className="bg-slate-800 border-none rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setGeminiOpen(!geminiOpen)}
            className={`p-2 rounded-full transition-colors ${
              geminiOpen ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col pt-6 pb-4 overflow-y-auto">
          <div className="px-6 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
            {CATEGORY_STRUCTURE[activeTab].label}
          </div>
          <div className="space-y-1 px-3">
            {CATEGORY_STRUCTURE[activeTab].pages.map((page) => (
              <button
                key={page}
                onClick={() => setActivePage(page)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activePage === page
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <div className="mt-auto px-6 pt-6 border-t mx-3">
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

        <main className="flex-1 overflow-y-auto bg-white p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 border-b pb-4">
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                {activePage}
              </h1>
              <p className="text-gray-500 mt-2">
                Organize the {activePage.toLowerCase()} stream across your stages.
              </p>
            </div>

            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-slate-900">00_Current best</h2>
                <span className="text-xs text-gray-500">Pinned or marked current best</span>
              </div>
              <div className="space-y-3">
                {pinnedItems.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
                {pinnedItems.length === 0 && (
                  <div className="text-sm text-gray-400 italic">Nothing pinned yet.</div>
                )}
              </div>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">10_Workshopping</h3>
                </div>
                {workshoppingItems.length === 0 && (
                  <div className="text-sm text-gray-400 italic">No workshopping items.</div>
                )}
                {workshoppingItems.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-slate-900">20_Ready_to_go</h3>
                </div>
                {readyItems.length === 0 && (
                  <div className="text-sm text-gray-400 italic">No ready items yet.</div>
                )}
                {readyItems.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <button
                onClick={() => setShowArchived((prev) => !prev)}
                className="text-sm text-blue-700 hover:underline flex items-center gap-2"
              >
                {showArchived ? 'Hide archived' : 'Show archived'} ({archivedItems.length})
                {showArchived ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showArchived && (
                <div className="mt-4 space-y-3">
                  {archivedItems.length === 0 && (
                    <div className="text-sm text-gray-400 italic">No archived items.</div>
                  )}
                  {archivedItems.map((idea) => (
                    <IdeaCard key={idea.id} idea={idea} />
                  ))}
                </div>
              )}
            </section>

            <div className="mt-10 pt-6 border-t sticky bottom-0 bg-white/95 backdrop-blur">
              <form onSubmit={handleAddItem} className="flex gap-3">
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
        </main>

        {geminiOpen && (
          <aside className="w-[400px] border-l bg-white shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> Gemini Copilot
              </h3>
              <button onClick={() => setGeminiOpen(false)} className="text-blue-400 hover:text-blue-700">
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
              <div className="bg-white border p-4 rounded-lg shadow-sm text-sm text-gray-700 mb-4">
                I'm context-aware. I know you're working on <strong>{CATEGORY_STRUCTURE[activeTab].label} &gt; {activePage}</strong>.
                <br />
                <br />
                Try asking: "Draft an email for the {activePage} step."
              </div>
            </div>

            <div className="p-4 bg-white border-t">
              <div className="relative">
                <textarea
                  className="w-full border rounded-lg p-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                  placeholder="Ask Gemini..."
                ></textarea>
                <button className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
