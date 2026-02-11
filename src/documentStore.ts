import { create } from 'zustand';
import * as documentService from './services/documentService';
import type { DocumentMeta } from './services/documentService';

export type { DocumentMeta } from './services/documentService';

interface DocumentStore {
  documents: DocumentMeta[];
  isLoading: boolean;
  error: string | null;
  uploadError: string | null;
  searchQuery: string;
  selectedTags: string[];
  selectedFileTypes: string[];

  // Actions
  setSearchQuery: (query: string) => void;
  loadDocuments: () => Promise<void>;
  uploadDocument: (
    file: File,
    metadata?: {
      page?: string;
      section?: string;
      tab?: string;
      tags?: string[];
      summary?: string;
      thumbnailUrl?: string;
    }
  ) => Promise<DocumentMeta | null>;
  deleteDocument: (doc: DocumentMeta) => Promise<void>;
  toggleCanonical: (id: string) => Promise<void>;
  linkToCard: (docId: string, cardId: string) => Promise<void>;
  unlinkFromCard: (docId: string, cardId: string) => Promise<void>;
  toggleTagFilter: (tag: string) => void;
  toggleFileTypeFilter: (fileType: string) => void;
  clearFilters: () => void;

  // Computed getters
  getCanonicalDocuments: () => DocumentMeta[];
  getFilteredDocuments: () => DocumentMeta[];
  getNonCanonicalDocuments: () => DocumentMeta[];
  getRecentTags: (limit?: number) => string[];
  getAllTags: () => { tag: string; count: number }[];
  getAllFileTypes: () => { type: string; count: number }[];
}

export const useDocumentStore = create<DocumentStore>()((set, get) => ({
  documents: [],
  isLoading: true,
  error: null,
  uploadError: null,
  searchQuery: '',
  selectedTags: [],
  selectedFileTypes: [],

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const documents = await documentService.getDocuments();
      set({ documents, isLoading: false });
    } catch (error) {
      console.error('Failed to load documents:', error);
      set({
        error: 'Failed to load documents. Please check your connection.',
        isLoading: false,
      });
    }
  },

  uploadDocument: async (file, metadata) => {
    set({ uploadError: null });
    try {
      const docMeta = await documentService.uploadDocument(file, metadata);
      set((state) => ({
        documents: [docMeta, ...state.documents],
      }));
      return docMeta;
    } catch (error) {
      console.error('Failed to upload document:', error);
      set({ uploadError: 'Failed to upload document. Please try again.' });
      return null;
    }
  },

  deleteDocument: async (doc) => {
    const { documents } = get();

    // Optimistic update
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== doc.id),
    }));

    try {
      await documentService.deleteDocument(doc);
    } catch (error) {
      console.error('Failed to delete document:', error);
      // Rollback
      set({ documents });
    }
  },

  toggleCanonical: async (id) => {
    const { documents } = get();
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;

    const newValue = !doc.isCanonical;

    // Optimistic update
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === id ? { ...d, isCanonical: newValue } : d
      ),
    }));

    try {
      await documentService.toggleCanonical(id, newValue);
    } catch (error) {
      console.error('Failed to toggle canonical:', error);
      // Rollback
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, isCanonical: !newValue } : d
        ),
      }));
    }
  },

  linkToCard: async (docId, cardId) => {
    // Optimistic update
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId ? { ...d, linkedCards: [...d.linkedCards, cardId] } : d
      ),
    }));

    try {
      await documentService.linkDocumentToCard(docId, cardId);
    } catch (error) {
      console.error('Failed to link document to card:', error);
      // Rollback
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === docId
            ? { ...d, linkedCards: d.linkedCards.filter((id) => id !== cardId) }
            : d
        ),
      }));
    }
  },

  unlinkFromCard: async (docId, cardId) => {
    const { documents } = get();
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    // Optimistic update
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === docId
          ? { ...d, linkedCards: d.linkedCards.filter((id) => id !== cardId) }
          : d
      ),
    }));

    try {
      await documentService.unlinkDocumentFromCard(docId, cardId);
    } catch (error) {
      console.error('Failed to unlink document from card:', error);
      // Rollback
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === docId ? { ...d, linkedCards: [...d.linkedCards, cardId] } : d
        ),
      }));
    }
  },

  toggleTagFilter: (tag) => {
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    }));
  },

  toggleFileTypeFilter: (fileType) => {
    set((state) => ({
      selectedFileTypes: state.selectedFileTypes.includes(fileType)
        ? state.selectedFileTypes.filter((t) => t !== fileType)
        : [...state.selectedFileTypes, fileType],
    }));
  },

  clearFilters: () => {
    set({ selectedTags: [], selectedFileTypes: [] });
  },

  getCanonicalDocuments: () => {
    const { documents, searchQuery, selectedTags, selectedFileTypes } = get();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalize = (value?: string | null) => (value ?? '').toLowerCase();
    return documents
      .filter((d) => d.isCanonical)
      .filter((d) =>
        normalizedQuery
          ? normalize(d.filename).includes(normalizedQuery) ||
            (d.tags ?? []).some((tag) =>
              normalize(tag ?? undefined).includes(normalizedQuery)
            )
          : true
      )
      .filter((d) =>
        selectedTags.length > 0
          ? selectedTags.some((tag) => (d.tags ?? []).includes(tag))
          : true
      )
      .filter((d) =>
        selectedFileTypes.length > 0
          ? selectedFileTypes.includes(d.fileType)
          : true
      )
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  },

  getNonCanonicalDocuments: () => {
    const { documents, searchQuery, selectedTags, selectedFileTypes } = get();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalize = (value?: string | null) => (value ?? '').toLowerCase();
    return documents
      .filter((d) => !d.isCanonical)
      .filter((d) =>
        normalizedQuery
          ? normalize(d.filename).includes(normalizedQuery) ||
            (d.tags ?? []).some((tag) =>
              normalize(tag ?? undefined).includes(normalizedQuery)
            )
          : true
      )
      .filter((d) =>
        selectedTags.length > 0
          ? selectedTags.some((tag) => (d.tags ?? []).includes(tag))
          : true
      )
      .filter((d) =>
        selectedFileTypes.length > 0
          ? selectedFileTypes.includes(d.fileType)
          : true
      )
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  },

  getFilteredDocuments: () => {
    const { documents, searchQuery, selectedTags, selectedFileTypes } = get();
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalize = (value?: string | null) => (value ?? '').toLowerCase();
    return documents
      .filter((d) =>
        normalizedQuery
          ? normalize(d.filename).includes(normalizedQuery) ||
            (d.tags ?? []).some((tag) =>
              normalize(tag ?? undefined).includes(normalizedQuery)
            )
          : true
      )
      .filter((d) =>
        selectedTags.length > 0
          ? selectedTags.some((tag) => (d.tags ?? []).includes(tag))
          : true
      )
      .filter((d) =>
        selectedFileTypes.length > 0
          ? selectedFileTypes.includes(d.fileType)
          : true
      )
      .sort((a, b) => b.uploadedAt - a.uploadedAt);
  },

  getRecentTags: (limit = 8) => {
    const { documents } = get();
    const ordered = [...documents].sort((a, b) => b.uploadedAt - a.uploadedAt);
    const tags: string[] = [];

    for (const doc of ordered) {
      const docTags = doc.tags ?? [];
      for (const tag of docTags) {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
        if (tags.length >= limit) {
          return tags;
        }
      }
    }

    return tags;
  },

  getAllTags: () => {
    const { documents } = get();
    const tagCounts = new Map<string, number>();
    for (const doc of documents) {
      for (const tag of doc.tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  getAllFileTypes: () => {
    const { documents } = get();
    const typeCounts = new Map<string, number>();
    for (const doc of documents) {
      const ft = doc.fileType || 'other';
      typeCounts.set(ft, (typeCounts.get(ft) || 0) + 1);
    }
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  },
}));
