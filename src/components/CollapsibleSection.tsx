import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  gradientClass: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  gradientClass,
  children,
  defaultOpen = true,
  count = 0,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-lg border transition-all duration-200 ${gradientClass} ${isOpen ? 'mb-6' : 'mb-4'}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-3 sm:px-4 py-4 sm:py-3 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-t-lg min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/50 p-1.5 rounded-lg group-hover:bg-white/80 transition-colors">
            {isOpen ? (
              <ChevronUp size={20} className="text-slate-600" />
            ) : (
              <ChevronDown size={20} className="text-slate-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              {title}
              {count > 0 && (
                <span className="text-sm font-normal bg-white/40 px-2 py-0.5 rounded-full text-slate-600 border border-slate-200/50">
                  {count}
                </span>
              )}
            </h2>
            {subtitle && (
              <span className="text-xs text-slate-500 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-3 sm:px-6 pb-4 sm:pb-6 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Grid layout for Kanban cards - responsive for approx 2 rows depending on screen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-3">
            {children}
          </div>
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection;
