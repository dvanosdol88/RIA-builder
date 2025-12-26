import { create } from 'zustand';
import * as todoService from './services/todoService';
import type { TodoItem } from './services/todoService';

export type { TodoItem } from './services/todoService';

interface TodoStore {
  todos: TodoItem[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterCompleted: 'all' | 'active' | 'completed';

  // Actions
  setSearchQuery: (query: string) => void;
  setFilterCompleted: (filter: 'all' | 'active' | 'completed') => void;
  loadTodos: () => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id'>) => Promise<TodoItem | null>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;

  // Computed getters
  getFilteredTodos: () => TodoItem[];
  getActiveTodos: () => TodoItem[];
  getCompletedTodos: () => TodoItem[];
}

export const useTodoStore = create<TodoStore>()((set, get) => ({
  todos: [],
  isLoading: true,
  error: null,
  searchQuery: '',
  filterCompleted: 'all',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterCompleted: (filterCompleted) => set({ filterCompleted }),

  loadTodos: async () => {
    set({ isLoading: true, error: null });
    try {
      const todos = await todoService.getTodos();
      set({ todos, isLoading: false });
    } catch (error) {
      console.error('Failed to load todos:', error);
      set({
        error: 'Failed to load todos. Please check your connection.',
        isLoading: false,
      });
    }
  },

  addTodo: async (todoData) => {
    try {
      const newTodo = await todoService.addTodo(todoData);
      set((state) => ({
        todos: [newTodo, ...state.todos],
      }));
      return newTodo;
    } catch (error) {
      console.error('Failed to add todo:', error);
      return null;
    }
  },

  updateTodo: async (id, updates) => {
    const { todos } = get();
    const originalTodo = todos.find((t) => t.id === id);
    if (!originalTodo) return;

    // Optimistic update
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, ...updates, updatedAt: Date.now() } : todo
      ),
    }));

    try {
      await todoService.updateTodo(id, updates);
    } catch (error) {
      console.error('Failed to update todo:', error);
      // Rollback
      set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? originalTodo : todo
        ),
      }));
    }
  },

  deleteTodo: async (id) => {
    const { todos } = get();
    const originalTodos = todos;

    // Optimistic update
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));

    try {
      await todoService.deleteTodo(id);
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Rollback
      set({ todos: originalTodos });
    }
  },

  toggleComplete: async (id) => {
    const { todos } = get();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const newCompleted = !todo.completed;

    // Optimistic update
    set((state) => ({
      todos: state.todos.map((t) =>
        t.id === id ? { ...t, completed: newCompleted, updatedAt: Date.now() } : t
      ),
    }));

    try {
      await todoService.toggleTodoComplete(id, newCompleted);
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      // Rollback
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, completed: !newCompleted } : t
        ),
      }));
    }
  },

  getFilteredTodos: () => {
    const { todos, searchQuery, filterCompleted } = get();
    return todos
      .filter((todo) => {
        // Filter by completion status
        if (filterCompleted === 'active' && todo.completed) return false;
        if (filterCompleted === 'completed' && !todo.completed) return false;
        return true;
      })
      .filter((todo) =>
        searchQuery
          ? todo.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            todo.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : true
      )
      .sort((a, b) => {
        // Sort: incomplete first, then by priority, then by creation date
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.createdAt - a.createdAt;
      });
  },

  getActiveTodos: () => {
    const { todos } = get();
    return todos.filter((todo) => !todo.completed);
  },

  getCompletedTodos: () => {
    const { todos } = get();
    return todos.filter((todo) => todo.completed);
  },
}));
