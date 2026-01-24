import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizableSidebarProps {
  children: ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
}

const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  initialWidth = 260,
  minWidth = 200,
  maxWidth = 480,
  className = '',
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  
  // Use ref to track resizing state for use in event listeners to avoid stale closures
  const isResizingRef = useRef(false);

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
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    
    // Disable text selection to prevent highlighting artifacts while dragging
    document.body.style.userSelect = 'none';
    // Maintain the resize cursor even if the mouse leaves the handle area
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div 
      className={`relative h-full flex-shrink-0 flex flex-col ${className}`} 
      style={{ width: `${width}px` }}
    >
      {/* Sidebar Content Container */}
      <div className="flex-1 w-full overflow-hidden">
        {children}
      </div>

      {/* Invisible Grab Handle (5px width) */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-50 hover:bg-blue-500/10 transition-colors"
        aria-hidden="true"
      />
    </div>
  );
};

export default ResizableSidebar;
