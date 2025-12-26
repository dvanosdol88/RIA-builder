import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  CheckSquare,
  X,
  ListTodo,
} from 'lucide-react';
import { useTodoStore, TodoItem } from '../todoStore';
import TodoCard from './TodoCard';

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [newTodo, setNewTodo] = useState({
    text: '',
    description: '',
    priority: 'medium' as TodoItem['priority'],
    tags: '',
    dueDate: '',
  });

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const filteredTodos = getFilteredTodos();
  const activeTodos = getActiveTodos();
  const completedTodos = getCompletedTodos();

  const resetForm = () => {
    setNewTodo({
      text: '',
      description: '',
      priority: 'medium',
      tags: '',
      dueDate: '',
    });
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.text.trim()) return;

    await addTodo({
      text: newTodo.text.trim(),
      description: newTodo.description.trim() || undefined,
      completed: false,
      priority: newTodo.priority,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).getTime() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: newTodo.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    resetForm();
    setShowAddModal(false);
  };

  const handleEditTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !newTodo.text.trim()) return;

    await updateTodo(editingTodo.id, {
      text: newTodo.text.trim(),
      description: newTodo.description.trim() || undefined,
      priority: newTodo.priority,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).getTime() : undefined,
      tags: newTodo.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    resetForm();
    setEditingTodo(null);
  };

  const openEditModal = (id: string) => {
    const todo = filteredTodos.find((t) => t.id === id);
    if (!todo) return;

    setEditingTodo(todo);
    setNewTodo({
      text: todo.text,
      description: todo.description || '',
      priority: todo.priority,
      tags: todo.tags.join(', '),
      dueDate: todo.dueDate
        ? new Date(todo.dueDate).toISOString().split('T')[0]
        : '',
    });
  };

  const closeModal = () => {
    resetForm();
    setShowAddModal(false);
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
            onClick={() => setShowAddModal(true)}
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
        {filteredTodos.length === 0 && !searchQuery && filterCompleted === 'all' && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-slate-200">
            <ListTodo className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No tasks yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first task
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredTodos.length === 0 && (searchQuery || filterCompleted !== 'all') && (
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
                onEdit={openEditModal}
              />
            ))}
          </div>
        )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingTodo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingTodo ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={editingTodo ? handleEditTodo : handleAddTodo}
              className="p-4 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Task *
                </label>
                <input
                  type="text"
                  value={newTodo.text}
                  onChange={(e) =>
                    setNewTodo({ ...newTodo, text: e.target.value })
                  }
                  placeholder="What needs to be done?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Description
                </label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) =>
                    setNewTodo({ ...newTodo, description: e.target.value })
                  }
                  placeholder="Add more details..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Priority
                  </label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) =>
                      setNewTodo({
                        ...newTodo,
                        priority: e.target.value as TodoItem['priority'],
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) =>
                      setNewTodo({ ...newTodo, dueDate: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTodo.tags}
                  onChange={(e) =>
                    setNewTodo({ ...newTodo, tags: e.target.value })
                  }
                  placeholder="urgent, client, follow-up"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTodo.text.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                >
                  {editingTodo ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
