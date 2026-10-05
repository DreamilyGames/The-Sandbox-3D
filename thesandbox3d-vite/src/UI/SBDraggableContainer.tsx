import { useState, useCallback, useEffect, useRef } from 'react';

interface SBDraggableOutlinerProps {
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function SBDraggableOutliner({
  children,
  initialWidth = 320, // 80 in Tailwind (w-80 = 320px)
  minWidth = 220,
  maxWidth = 600,
}: SBDraggableOutlinerProps) {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Mouse move handler during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width relative to viewport screen position
      let newWidth = e.clientX;

      // Apply min and max bounds
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;

      setSidebarWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth]
  );

  // Mouse release handler
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Global event listeners attached during dragging
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      // Prevent pointer interaction/hover artifacts on 3D canvas while resizing
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${sidebarWidth}px` }}
      className="relative h-full
      border-r border-slate-800 select-none pl-3 text-left text-slate-200 flex flex-col z-10"
    >
      {/* Outliner Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>

      {/* 
        Draggable Resize Handle:
        - Absolute positioned on the right border
        - w-2 (8px width) gives a comfortable hit area for mouse interaction
        - Hover highlight effect
      */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className={`absolute top-0 right-0 w-2 h-full cursor-col-resize z-20 group 
          translate-x-1/2 flex items-center justify-center transition-colors ${
          isResizing ? 'bg-sky-500/50' : 'hover:bg-sky-500/30'
        }`}
      >
        {/* Visible Divider Line Indicator */}
        <div
          className={`w-0.5 h-full transition-colors ${
            isResizing ? 'bg-[var(--color-default-white)]' 
            : 'bg-transparent group-hover:bg-sky-400/80'
          }`}
        />
      </div>
    </aside>
  );
}