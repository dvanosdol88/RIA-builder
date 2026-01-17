import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION_NAME = 'idea_hopper';

export interface HopperIdea {
  id: string;
  title: string;
  description: string;
  /** @deprecated Use referenceUrls instead */
  referenceUrl?: string;
  referenceUrls: string[];
  createdAt: number;
  updatedAt: number;
  status: 'new' | 'exploring' | 'developing' | 'implemented' | 'parked';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  notes: string;
}

/**
 * Get all hopper ideas from Firestore
 * Handles migration from old referenceUrl to new referenceUrls format
 */
export async function getHopperIdeas(): Promise<HopperIdea[]> {
  try {
    const ideasCollection = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(ideasCollection);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Migrate old referenceUrl to referenceUrls array
      let referenceUrls = data.referenceUrls || [];
      if (data.referenceUrl && !referenceUrls.includes(data.referenceUrl)) {
        referenceUrls = [data.referenceUrl, ...referenceUrls];
      }
      return {
        ...data,
        id: doc.id,
        referenceUrls,
      };
    }) as HopperIdea[];
  } catch (error) {
    console.error('Error getting hopper ideas:', error);
    throw error;
  }
}

/**
 * Add a new hopper idea
 */
export async function addHopperIdea(
  idea: Omit<HopperIdea, 'id'>
): Promise<HopperIdea> {
  const id = crypto.randomUUID();
  const newIdea: HopperIdea = {
    ...idea,
    id,
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, newIdea);
    return newIdea;
  } catch (error) {
    console.error('Error adding hopper idea:', error);
    throw error;
  }
}

/**
 * Update an existing hopper idea
 */
export async function updateHopperIdea(
  id: string,
  updates: Partial<HopperIdea>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    console.error('Error updating hopper idea:', error);
    throw error;
  }
}

/**
 * Delete a hopper idea
 */
export async function deleteHopperIdea(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting hopper idea:', error);
    throw error;
  }
}

/**
 * Seed initial ideas if the collection is empty
 */
export async function seedInitialIdeas(): Promise<HopperIdea[]> {
  try {
    const existingIdeas = await getHopperIdeas();

    if (existingIdeas.length > 0) {
      return existingIdeas;
    }

    const seedIdea: Omit<HopperIdea, 'id'> = {
      title: 'How it works overview',
      description:
        'Shows how the client and advisor will work together, and why this is such an effective solution.',
      referenceUrls: ['https://youtu.be/k1UBwj1Fyog'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'new',
      priority: 'high',
      tags: ['onboarding', 'client-experience', 'video'],
      notes: '',
    };

    const newIdea = await addHopperIdea(seedIdea);
    return [newIdea];
  } catch (error) {
    console.error('Error seeding initial ideas:', error);
    throw error;
  }
}
