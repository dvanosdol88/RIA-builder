import { create } from 'zustand';
import * as firebaseService from './services/firebaseService';
import type { CustomPage } from './services/firebaseService';

// Re-export CustomPage type for use in components
export type { CustomPage } from './services/firebaseService';

export type Category = 'A' | 'B' | 'F' | 'C' | 'D' | 'E';

// Page name validation constants
export const PAGE_NAME_MAX_LENGTH = 50;
export const PAGE_DESCRIPTION_MAX_LENGTH = 200;

export type Stage =
  | 'current_best'
  | 'workshopping'
  | 'ready_to_go'
  | 'archived';

// Page definition with name and description
export interface PageDefinition {
  name: string;
  description: string;
}

export const CATEGORY_STRUCTURE: Record<
  Category,
  { emoji: string; label: string; subtitle?: string; pages: PageDefinition[] }
> = {
  A: {
    emoji: 'megaphone',
    label: 'Prospect Experience',
    subtitle: 'Marketing and Onboarding',
    pages: [
      {
        name: 'Landing Page',
        description:
          'Design and optimize your website landing pages for prospect conversion.',
      },
      {
        name: 'Postcards',
        description:
          'Plan direct mail campaigns and postcard marketing materials.',
      },
      {
        name: 'Fee Calculator',
        description: 'Build and refine your fee calculator tool for prospects.',
      },
      {
        name: 'Messaging',
        description:
          'Craft compelling messaging and value propositions for prospects.',
      },
    ],
  },
  B: {
    emoji: 'user',
    label: 'Client Experience',
    subtitle: 'Operations',
    pages: [
      {
        name: 'Onboarding',
        description:
          'Organize the client onboarding workflow and requirements.',
      },
      {
        name: 'First Meeting',
        description: 'Plan and track first meeting preparation and follow-ups.',
      },
      {
        name: 'Year 1',
        description: 'Define the first-year client experience and touchpoints.',
      },
      {
        name: 'Portal Design',
        description:
          'Design and improve the client portal interface and features.',
      },
    ],
  },
  F: {
    emoji: 'briefcase',
    label: 'Advisor Experience',
    subtitle: 'Operations',
    pages: [
      {
        name: 'Client Management',
        description:
          'Organize client relationship management workflows and processes.',
      },
      {
        name: 'Calendar Management',
        description: 'Streamline scheduling, meetings, and time management.',
      },
      {
        name: 'Advisor Digital Twin',
        description: 'Build AI-assisted advisor tools and automation.',
      },
      {
        name: 'Investment Process',
        description:
          'Document and refine the investment decision-making process.',
      },
      {
        name: 'Investment Research',
        description: 'Organize research workflows and due diligence processes.',
      },
      {
        name: 'Investment Technology',
        description: 'Evaluate and integrate investment technology tools.',
      },
      {
        name: 'Client Meetings and Notes',
        description:
          'Standardize meeting preparation and note-taking workflows.',
      },
      {
        name: 'Client Communications',
        description: 'Plan regular client communications and touchpoints.',
      },
    ],
  },
  C: {
    emoji: 'cpu',
    label: 'Tech Stack',
    subtitle: 'Vendors',
    pages: [
      {
        name: 'Wealthbox',
        description: 'Configure and optimize Wealthbox CRM workflows.',
      },
      {
        name: 'RightCapital',
        description: 'Set up and customize RightCapital planning features.',
      },
      {
        name: 'Automation',
        description: 'Build automation workflows across your tech stack.',
      },
      {
        name: 'Data Flows',
        description: 'Map and optimize data integrations between systems.',
      },
    ],
  },
  D: {
    emoji: 'scale',
    label: 'Compliance',
    pages: [
      {
        name: 'Asset Allocation',
        description: 'Document asset allocation policies and guidelines.',
      },
      {
        name: 'Models',
        description: 'Define and maintain investment model documentation.',
      },
      {
        name: 'ADV Filings',
        description: 'Track ADV filing requirements and updates.',
      },
      {
        name: 'Policies',
        description: 'Maintain compliance policies and procedures.',
      },
    ],
  },
  E: {
    emoji: 'map',
    label: 'Roadmap',
    subtitle: 'Growth',
    pages: [
      {
        name: 'Goals',
        description: 'Set and track business goals and key results.',
      },
      {
        name: 'Milestones',
        description: 'Plan major milestones and achievement targets.',
      },
      {
        name: 'Future Features',
        description:
          'Capture ideas for future product and service enhancements.',
      },
      {
        name: 'Experiments',
        description: 'Document experiments and tests to run.',
      },
    ],
  },
};

export interface Idea {
  id: string;
  text: string;
  category: Category;
  subcategory: string;
  timestamp: number;
  refined?: boolean;
  stage: Stage;
  pinned?: boolean;
  focused?: boolean;
  type: 'idea' | 'question';
  goal: string;
  images: string[];
  notes: { id: string; text: string; timestamp: number }[];
  linkedDocuments: string[];
}

type IdeaInput = Omit<Idea, 'id' | 'timestamp' | 'pinned' | 'stage'> &
  Partial<Pick<Idea, 'id' | 'timestamp' | 'pinned' | 'stage'>>;

interface IdeaStore {
  ideas: Idea[];
  customPages: CustomPage[];
  pageOrders: Partial<Record<Category, string[]>>;
  isLoading: boolean;
  error: string | null;
  setIdeas: (ideas: Idea[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadIdeas: () => Promise<void>;
  addIdea: (idea: IdeaInput) => Promise<void>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  removeIdea: (id: string) => Promise<void>;
  setIdeaStage: (id: string, stage: Stage) => Promise<void>;
  toggleIdeaPinned: (id: string) => Promise<void>;
  toggleIdeaFocus: (
    id: string,
    category: Category,
    subcategory: string
  ) => Promise<void>;
  linkDocument: (ideaId: string, docId: string) => Promise<void>;
  unlinkDocument: (ideaId: string, docId: string) => Promise<void>;
  // Custom pages actions
  loadCustomPages: () => Promise<void>;
  addCustomPage: (
    category: Category,
    pageName: string,
    description?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCustomPage: (
    pageId: string,
    handleOrphanedIdeas: 'delete' | 'archive'
  ) => Promise<void>;
  renameCustomPage: (
    pageId: string,
    newName: string
  ) => Promise<{ success: boolean; error?: string }>;
  updateCustomPageDescription: (
    pageId: string,
    description: string
  ) => Promise<{ success: boolean; error?: string }>;
  getPagesForCategory: (category: Category) => string[];
  getPageDescription: (category: Category, pageName: string) => string;
  getIdeasForPage: (category: Category, pageName: string) => Idea[];
  isCustomPage: (category: Category, pageName: string) => boolean;
  validatePageName: (
    category: Category,
    pageName: string,
    excludePageId?: string
  ) => { valid: boolean; error?: string };
  // Page ordering
  loadPageOrders: () => Promise<void>;
  reorderPages: (category: Category, newOrder: string[]) => Promise<void>;
}

const SEED_DATA: Idea[] = [
  {
    id: '1',
    text: "Draft the 'Zero-Entry' upload flow for brokerage PDFs",
    category: 'A',
    subcategory: 'Landing Page',
    timestamp: Date.now(),
    type: 'idea',
    refined: false,
    stage: 'workshopping',
    pinned: false,
    goal: '',
    images: [],
    notes: [],
    linkedDocuments: [],
  },
  {
    id: '2',
    text: "Script the 'Dream Retirement' opening question",
    category: 'A',
    subcategory: 'Messaging',
    timestamp: Date.now(),
    type: 'idea',
    refined: false,
    stage: 'workshopping',
    pinned: false,
    goal: '',
    images: [],
    notes: [],
    linkedDocuments: [],
  },
];

export const useIdeaStore = create<IdeaStore>()((set, get) => ({
  ideas: [],
  customPages: [],
  pageOrders: {},
  isLoading: true,
  error: null,

  setIdeas: (ideas) => set({ ideas }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  loadIdeas: async () => {
    set({ isLoading: true, error: null });
    try {
      let ideas = await firebaseService.getIdeas();

      // If no ideas in Firestore, seed with initial data
      if (ideas.length === 0) {
        await firebaseService.seedInitialData(SEED_DATA);
        ideas = SEED_DATA;
      }

      set({ ideas, isLoading: false });

      // Also load custom pages and page orders
      await Promise.all([get().loadCustomPages(), get().loadPageOrders()]);
    } catch (error) {
      console.error('Failed to load ideas from Firebase:', error);
      set({
        error: 'Failed to load data. Please check your connection.',
        isLoading: false,
      });
    }
  },

  addIdea: async (ideaInput) => {
    const idea: Idea = {
      id: ideaInput.id ?? crypto.randomUUID(),
      text: ideaInput.text,
      category: ideaInput.category,
      subcategory: ideaInput.subcategory,
      timestamp: ideaInput.timestamp ?? Date.now(),
      refined: ideaInput.refined ?? false,
      stage: ideaInput.stage ?? 'workshopping',
      pinned: ideaInput.pinned ?? false,
      focused: ideaInput.focused ?? false,
      type: ideaInput.type,
      goal: ideaInput.goal ?? '',
      images: ideaInput.images ?? [],
      notes: ideaInput.notes ?? [],
      linkedDocuments: ideaInput.linkedDocuments ?? [],
    };

    // Optimistic update
    set((state) => ({ ideas: [...state.ideas, idea] }));

    try {
      await firebaseService.addIdea(idea);
    } catch (error) {
      console.error('Failed to add idea to Firebase:', error);
      // Rollback on error
      set((state) => ({ ideas: state.ideas.filter((i) => i.id !== idea.id) }));
    }
  },

  updateIdea: async (id, updates) => {
    const { ideas } = get();
    const originalIdea = ideas.find((i) => i.id === id);

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.map((idea) =>
        idea.id === id ? { ...idea, ...updates } : idea
      ),
    }));

    try {
      await firebaseService.updateIdea(id, updates);
    } catch (error) {
      console.error('Failed to update idea in Firebase:', error);
      // Rollback on error
      if (originalIdea) {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id ? originalIdea : idea
          ),
        }));
      }
    }
  },

  removeIdea: async (id) => {
    const { ideas } = get();
    const removedIdea = ideas.find((i) => i.id === id);

    // Optimistic update
    set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) }));

    try {
      await firebaseService.deleteIdea(id);
    } catch (error) {
      console.error('Failed to remove idea from Firebase:', error);
      // Rollback on error
      if (removedIdea) {
        set((state) => ({ ideas: [...state.ideas, removedIdea] }));
      }
    }
  },

  setIdeaStage: async (id, stage) => {
    await get().updateIdea(id, { stage });
  },

  toggleIdeaPinned: async (id) => {
    const { ideas } = get();
    const idea = ideas.find((i) => i.id === id);
    if (idea) {
      await get().updateIdea(id, { pinned: !idea.pinned });
    }
  },

  toggleIdeaFocus: async (id, category, subcategory) => {
    const { ideas } = get();
    const targetIdea = ideas.find((idea) => idea.id === id);
    const isCurrentlyFocused = targetIdea?.focused === true;

    // Calculate the updates needed
    const updates: { id: string; changes: Partial<Idea> }[] = [];

    if (isCurrentlyFocused) {
      // If already focused, just remove focus from this card
      updates.push({ id, changes: { focused: false } });
    } else {
      // Remove focus from all other cards in the same Workshopping section
      // and set focus on the clicked card
      ideas.forEach((idea) => {
        const isSameSection =
          idea.stage === 'workshopping' &&
          idea.category === category &&
          idea.subcategory === subcategory;

        if (idea.id === id) {
          updates.push({ id: idea.id, changes: { focused: true } });
        } else if (isSameSection && idea.focused) {
          updates.push({ id: idea.id, changes: { focused: false } });
        }
      });
    }

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.map((idea) => {
        const update = updates.find((u) => u.id === idea.id);
        return update ? { ...idea, ...update.changes } : idea;
      }),
    }));

    try {
      await firebaseService.batchUpdateIdeas(updates);
    } catch (error) {
      console.error('Failed to update focus in Firebase:', error);
      // Reload from Firebase to get correct state
      get().loadIdeas();
    }
  },

  linkDocument: async (ideaId, docId) => {
    const { ideas } = get();
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    const linkedDocuments = [...(idea.linkedDocuments || []), docId];

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.map((i) =>
        i.id === ideaId ? { ...i, linkedDocuments } : i
      ),
    }));

    try {
      await firebaseService.updateIdea(ideaId, { linkedDocuments });
    } catch (error) {
      console.error('Failed to link document:', error);
      // Rollback
      set((state) => ({
        ideas: state.ideas.map((i) =>
          i.id === ideaId ? { ...i, linkedDocuments: idea.linkedDocuments } : i
        ),
      }));
    }
  },

  unlinkDocument: async (ideaId, docId) => {
    const { ideas } = get();
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    const linkedDocuments = (idea.linkedDocuments || []).filter(
      (id) => id !== docId
    );

    // Optimistic update
    set((state) => ({
      ideas: state.ideas.map((i) =>
        i.id === ideaId ? { ...i, linkedDocuments } : i
      ),
    }));

    try {
      await firebaseService.updateIdea(ideaId, { linkedDocuments });
    } catch (error) {
      console.error('Failed to unlink document:', error);
      // Rollback
      set((state) => ({
        ideas: state.ideas.map((i) =>
          i.id === ideaId ? { ...i, linkedDocuments: idea.linkedDocuments } : i
        ),
      }));
    }
  },

  // ============================================
  // CUSTOM PAGES ACTIONS
  // ============================================

  loadCustomPages: async () => {
    try {
      const customPages = await firebaseService.getCustomPages();
      set({ customPages });
    } catch (error) {
      console.error('Failed to load custom pages:', error);
    }
  },

  validatePageName: (category, pageName, excludePageId) => {
    const trimmed = pageName.trim();

    // Check empty
    if (!trimmed) {
      return { valid: false, error: 'Page name cannot be empty' };
    }

    // Check max length
    if (trimmed.length > PAGE_NAME_MAX_LENGTH) {
      return {
        valid: false,
        error: `Page name must be ${PAGE_NAME_MAX_LENGTH} characters or less`,
      };
    }

    // Check duplicates against default pages (now uses PageDefinition.name)
    const defaultPages = CATEGORY_STRUCTURE[category].pages;
    if (
      defaultPages.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return { valid: false, error: 'A page with this name already exists' };
    }

    // Check duplicates against custom pages (excluding the current page if renaming)
    const { customPages } = get();
    const customPagesForCategory = customPages.filter(
      (p) => p.category === category && p.id !== excludePageId
    );
    if (
      customPagesForCategory.some(
        (p) => p.pageName.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return { valid: false, error: 'A page with this name already exists' };
    }

    return { valid: true };
  },

  addCustomPage: async (category, pageName, description = '') => {
    const validation = get().validatePageName(category, pageName);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmedName = pageName.trim();
    const trimmedDescription = description.trim();
    const newPage: CustomPage = {
      id: crypto.randomUUID(),
      category,
      pageName: trimmedName,
      description: trimmedDescription,
      createdAt: Date.now(),
    };

    // Optimistic update
    set((state) => ({ customPages: [...state.customPages, newPage] }));

    try {
      await firebaseService.addCustomPage(newPage);

      // Add new page to pageOrders
      const currentOrder = get().getPagesForCategory(category);
      await get().reorderPages(category, currentOrder);

      return { success: true };
    } catch (error) {
      console.error('Failed to add custom page:', error);
      // Rollback
      set((state) => ({
        customPages: state.customPages.filter((p) => p.id !== newPage.id),
      }));
      return {
        success: false,
        error: 'Failed to save page. Please try again.',
      };
    }
  },

  deleteCustomPage: async (pageId, handleOrphanedIdeas) => {
    const { customPages, ideas } = get();
    const pageToDelete = customPages.find((p) => p.id === pageId);
    if (!pageToDelete) return;

    // Find ideas that belong to this page
    const orphanedIdeas = ideas.filter(
      (idea) =>
        idea.category === pageToDelete.category &&
        idea.subcategory === pageToDelete.pageName
    );

    // Optimistic update - remove the page
    set((state) => ({
      customPages: state.customPages.filter((p) => p.id !== pageId),
    }));

    try {
      // Handle orphaned ideas based on user choice
      if (orphanedIdeas.length > 0) {
        if (handleOrphanedIdeas === 'delete') {
          // Delete all orphaned ideas
          await firebaseService.batchDeleteIdeas(
            orphanedIdeas.map((i) => i.id)
          );
          set((state) => ({
            ideas: state.ideas.filter(
              (idea) =>
                !(
                  idea.category === pageToDelete.category &&
                  idea.subcategory === pageToDelete.pageName
                )
            ),
          }));
        } else {
          // Archive all orphaned ideas
          const archiveUpdates = orphanedIdeas.map((idea) => ({
            id: idea.id,
            changes: { stage: 'archived' as Stage },
          }));
          await firebaseService.batchUpdateIdeas(archiveUpdates);
          set((state) => ({
            ideas: state.ideas.map((idea) =>
              orphanedIdeas.some((o) => o.id === idea.id)
                ? { ...idea, stage: 'archived' as Stage }
                : idea
            ),
          }));
        }
      }

      // Delete the page from Firebase
      await firebaseService.deleteCustomPage(pageId);

      // Update pageOrders to remove the deleted page
      const { pageOrders } = get();
      const currentOrder = pageOrders[pageToDelete.category];
      if (currentOrder) {
        const newOrder = currentOrder.filter(
          (p) => p !== pageToDelete.pageName
        );
        await get().reorderPages(pageToDelete.category, newOrder);
      }
    } catch (error) {
      console.error('Failed to delete custom page:', error);
      // Rollback - restore the page
      set((state) => ({
        customPages: [...state.customPages, pageToDelete],
      }));
      // Reload to get correct state
      get().loadIdeas();
    }
  },

  renameCustomPage: async (pageId, newName) => {
    const { customPages } = get();
    const pageToRename = customPages.find((p) => p.id === pageId);
    if (!pageToRename) {
      return { success: false, error: 'Page not found' };
    }

    const validation = get().validatePageName(
      pageToRename.category,
      newName,
      pageId
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmedName = newName.trim();
    const oldName = pageToRename.pageName;

    // Optimistic update
    set((state) => ({
      customPages: state.customPages.map((p) =>
        p.id === pageId ? { ...p, pageName: trimmedName } : p
      ),
      ideas: state.ideas.map((idea) =>
        idea.category === pageToRename.category && idea.subcategory === oldName
          ? { ...idea, subcategory: trimmedName }
          : idea
      ),
    }));

    try {
      // Update the custom page
      await firebaseService.updateCustomPage(pageId, { pageName: trimmedName });
      // Update all ideas that reference this page
      await firebaseService.renamePageInIdeas(
        pageToRename.category,
        oldName,
        trimmedName
      );

      // Update pageOrders to reflect the renamed page
      const { pageOrders } = get();
      const currentOrder = pageOrders[pageToRename.category];
      if (currentOrder) {
        const newOrder = currentOrder.map((p) =>
          p === oldName ? trimmedName : p
        );
        await get().reorderPages(pageToRename.category, newOrder);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to rename custom page:', error);
      // Reload to get correct state
      get().loadIdeas();
      return {
        success: false,
        error: 'Failed to rename page. Please try again.',
      };
    }
  },

  getPagesForCategory: (category) => {
    const { customPages, pageOrders } = get();
    // Extract page names from PageDefinition objects
    const defaultPageNames = CATEGORY_STRUCTURE[category].pages.map(
      (p) => p.name
    );
    const customPagesForCategory = customPages
      .filter((p) => p.category === category)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((p) => p.pageName);

    const allPages = [...defaultPageNames, ...customPagesForCategory];
    const order = pageOrders[category];

    if (!order) {
      return allPages;
    }

    // Sort allPages based on the order array.
    // Pages not in the order array go to the end, sorted by their original relative position.
    return [...allPages].sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  },

  getPageDescription: (category, pageName) => {
    // Check default pages first
    const defaultPage = CATEGORY_STRUCTURE[category].pages.find(
      (p) => p.name === pageName
    );
    if (defaultPage) {
      return defaultPage.description;
    }

    // Check custom pages
    const { customPages } = get();
    const customPage = customPages.find(
      (p) => p.category === category && p.pageName === pageName
    );
    return customPage?.description || '';
  },

  updateCustomPageDescription: async (pageId, description) => {
    const { customPages } = get();
    const page = customPages.find((p) => p.id === pageId);
    if (!page) {
      return { success: false, error: 'Page not found' };
    }

    const trimmedDescription = description.trim();

    // Validate description length
    if (trimmedDescription.length > PAGE_DESCRIPTION_MAX_LENGTH) {
      return {
        success: false,
        error: `Description must be ${PAGE_DESCRIPTION_MAX_LENGTH} characters or less`,
      };
    }

    // Optimistic update
    set((state) => ({
      customPages: state.customPages.map((p) =>
        p.id === pageId
          ? { ...p, description: trimmedDescription, updatedAt: Date.now() }
          : p
      ),
    }));

    try {
      await firebaseService.updateCustomPage(pageId, {
        description: trimmedDescription,
        updatedAt: Date.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to update page description:', error);
      // Reload to get correct state
      get().loadCustomPages();
      return {
        success: false,
        error: 'Failed to update description. Please try again.',
      };
    }
  },

  getIdeasForPage: (category, pageName) => {
    const { ideas } = get();
    return ideas.filter(
      (idea) => idea.category === category && idea.subcategory === pageName
    );
  },

  isCustomPage: (category, pageName) => {
    const defaultPages = CATEGORY_STRUCTURE[category].pages;
    // Check if pageName exists in default pages by comparing against PageDefinition.name
    return !defaultPages.some((p) => p.name === pageName);
  },

  // ============================================
  // PAGE ORDERING ACTIONS
  // ============================================

  loadPageOrders: async () => {
    try {
      const orders = await firebaseService.getPageOrders();
      const pageOrders: Partial<Record<Category, string[]>> = {};
      orders.forEach((o) => {
        pageOrders[o.category] = o.orderedPages;
      });
      set({ pageOrders });
    } catch (error) {
      console.error('Failed to load page orders:', error);
    }
  },

  reorderPages: async (category, newOrder) => {
    const { pageOrders } = get();
    const previousOrder = pageOrders[category];

    // Optimistic update
    set((state) => ({
      pageOrders: {
        ...state.pageOrders,
        [category]: newOrder,
      },
    }));

    try {
      await firebaseService.savePageOrder(category, newOrder);
    } catch (error) {
      console.error('Failed to save page order:', error);
      // Rollback
      set((state) => ({
        pageOrders: {
          ...state.pageOrders,
          [category]: previousOrder,
        },
      }));
    }
  },
}));
