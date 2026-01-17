import React, { useEffect, useState } from 'react';
import { X, Save, Trash2, Calendar, Tag } from 'lucide-react';
import { TodoItem } from '../todoStore';

interface TodoSidebarProps {
  todo: TodoItem | null; // null means adding a new todo
  isOpen: boolean;
  onClose: () => void;
  onSave: (todoData: Partial<TodoItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function TodoSidebar({
  todo,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TodoSidebarProps) {
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoItem['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when todo changes or sidebar opens
  useEffect(() => {
    if (isOpen) {
      if (todo) {
        setText(todo.text);
        setDescription(todo.description || '');
        setPriority(todo.priority);
        setDueDate(
          todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
        );
        setTags(todo.tags.join(', '));
      } else {
        // Reset for new todo
        setText('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setTags('');
      }
    }
  }, [todo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        text: text.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save todo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (todo && onDelete) {
      if (confirm('Are you sure you want to delete this task?')) {
        await onDelete(todo.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">
          {todo ? 'Edit Task' : 'New Task'}
        </h2>
        <div className="flex items-center gap-1">
          {todo && onDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
              title="Delete task"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Task Name *
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
            rows={6}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as TodoItem['priority'])
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Tags
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="urgent, client, follow-up (comma separated)"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </form>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isSaving}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors shadow-sm"
        >
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save size={18} />
              {todo ? 'Save Changes' : 'Create Task'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
