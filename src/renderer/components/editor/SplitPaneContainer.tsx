import { useCallback, useRef, useState, useEffect, ReactNode } from 'react';
import { SplitDirection } from '../../store/editorStore';

interface SplitPaneContainerProps {
  direction: SplitDirection;
  sizes: number[];
  onResize: (sizes: number[]) => void;
  children: ReactNode[];
  minSize?: number;
}

export function SplitPaneContainer({
  direction,
  sizes,
  onResize,
  children,
  minSize = 20,
}: SplitPaneContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let ratio: number;

    if (direction === 'horizontal') {
      ratio = ((e.clientX - rect.left) / rect.width) * 100;
    } else {
      ratio = ((e.clientY - rect.top) / rect.height) * 100;
    }

    // Clamp to min/max
    ratio = Math.max(minSize, Math.min(100 - minSize, ratio));

    onResize([ratio, 100 - ratio]);
  }, [isDragging, direction, minSize, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  // Single pane - no split
  if (!direction || children.length < 2) {
    return <div className="flex-1 flex flex-col overflow-hidden">{children[0]}</div>;
  }

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex-1 flex ${isHorizontal ? 'flex-row' : 'flex-col'} overflow-hidden`}
    >
      {/* First pane */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ [isHorizontal ? 'width' : 'height']: `${sizes[0]}%` }}
      >
        {children[0]}
      </div>

      {/* Resizer */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          flex-shrink-0 bg-gray-200 dark:bg-gray-700
          hover:bg-blue-400 dark:hover:bg-blue-600
          transition-colors
          ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
          ${isDragging ? 'bg-blue-500 dark:bg-blue-500' : ''}
        `}
      />

      {/* Second pane */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ [isHorizontal ? 'width' : 'height']: `${sizes[1]}%` }}
      >
        {children[1]}
      </div>
    </div>
  );
}
