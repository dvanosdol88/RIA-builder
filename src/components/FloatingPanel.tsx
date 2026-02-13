import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FloatingPanelProps {
  children: React.ReactNode;
  isDocked: boolean;
  dockedClassName: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  zIndex?: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const HANDLE_SIZE = 5;
const CORNER_SIZE = 10;
const MIN_VISIBLE = 100; // Keep at least 100px visible on screen

const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  isDocked,
  dockedClassName,
  defaultPosition,
  defaultSize,
  minWidth = 320,
  minHeight = 400,
  maxWidth = 800,
  zIndex = 50,
}) => {
  // Position and size state for floating mode
  const [pos, setPos] = useState({
    x: defaultPosition?.x ?? 200,
    y: defaultPosition?.y ?? 16,
  });
  const [size, setSize] = useState({
    width: defaultSize?.width ?? 384,
    height: defaultSize?.height ?? 700,
  });

  // Interaction tracking refs (avoid stale closures in window listeners)
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeDir = useRef<ResizeDirection>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  const startMouse = useRef({ x: 0, y: 0 });

  // Clamp position so the panel stays visible
  const clampPosition = useCallback(
    (x: number, y: number, w: number, h: number) => ({
      x: Math.max(-w + MIN_VISIBLE, Math.min(x, window.innerWidth - MIN_VISIBLE)),
      y: Math.max(0, Math.min(y, window.innerHeight - MIN_VISIBLE)),
    }),
    []
  );

  // --- DRAG LOGIC ---
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only drag from the drag handle, not from buttons inside it
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      if (!target.closest('[data-drag-handle]')) return;

      e.preventDefault();
      isDragging.current = true;
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    },
    [pos.x, pos.y]
  );

  // --- RESIZE LOGIC ---
  const handleResizeStart = useCallback(
    (dir: ResizeDirection) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      resizeDir.current = dir;
      startPos.current = { x: pos.x, y: pos.y };
      startSize.current = { width: size.width, height: size.height };
      startMouse.current = { x: e.clientX, y: e.clientY };
      document.body.style.userSelect = 'none';
    },
    [pos.x, pos.y, size.width, size.height]
  );

  // Window-level mousemove/mouseup
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        const clamped = clampPosition(newX, newY, size.width, size.height);
        setPos(clamped);
        return;
      }

      if (isResizing.current && resizeDir.current) {
        const dx = e.clientX - startMouse.current.x;
        const dy = e.clientY - startMouse.current.y;
        const dir = resizeDir.current;

        let newW = startSize.current.width;
        let newH = startSize.current.height;
        let newX = startPos.current.x;
        let newY = startPos.current.y;

        // Horizontal resize
        if (dir.includes('e')) {
          newW = Math.max(minWidth, Math.min(maxWidth, startSize.current.width + dx));
        }
        if (dir.includes('w')) {
          const proposedW = startSize.current.width - dx;
          newW = Math.max(minWidth, Math.min(maxWidth, proposedW));
          // Adjust X so the right edge stays anchored
          newX = startPos.current.x + (startSize.current.width - newW);
        }

        // Vertical resize
        if (dir.includes('s')) {
          newH = Math.max(minHeight, startSize.current.height + dy);
        }
        if (dir.includes('n')) {
          const proposedH = startSize.current.height - dy;
          newH = Math.max(minHeight, proposedH);
          // Adjust Y so the bottom edge stays anchored
          newY = startPos.current.y + (startSize.current.height - newH);
        }

        setSize({ width: newW, height: newH });
        setPos(clampPosition(newX, newY, newW, newH));
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current || isResizing.current) {
        isDragging.current = false;
        isResizing.current = false;
        resizeDir.current = null;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clampPosition, minWidth, minHeight, maxWidth, size.width, size.height]);

  // --- DOCKED MODE ---
  if (isDocked) {
    return <div className={dockedClassName}>{children}</div>;
  }

  // --- FLOATING MODE ---
  const cursorMap: Record<string, string> = {
    n: 'cursor-n-resize',
    s: 'cursor-s-resize',
    e: 'cursor-e-resize',
    w: 'cursor-w-resize',
    ne: 'cursor-ne-resize',
    nw: 'cursor-nw-resize',
    se: 'cursor-se-resize',
    sw: 'cursor-sw-resize',
  };

  return (
    <div
      onMouseDown={handleDragStart}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      className="rounded-lg shadow-2xl border border-gray-200 bg-white overflow-hidden"
    >
      {/* Panel content */}
      <div className="w-full h-full overflow-hidden">{children}</div>

      {/* Resize handles — edges */}
      {/* Top edge */}
      <div
        onMouseDown={handleResizeStart('n')}
        className={`absolute top-0 left-[${CORNER_SIZE}px] right-[${CORNER_SIZE}px] h-[${HANDLE_SIZE}px] ${cursorMap.n}`}
        style={{ top: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: HANDLE_SIZE }}
      />
      {/* Bottom edge */}
      <div
        onMouseDown={handleResizeStart('s')}
        className={cursorMap.s}
        style={{ position: 'absolute', bottom: 0, left: CORNER_SIZE, right: CORNER_SIZE, height: HANDLE_SIZE }}
      />
      {/* Left edge */}
      <div
        onMouseDown={handleResizeStart('w')}
        className={cursorMap.w}
        style={{ position: 'absolute', top: CORNER_SIZE, bottom: CORNER_SIZE, left: 0, width: HANDLE_SIZE }}
      />
      {/* Right edge */}
      <div
        onMouseDown={handleResizeStart('e')}
        className={cursorMap.e}
        style={{ position: 'absolute', top: CORNER_SIZE, bottom: CORNER_SIZE, right: 0, width: HANDLE_SIZE }}
      />

      {/* Resize handles — corners */}
      {/* Top-left */}
      <div
        onMouseDown={handleResizeStart('nw')}
        className={cursorMap.nw}
        style={{ position: 'absolute', top: 0, left: 0, width: CORNER_SIZE, height: CORNER_SIZE }}
      />
      {/* Top-right */}
      <div
        onMouseDown={handleResizeStart('ne')}
        className={cursorMap.ne}
        style={{ position: 'absolute', top: 0, right: 0, width: CORNER_SIZE, height: CORNER_SIZE }}
      />
      {/* Bottom-left */}
      <div
        onMouseDown={handleResizeStart('sw')}
        className={cursorMap.sw}
        style={{ position: 'absolute', bottom: 0, left: 0, width: CORNER_SIZE, height: CORNER_SIZE }}
      />
      {/* Bottom-right */}
      <div
        onMouseDown={handleResizeStart('se')}
        className={cursorMap.se}
        style={{ position: 'absolute', bottom: 0, right: 0, width: CORNER_SIZE, height: CORNER_SIZE }}
      />
    </div>
  );
};

export default FloatingPanel;
