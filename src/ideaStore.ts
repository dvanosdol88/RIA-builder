import { create } from 'zustand';

// --- Dynamic Structure Types ---
export interface Domain {
    id: string;      // "Experience"
    label: string;   // "Client Experience"
    emoji: string;   // "✨"
    pages: string[]; // ["Onboarding", "Year 1"]
}

export type Category = string; // Now dynamic

export interface Idea {
    id: string;
    text: string;
    category: string; 
    subcategory: string; 
    timestamp: number;
    refined?: boolean;
    type: 'idea' | 'question';
    notes: { id: string; text: string; timestamp: number }[];
}

interface IdeaStore {
    structure: Domain[];
    ideas: Idea[];

    // Idea Actions
    addIdea: (idea: Idea) => void;
    updateIdea: (id: string, updates: Partial<Idea>) => void;
    removeIdea: (id: string) => void;
    addNote: (ideaId: string, noteText: string) => void;

    // Structure Actions
    addDomain: (label: string, emoji: string) => void;
    updateDomain: (id: string, updates: Partial<Domain>) => void;
    deleteDomain: (id: string) => void;
    
    addPage: (domainId: string, pageName: string) => void;
    updatePage: (domainId: string, oldPageName: string, newPageName: string) => void;
    deletePage: (domainId: string, pageName: string) => void;
}

const INITIAL_STRUCTURE: Domain[] = [
  {
    id: 'Experience',
    label: 'Client Experience',
    emoji: '✨',
    pages: ['Onboarding', 'First Meeting', 'Year 1', 'Portal Design']
  },
  {
    id: 'Ops',
    label: 'Ops & Tech',
    emoji: '⚙️',
    pages: ['Tech Stack', 'Compliance', 'Workflow Automation']
  },
  {
    id: 'Marketing',
    label: 'Growth Engine',
    emoji: '🚀',
    pages: ['Landing Page', 'Postcards', 'Fee Calculator', 'Messaging']
  },
  {
    id: 'Logic',
    label: 'Advisory Logic',
    emoji: '🧠',
    pages: ['Asset Allocation', 'Models', 'Research', 'Regulatory']
  }
];

const SEED_DATA: Idea[] = [
    {
        id: '1',
        text: "Draft the 'Zero-Entry' upload flow for brokerage PDFs",
        category: 'Experience',
        subcategory: 'Onboarding',
        timestamp: Date.now(),
        type: 'idea',
        refined: false,
        notes: []
    }
];

export const useIdeaStore = create<IdeaStore>((set) => ({
    structure: INITIAL_STRUCTURE,
    ideas: SEED_DATA,

    // Idea Reducers
    addIdea: (idea) => set((state) => ({ ideas: [...state.ideas, idea] })),
    updateIdea: (id, updates) =>
        set((state) => ({
            ideas: state.ideas.map((idea) =>
                idea.id === id ? { ...idea, ...updates } : idea
            ),
        })),
    removeIdea: (id) =>
        set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) })),
    addNote: (ideaId, noteText) =>
        set((state) => ({
            ideas: state.ideas.map((idea) =>
                idea.id === ideaId
                    ? {
                        ...idea,
                        notes: [
                            ...idea.notes,
                            { id: crypto.randomUUID(), text: noteText, timestamp: Date.now() },
                        ],
                    }
                    : idea
            ),
        })),

    // Structure Reducers
    addDomain: (label, emoji) => set((state) => ({
        structure: [...state.structure, { 
            id: crypto.randomUUID(), 
            label, 
            emoji, 
            pages: ['New Page'] 
        }]
    })),
    
    updateDomain: (id, updates) => set((state) => ({
        structure: state.structure.map(d => d.id === id ? { ...d, ...updates } : d)
    })),

    deleteDomain: (id) => set((state) => ({
        structure: state.structure.filter(d => d.id !== id),
        ideas: state.ideas.filter(i => i.category !== id) // Cascade delete ideas
    })),

    addPage: (domainId, pageName) => set((state) => ({
        structure: state.structure.map(d => 
            d.id === domainId 
            ? { ...d, pages: [...d.pages, pageName] }
            : d
        )
    })),

    updatePage: (domainId, oldPageName, newPageName) => set((state) => {
        // 1. Update Structure
        const newStructure = state.structure.map(d => {
            if (d.id !== domainId) return d;
            return {
                ...d,
                pages: d.pages.map(p => p === oldPageName ? newPageName : p)
            };
        });

        // 2. Update Ideas (Move them to the new page name)
        const newIdeas = state.ideas.map(i => {
            if (i.category === domainId && i.subcategory === oldPageName) {
                return { ...i, subcategory: newPageName };
            }
            return i;
        });

        return { structure: newStructure, ideas: newIdeas };
    }),

    deletePage: (domainId, pageName) => set((state) => ({
        structure: state.structure.map(d => 
            d.id === domainId 
            ? { ...d, pages: d.pages.filter(p => p !== pageName) }
            : d
        ),
    }))
}));