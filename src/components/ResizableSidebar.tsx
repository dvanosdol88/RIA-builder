import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { PanelLeftClose, PanelLeft, Menu } from 'lucide-react';

interface ResizableSidebarProps {
  children: ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

const MOBILE_BREAKPOINT = 768; // md breakpoint

const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  initialWidth = 260,
  minWidth = 200,
  maxWidth = 480,
  className = '',
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use ref to track resizing state for use in event listeners to avoid stale closures
  const isResizingRef = useRef(false);

  // Check for mobile viewport and auto-collapse
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      // Auto-collapse on mobile on initial load
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // Only run on mount

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      // Calculate new width based on mouse position
      const newWidth = e.clientX;

      // Constrain width between min and max
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);

      // Restore text selection and body cursor
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    // Attach listeners to window only when resizing starts
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // Cleanup listeners on unmount or when resizing stops
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable resize on mobile
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);

    // Disable text selection to prevent highlighting artifacts while dragging
    document.body.style.userSelect = 'none';
    // Maintain the resize cursor even if the mouse leaves the handle area
    document.body.style.cursor = 'col-resize';
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // On mobile, sidebar slides over content; on desktop, it pushes content
  if (isMobile) {
    return (
      <>
        {/* Mobile toggle button - always visible */}
        <button
          onClick={toggleCollapse}
          className="fixed top-[72px] left-3 z-50 p-2.5 rounded-lg shadow-lg bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Open menu' : 'Close menu'}
          aria-label={isCollapsed ? 'Open menu' : 'Close menu'}
        >
          <Menu size={22} className="text-gray-700" />
        </button>

        {/* Mobile overlay */}
        {!isCollapsed && (
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
            onClick={toggleCollapse}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar - slides from left */}
        <div
          className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out ${className} ${
            isCollapsed ? '-translate-x-full' : 'translate-x-0'
          }`}
          style={{ width: `${Math.min(width, 320)}px` }}
        >
          {/* Close button inside sidebar */}
          <button
            onClick={toggleCollapse}
            className="absolute top-4 right-3 p-2 rounded-lg hover:bg-gray-200 transition-colors z-10"
            title="Close menu"
            aria-label="Close menu"
          >
            <PanelLeftClose size={20} className="text-gray-600" />
          </button>

          {/* Sidebar Content */}
          <div className="flex-1 h-full w-full overflow-hidden">
            {children}
          </div>
        </div>
      </>
    );
  }

  // Desktop layout
  return (
    <div
      className={`relative h-full flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${className}`}
      style={{ width: isCollapsed ? '0px' : `${width}px` }}
    >
      {/* Desktop collapse toggle button */}
      <button
        onClick={toggleCollapse}
        className={`absolute top-4 z-50 p-2 rounded-lg shadow-md bg-white border border-gray-200 hover:bg-gray-50 transition-all duration-300 ${
          isCollapsed ? 'right-[-44px]' : 'right-2'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <PanelLeft size={20} className="text-gray-600" />
        ) : (
          <PanelLeftClose size={20} className="text-gray-600" />
        )}
      </button>

      {/* Sidebar Content Container */}
      <div
        className={`flex-1 w-full overflow-hidden transition-opacity duration-200 ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {children}
      </div>

      {/* Invisible Grab Handle (5px width) - hidden when collapsed */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-40 hover:bg-blue-500/20 transition-colors"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ResizableSidebar;
