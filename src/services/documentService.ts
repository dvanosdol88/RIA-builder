import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebaseConfig';

const COLLECTION_NAME = 'documents';

export interface DocumentMeta {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  uploadedAt: number;
  storageUrl: string;
  thumbnailUrl?: string | null;
  linkedCards: string[];
  isCanonical: boolean;
  page?: string | null;
  section?: string | null;
  tab?: string | null;
  tags?: string[];
  summary?: string | null;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Upload a document to Firebase Storage and save metadata to Firestore
 */
export async function uploadDocument(
  file: File,
  metadata?: {
    page?: string;
    section?: string;
    tab?: string;
    tags?: string[];
    summary?: string;
    thumbnailUrl?: string;
  }
): Promise<DocumentMeta> {
  const id = crypto.randomUUID();
  const storagePath = `documents/${id}-${file.name}`;
  const storageRef = ref(storage, storagePath);
  const trimmedTags =
    metadata?.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];

  try {
    // Upload file to Storage
    await uploadBytes(storageRef, file);
    const storageUrl = await getDownloadURL(storageRef);

    // Create metadata
    const docMeta: DocumentMeta = {
      id,
      filename: file.name,
      fileType: getFileExtension(file.name),
      size: file.size,
      uploadedAt: Date.now(),
      storageUrl,
      thumbnailUrl: metadata?.thumbnailUrl,
      linkedCards: [],
      isCanonical: false,
      page: metadata?.page?.trim() || null,
      section: metadata?.section?.trim() || null,
      tab: metadata?.tab?.trim() || null,
      tags: trimmedTags,
      summary: metadata?.summary?.trim() || null,
    };

    // Save to Firestore
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, docMeta);

    return docMeta;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Get all documents from Firestore
 */
export async function getDocuments(): Promise<DocumentMeta[]> {
  try {
    const docsCollection = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(docsCollection);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as DocumentMeta[];
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
}

/**
 * Delete a document from Storage and Firestore
 */
export async function deleteDocument(docMeta: DocumentMeta): Promise<void> {
  const storagePath = `documents/${docMeta.id}-${docMeta.filename}`;
  const storageRef = ref(storage, storagePath);

  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Could not delete from storage:', error);
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, docMeta.id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document from Firestore:', error);
    throw error;
  }
}

/**
 * Update document metadata
 */
export async function updateDocument(
  id: string,
  updates: Partial<DocumentMeta>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

/**
 * Toggle canonical status
 */
export async function toggleCanonical(
  id: string,
  isCanonical: boolean
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { isCanonical });
  } catch (error) {
    console.error('Error toggling canonical status:', error);
    throw error;
  }
}

/**
 * Link a document to a card
 */
export async function linkDocumentToCard(
  docId: string,
  cardId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, {
      linkedCards: arrayUnion(cardId),
    });
  } catch (error) {
    console.error('Error linking document to card:', error);
    throw error;
  }
}

/**
 * Unlink a document from a card
 */
export async function unlinkDocumentFromCard(
  docId: string,
  cardId: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, docId);
    await updateDoc(docRef, {
      linkedCards: arrayRemove(cardId),
    });
  } catch (error) {
    console.error('Error unlinking document from card:', error);
    throw error;
  }
}
