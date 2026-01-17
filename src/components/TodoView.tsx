import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  CheckSquare,
  ListTodo,
} from 'lucide-react';
import { useTodoStore, TodoItem } from '../todoStore';
import TodoCard from './TodoCard';
import TodoSidebar from './TodoSidebar';

export default function TodoView() {
  const {
    isLoading,
    error,
    searchQuery,
    filterCompleted,
    setSearchQuery,
    setFilterCompleted,
    loadTodos,
    addTodo,
    deleteTodo,
    toggleComplete,
    updateTodo,
    getFilteredTodos,
    getActiveTodos,
    getCompletedTodos,
  } = useTodoStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const filteredTodos = getFilteredTodos();
  const activeTodos = getActiveTodos();
  const completedTodos = getCompletedTodos();

  const handleSaveTodo = async (todoData: Partial<TodoItem>) => {
    if (editingTodo) {
      // Update existing
      await updateTodo(editingTodo.id, todoData);
    } else {
      // Create new
      await addTodo({
        text: todoData.text!,
        description: todoData.description,
        completed: false,
        priority: todoData.priority || 'medium',
        dueDate: todoData.dueDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: todoData.tags || [],
      });
    }
    // Close sidebar is handled by sidebar calling onClose on success,
    // but here we just need to ensure state is clean if we were to manage it.
    // Actually TodoSidebar calls onSave then onClose.
  };

  const openAddSidebar = () => {
    setEditingTodo(null);
    setIsSidebarOpen(true);
  };

  const openEditSidebar = (id: string) => {
    const todo = filteredTodos.find((t) => t.id === id);
    if (!todo) return;
    setEditingTodo(todo);
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setEditingTodo(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium mb-2">Connection Error</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => loadTodos()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            To Do
          </h1>
          <p className="text-slate-500 mt-1">
            {activeTodos.length} active · {completedTodos.length} completed
          </p>
        </div>

        <button
          onClick={openAddSidebar}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
          {(['all', 'active', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterCompleted(filter)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                filterCompleted === filter
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredTodos.length === 0 &&
        !searchQuery &&
        filterCompleted === 'all' && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <ListTodo className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No tasks yet</p>
            <button
              onClick={openAddSidebar}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first task
            </button>
          </div>
        )}

      {/* No Results */}
      {filteredTodos.length === 0 &&
        (searchQuery || filterCompleted !== 'all') && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              No tasks found
              {searchQuery && ` matching "${searchQuery}"`}
              {filterCompleted !== 'all' && ` in ${filterCompleted}`}
            </p>
          </div>
        )}

      {/* Todos List */}
      {filteredTodos.length > 0 && (
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onToggleComplete={toggleComplete}
              onDelete={deleteTodo}
              onEdit={openEditSidebar}
            />
          ))}
        </div>
      )}

      {/* Sidebar for Add/Edit */}
      <TodoSidebar
        todo={editingTodo}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onSave={handleSaveTodo}
        onDelete={deleteTodo}
      />
    </div>
  );
}
