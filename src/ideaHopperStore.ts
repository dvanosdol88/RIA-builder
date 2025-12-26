import { create } from 'zustand';
import * as ideaHopperService from './services/ideaHopperService';
import type { HopperIdea } from './services/ideaHopperService';

export type { HopperIdea } from './services/ideaHopperService';

interface IdeaHopperStore {
  ideas: HopperIdea[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedIdeaId: string | null;
  statusFilters: Set<HopperIdea['status']>;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedIdeaId: (id: string | null) => void;
  toggleStatusFilter: (status: HopperIdea['status']) => void;
  clearStatusFilters: () => void;
  loadIdeas: () => Promise<void>;
  addIdea: (idea: Omit<HopperIdea, 'id'>) => Promise<HopperIdea | null>;
  updateIdea: (id: string, updates: Partial<HopperIdea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;

  // Computed getters
  getFilteredIdeas: () => HopperIdea[];
  getIdeasByStatus: (status: HopperIdea['status']) => HopperIdea[];
  getSelectedIdea: () => HopperIdea | null;
  getAllTags: () => string[];
}

export const useIdeaHopperStore = create<IdeaHopperStore>()((set, get) => ({
  ideas: [],
  isLoading: true,
  error: null,
  searchQuery: '',
  selectedIdeaId: null,
  statusFilters: new Set<HopperIdea['status']>(),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedIdeaId: (selectedIdeaId) => set({ selectedIdeaId }),

  toggleStatusFilter: (status) => {
    const { statusFilters } = get();
    const newFilters = new Set(statusFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    set({ statusFilters: newFilters });
  },

  clearStatusFilters: () => set({ statusFilters: new Set() }),

  loadIdeas: async () => {
    set({ isLoading: true, error: null });
    try {
      // This will also seed the initial idea if the collection is empty
      const ideas = await ideaHopperService.seedInitialIdeas();

      // If seedInitialIdeas returned ideas, use them; otherwise fetch fresh
      if (ideas.length > 0) {
        set({ ideas, isLoading: false });
      } else {
        const fetchedIdeas = await ideaHopperService.getHopperIdeas();
        set({ ideas: fetchedIdeas, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load hopper ideas:', error);
      set({
        error: 'Failed to load ideas. Please check your connection.',
        isLoading: false,
      });
    }
  },

  addIdea: async (ideaData) => {
    try {
      const newIdea = await ideaHopperService.addHopperIdea(ideaData);
      set((state) => ({
        ideas: [newIdea, ...state.ideas],
      }));
      return newIdea;
    } catch (error) {
      console.error('Failed to add idea:', error);
      return null;
    }
  },

  updateIdea: async (id, updates) => {
    const { ideas } = get();
    const originalIdea = ideas.find((i) => i.id === id);
    if (!originalIdea) return;

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id ? { ...idea, ...updates, updatedAt: Date.now() } : idea
      ),
    }));

    try {
      await ideaHopperService.updateHopperIdea(id, updates);
    } catch (error) {
      console.error('Failed to update idea:', error);
      // Rollback
      set((state) => ({
        ideas: state.ideas.map((idea) =>
          idea.id === id ? originalIdea : idea
        ),
      }));
    }
  },

  deleteIdea: async (id) => {
    const { ideas } = get();
    const originalIdeas = ideas;

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.filter((idea) => idea.id !== id),
      selectedIdeaId: state.selectedIdeaId === id ? null : state.selectedIdeaId,
    }));

    try {
      await ideaHopperService.deleteHopperIdea(id);
    } catch (error) {
      console.error('Failed to delete idea:', error);
      // Rollback
      set({ ideas: originalIdeas });
    }
  },

  getFilteredIdeas: () => {
    const { ideas, searchQuery, statusFilters } = get();
    return ideas
      .filter((idea) => {
        // Filter by status if any filters are active
        if (statusFilters.size > 0 && !statusFilters.has(idea.status)) {
          return false;
        }
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            idea.title.toLowerCase().includes(query) ||
            idea.description.toLowerCase().includes(query) ||
            idea.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getIdeasByStatus: (status) => {
    const { ideas, searchQuery } = get();
    return ideas
      .filter((idea) => idea.status === status)
      .filter((idea) =>
        searchQuery
          ? idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            idea.description.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
      .sort((a, b) => {
        // Sort by priority first, then by creation date
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.createdAt - a.createdAt;
      });
  },

  getSelectedIdea: () => {
    const { ideas, selectedIdeaId } = get();
    return ideas.find((idea) => idea.id === selectedIdeaId) || null;
  },

  getAllTags: () => {
    const { ideas } = get();
    const tagSet = new Set<string>();
    ideas.forEach((idea) => {
      idea.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  },
}));
