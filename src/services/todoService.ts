import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTION_NAME = 'todos';

export interface TodoItem {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  category?: string;
  tags: string[];
}

/**
 * Get all todos from Firestore
 */
export async function getTodos(): Promise<TodoItem[]> {
  try {
    const todosCollection = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(todosCollection);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as TodoItem[];
  } catch (error) {
    console.error('Error getting todos:', error);
    throw error;
  }
}

/**
 * Add a new todo
 */
export async function addTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem> {
  const id = crypto.randomUUID();
  const newTodo: TodoItem = {
    ...todo,
    id,
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, newTodo);
    return newTodo;
  } catch (error) {
    console.error('Error adding todo:', error);
    throw error;
  }
}

/**
 * Update an existing todo
 */
export async function updateTodo(
  id: string,
  updates: Partial<TodoItem>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
}

/**
 * Delete a todo
 */
export async function deleteTodo(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
}

/**
 * Toggle todo completion status
 */
export async function toggleTodoComplete(
  id: string,
  completed: boolean
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { completed, updatedAt: Date.now() });
  } catch (error) {
    console.error('Error toggling todo complete:', error);
    throw error;
  }
}
