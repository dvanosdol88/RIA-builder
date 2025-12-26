import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, User, Megaphone, Briefcase, Cpu, Scale, Map } from 'lucide-react';
import { CATEGORY_STRUCTURE, Category, useIdeaStore } from '../ideaStore';

interface OutlineViewProps {
  onNavigate: (category: Category, page: string) => void;
}

// Helper to render category icon
const CategoryIcon = ({ category, size = 16 }: { category: Category; size?: number }) => {
  const iconKey = CATEGORY_STRUCTURE[category].emoji;
  switch (iconKey) {
    case 'megaphone':
      return <Megaphone size={size} className="inline flex-shrink-0" />;
    case 'user':
      return <User size={size} className="inline flex-shrink-0" />;
    case 'briefcase':
      return <Briefcase size={size} className="inline flex-shrink-0" />;
    case 'cpu':
      return <Cpu size={size} className="inline flex-shrink-0" />;
    case 'scale':
      return <Scale size={size} className="inline flex-shrink-0" />;
    case 'map':
      return <Map size={size} className="inline flex-shrink-0" />;
    default:
      return <span className="flex-shrink-0">{iconKey}</span>;
  }
};

export default function OutlineView({ onNavigate }: OutlineViewProps) {
  const { getPagesForCategory, getIdeasForPage } = useIdeaStore();

  // Track which categories are expanded (all expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(
    new Set(Object.keys(CATEGORY_STRUCTURE) as Category[])
  );

  const toggleCategory = (category: Category) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const categories = Object.keys(CATEGORY_STRUCTURE) as Category[];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Project Outline</h1>
        <p className="text-gray-500 text-sm mt-1">
          Navigate to any page in your project. Click a page to open it.
        </p>
      </div>

      {/* Category Tree */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {categories.map((category, index) => {
          const isExpanded = expandedCategories.has(category);
          const pages = getPagesForCategory(category);
          const categoryInfo = CATEGORY_STRUCTURE[category];

          return (
            <div key={category} className={index > 0 ? 'border-t border-gray-100' : ''}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </span>
                <CategoryIcon category={category} size={18} />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-800">
                    {categoryInfo.label}
                  </span>
                  {categoryInfo.subtitle && (
                    <span className="text-gray-400 text-sm ml-2">
                      {categoryInfo.subtitle}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {pages.length} pages
                </span>
              </button>

              {/* Pages List */}
              {isExpanded && (
                <div className="pb-2">
                  {pages.map((page) => {
                    const ideaCount = getIdeasForPage(category, page).length;

                    return (
                      <button
                        key={page}
                        onClick={() => onNavigate(category, page)}
                        className="w-full flex items-center gap-3 pl-12 pr-4 py-2 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <FileText size={14} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                        <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-700 truncate">
                          {page}
                        </span>
                        {ideaCount > 0 && (
                          <span className="text-xs text-gray-400 group-hover:text-blue-500">
                            {ideaCount} {ideaCount === 1 ? 'idea' : 'ideas'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {categories.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Categories</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {categories.reduce((sum, cat) => sum + getPagesForCategory(cat).length, 0)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Pages</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {categories.reduce(
              (sum, cat) =>
                sum +
                getPagesForCategory(cat).reduce(
                  (pageSum, page) => pageSum + getIdeasForPage(cat, page).length,
                  0
                ),
              0
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total Ideas</div>
        </div>
      </div>

      {/* Expand/Collapse All */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={() => setExpandedCategories(new Set(categories))}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Expand All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => setExpandedCategories(new Set())}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Collapse All
        </button>
      </div>
    </div>
  );
}
