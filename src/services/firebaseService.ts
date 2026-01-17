import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Idea, Category } from '../ideaStore';

const COLLECTION_NAME = 'ideas';
const CUSTOM_PAGES_COLLECTION = 'customPages';
const PAGE_ORDERS_COLLECTION = 'pageOrders';

// Custom Page type for user-created pages within categories
export interface CustomPage {
  id: string;
  category: Category;
  pageName: string;
  description: string;
  createdAt: number;
  updatedAt?: number;
}

export interface PageOrder {
  category: Category;
  orderedPages: string[];
}

/**
 * Get all ideas from Firestore
 */
export async function getIdeas(): Promise<Idea[]> {
  const ideasCollection = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(ideasCollection);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as Idea[];
}

/**
 * Add a new idea to Firestore
 */
export async function addIdea(idea: Idea): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, idea.id);
  await setDoc(docRef, idea);
}

/**
 * Update an existing idea in Firestore
 */
export async function updateIdea(
  id: string,
  updates: Partial<Idea>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
}

/**
 * Delete an idea from Firestore
 */
export async function deleteIdea(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Batch update multiple ideas (used for toggleIdeaFocus)
 */
export async function batchUpdateIdeas(
  updates: { id: string; changes: Partial<Idea> }[]
): Promise<void> {
  const batch = writeBatch(db);

  for (const { id, changes } of updates) {
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.update(docRef, changes);
  }

  await batch.commit();
}

/**
 * Seed initial data to Firestore (only if collection is empty)
 */
export async function seedInitialData(seedData: Idea[]): Promise<void> {
  const batch = writeBatch(db);

  for (const idea of seedData) {
    const docRef = doc(db, COLLECTION_NAME, idea.id);
    batch.set(docRef, idea);
  }

  await batch.commit();
}

// ============================================
// CUSTOM PAGES CRUD OPERATIONS
// ============================================

/**
 * Get all custom pages from Firestore
 */
export async function getCustomPages(): Promise<CustomPage[]> {
  const pagesCollection = collection(db, CUSTOM_PAGES_COLLECTION);
  const snapshot = await getDocs(pagesCollection);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as CustomPage[];
}

/**
 * Add a new custom page to Firestore
 */
export async function addCustomPage(page: CustomPage): Promise<void> {
  const docRef = doc(db, CUSTOM_PAGES_COLLECTION, page.id);
  await setDoc(docRef, page);
}

/**
 * Update a custom page in Firestore (for renaming)
 */
export async function updateCustomPage(
  id: string,
  updates: Partial<CustomPage>
): Promise<void> {
  const docRef = doc(db, CUSTOM_PAGES_COLLECTION, id);
  await updateDoc(docRef, updates);
}

/**
 * Delete a custom page from Firestore
 */
export async function deleteCustomPage(id: string): Promise<void> {
  const docRef = doc(db, CUSTOM_PAGES_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Batch delete multiple ideas (for when deleting a page with ideas)
 */
export async function batchDeleteIdeas(ideaIds: string[]): Promise<void> {
  const batch = writeBatch(db);

  for (const id of ideaIds) {
    const docRef = doc(db, COLLECTION_NAME, id);
    batch.delete(docRef);
  }

  await batch.commit();
}

/**
 * Rename a page: update all ideas that reference the old page name
 */
export async function renamePageInIdeas(
  category: Category,
  oldPageName: string,
  newPageName: string
): Promise<void> {
  const ideas = await getIdeas();
  const affectedIdeas = ideas.filter(
    (idea) => idea.category === category && idea.subcategory === oldPageName
  );

  if (affectedIdeas.length === 0) return;

  const batch = writeBatch(db);

  for (const idea of affectedIdeas) {
    const docRef = doc(db, COLLECTION_NAME, idea.id);
    batch.update(docRef, { subcategory: newPageName });
  }

  await batch.commit();
}

// ============================================
// PAGE ORDERS CRUD OPERATIONS
// ============================================

/**
 * Get all page orders from Firestore
 */
export async function getPageOrders(): Promise<PageOrder[]> {
  const ordersCollection = collection(db, PAGE_ORDERS_COLLECTION);
  const snapshot = await getDocs(ordersCollection);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    category: doc.id as Category,
  })) as PageOrder[];
}

/**
 * Save page order for a category
 */
export async function savePageOrder(
  category: Category,
  orderedPages: string[]
): Promise<void> {
  const docRef = doc(db, PAGE_ORDERS_COLLECTION, category);
  await setDoc(docRef, { orderedPages });
}

// ============================================
// CONVERSATION SUMMARY OPERATIONS
// ============================================

const SUMMARIES_COLLECTION = 'conversationSummaries';

export interface ConversationSummary {
  id: string;
  timestamp: number;
  summary: string;
  keyDecisions: string[];
}

/**
 * Save a conversation summary to Firestore
 */
export async function saveConversationSummary(
  summary: ConversationSummary
): Promise<void> {
  const docRef = doc(db, SUMMARIES_COLLECTION, summary.id);
  await setDoc(docRef, summary);
}

/**
 * Get the most recent conversation summaries
 */
export async function getRecentConversationSummaries(
  limitCount: number = 10
): Promise<ConversationSummary[]> {
  const summariesCollection = collection(db, SUMMARIES_COLLECTION);
  const q = query(
    summariesCollection,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as ConversationSummary[];
}

const CHECKLIST_COLLECTION = 'checklistStates';

export type ChecklistStatus = 'not_started' | 'in_progress' | 'complete';

export interface ChecklistItemState {
  itemId: string;
  status: ChecklistStatus;
  updatedAt: number;
}

/**
 * Get all checklist item states from Firestore
 */
export async function getChecklistStates(): Promise<
  Record<string, ChecklistStatus>
> {
  const statesCollection = collection(db, CHECKLIST_COLLECTION);
  const snapshot = await getDocs(statesCollection);

  const states: Record<string, ChecklistStatus> = {};
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as ChecklistItemState;
    states[doc.id] = data.status;
  });

  return states;
}

/**
 * Save a single checklist item state to Firestore
 */
export async function saveChecklistItemState(
  itemId: string,
  status: ChecklistStatus
): Promise<void> {
  const docRef = doc(db, CHECKLIST_COLLECTION, itemId);
  await setDoc(docRef, {
    itemId,
    status,
    updatedAt: Date.now(),
  });
}
