import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Category = 'A' | 'B' | 'C' | 'D';

export type Stage = 'current_best' | 'workshopping' | 'ready_to_go' | 'archived';

export const CATEGORY_STRUCTURE: Record<
  Category,
  { emoji: string; label: string; pages: string[] }
> = {
  A: {
    emoji: '✨',
    label: 'Client Experience',
    pages: ['Onboarding', 'First Meeting', 'Year 1', 'Portal Design'],
  },
  B: {
    emoji: '⚙️',
    label: 'Operations & Tech',
    pages: ['Wealthbox', 'RightCapital', 'Automation', 'Data Flows'],
  },
  C: {
    emoji: '🚀',
    label: 'Marketing & Growth',
    pages: ['Landing Page', 'Postcards', 'Fee Calculator', 'Messaging'],
  },
  D: {
    emoji: '🧠',
    label: 'Logic & Compliance',
    pages: ['Asset Allocation', 'Models', 'ADV Filings', 'Policies'],
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
  type: 'idea' | 'question';
  notes: { id: string; text: string; timestamp: number }[];
}

type IdeaInput = Omit<Idea, 'id' | 'timestamp' | 'pinned' | 'stage'> &
  Partial<Pick<Idea, 'id' | 'timestamp' | 'pinned' | 'stage'>>;

interface IdeaStore {
  ideas: Idea[];
  addIdea: (idea: IdeaInput) => void;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  removeIdea: (id: string) => void;
  setIdeaStage: (id: string, stage: Stage) => void;
  toggleIdeaPinned: (id: string) => void;
}

const SEED_DATA: Idea[] = [
  {
    id: '1',
    text: "Draft the 'Zero-Entry' upload flow for brokerage PDFs",
    category: 'A',
    subcategory: 'Onboarding',
    timestamp: Date.now(),
    type: 'idea',
    refined: false,
    stage: 'workshopping',
    pinned: false,
    notes: [],
  },
  {
    id: '2',
    text: "Script the 'Dream Retirement' opening question",
    category: 'A',
    subcategory: 'Onboarding',
    timestamp: Date.now(),
    type: 'idea',
    refined: false,
    stage: 'workshopping',
    pinned: false,
    notes: [],
  },
];

const mapLegacyCategory = (category: unknown): Category => {
  switch (category) {
    case 'Experience':
      return 'A';
    case 'Ops':
      return 'B';
    case 'Marketing':
      return 'C';
    case 'Logic':
      return 'D';
    default:
      return 'A';
  }
};

export const useIdeaStore = create<IdeaStore>()(
  persist(
    (set) => ({
      ideas: SEED_DATA,
      addIdea: (ideaInput) =>
        set((state) => {
          const idea: Idea = {
            id: ideaInput.id ?? crypto.randomUUID(),
            text: ideaInput.text,
            category: ideaInput.category,
            subcategory: ideaInput.subcategory,
            timestamp: ideaInput.timestamp ?? Date.now(),
            refined: ideaInput.refined,
            stage: ideaInput.stage ?? 'workshopping',
            pinned: ideaInput.pinned ?? false,
            type: ideaInput.type,
            notes: ideaInput.notes ?? [],
          };

          return { ideas: [...state.ideas, idea] };
        }),
      updateIdea: (id, updates) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, ...updates } : idea
          ),
        })),
      removeIdea: (id) =>
        set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) })),
      setIdeaStage: (id, stage) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, stage } : idea
          ),
        })),
      toggleIdeaPinned: (id) =>
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, pinned: !idea.pinned } : idea
          ),
        })),
    }),
    {
      name: 'idea-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState as IdeaStore;
        const state = persistedState as IdeaStore;

        return {
          ...state,
          ideas: (state.ideas ?? []).map((idea) => ({
            ...idea,
            category: mapLegacyCategory(idea.category),
            stage: idea.stage ?? 'workshopping',
            pinned: idea.pinned ?? false,
          })),
        };
      },
    }
  )
);
