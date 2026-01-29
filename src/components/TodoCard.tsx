import React from 'react';
import {
  Trash2,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
} from 'lucide-react';
import type { TodoItem } from '../todoStore';

interface TodoCardProps {
  todo: TodoItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const PRIORITY_CONFIG: Record<
  TodoItem['priority'],
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  high: {
    icon: <ArrowUp size={12} />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  medium: {
    icon: <Minus size={12} />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  low: {
    icon: <ArrowDown size={12} />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-50',
  },
};

export default function TodoCard({
  todo,
  onToggleComplete,
  onDelete,
  onEdit,
}: TodoCardProps) {
  const priorityConfig = PRIORITY_CONFIG[todo.priority];
  const isOverdue =
    todo.dueDate && todo.dueDate < Date.now() && !todo.completed;

  const formattedDueDate = todo.dueDate
    ? new Date(todo.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${todo.text}"? This cannot be undone.`)) {
      onDelete(todo.id);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(todo.id);
  };

  return (
    <div
      onClick={() => onEdit(todo.id)}
      className={`bg-white border rounded-lg shadow-sm hover:shadow-md p-4 transition-all cursor-pointer group max-h-[320px] overflow-hidden flex flex-col ${
        todo.completed
          ? 'border-slate-200 opacity-60'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`mt-0.5 flex-shrink-0 transition-colors ${
            todo.completed
              ? 'text-green-500 hover:text-green-600'
              : 'text-slate-300 hover:text-slate-400'
          }`}
        >
          {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-medium leading-snug line-clamp-4 ${
                todo.completed
                  ? 'text-slate-400 line-through'
                  : 'text-slate-900'
              }`}
            >
              {todo.text}
            </p>

            <button
              onClick={handleDelete}
              className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 flex-shrink-0"
              title="Delete todo"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {todo.description && (
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">
              {todo.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 mt-3">
            {/* Priority */}
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${priorityConfig.bgColor} ${priorityConfig.color}`}
            >
              {priorityConfig.icon}
              {todo.priority}
            </span>

            {/* Due date */}
            {formattedDueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs ${
                  isOverdue ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                <Calendar size={12} />
                {formattedDueDate}
              </span>
            )}

            {/* Tags */}
            {todo.tags.length > 0 && (
              <div className="flex gap-1">
                {todo.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {todo.tags.length > 2 && (
                  <span className="text-xs text-slate-400">
                    +{todo.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
