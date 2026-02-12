
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StandObject, Boundary, OBJECT_DEFAULTS } from '../types';

interface DraggableItemProps {
  object: StandObject;
  scale: number;
  boundary: Boundary;
  isSelected: boolean;
  hasError: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<StandObject>, finalUpdate?: boolean) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ object, scale, isSelected, hasError, onSelect, onUpdate }) => {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(e as any);
    setDragging(true);
    setStartPos({ x: e.clientX - object.x * scale, y: e.clientY - object.y * scale });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging) {
      const newX = (e.clientX - startPos.x) / scale;
      const newY = (e.clientY - startPos.y) / scale;
      onUpdate({ x: newX, y: newY });
    } else if (resizing) {
      const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
      const newWidth = (e.clientX - (object.x * scale + rect.left)) / scale;
      const newLength = (e.clientY - (object.y * scale + rect.top)) / scale;
      onUpdate({ 
        width: Math.max(0.1, newWidth), 
        length: Math.max(0.1, newLength) 
      });
    } else if (rotating) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      onUpdate({ rotation: (angle + 90) % 360 });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging || resizing || rotating) {
      onUpdate({}, true); // Trigger history save
    }
    setDragging(false);
    setResizing(false);
    setRotating(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setResizing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleRotateStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setRotating(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Helper to determine text color based on object fill
  const getTextColorClass = () => {
    const blackFills = [
      'rgba(31, 41, 55, 1)', // Smoker color
      'rgba(30, 41, 59, 1)', // Manager color
    ];
    
    if (blackFills.includes(object.color)) {
      return 'text-slate-300'; // Light grey for black fills
    }
    return 'text-black'; // Default to black for all others
  };

  return (
    <div
      ref={containerRef}
      className={`absolute transition-shadow touch-none flex items-center justify-center text-center select-none shadow-sm ${isSelected ? 'z-50 ring-2 ring-emerald-500' : 'z-10'}`}
      style={{
        left: `${object.x * scale}px`,
        top: `${object.y * scale}px`,
        width: `${object.width * scale}px`,
        height: `${object.length * scale}px`,
        backgroundColor: object.color,
        border: hasError ? '2px solid #ef4444' : 'none',
        opacity: OBJECT_DEFAULTS[object.type].transparent ? 0.4 : 1,
        transform: `rotate(${object.rotation}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
    >
      <span className={`text-[9px] font-bold p-1 leading-tight break-words pointer-events-none ${getTextColorClass()}`}>
        {object.type === 'Fire Extinguisher' ? 'EXT' : object.type === 'Entry/Exit Point' ? 'IN/OUT' : object.type}
      </span>

      {hasError && !OBJECT_DEFAULTS[object.type].ignoreCollision && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg animate-bounce pointer-events-none">
          !
        </div>
      )}

      {isSelected && (
        <>
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-emerald-500 rounded-full cursor-alias flex items-center justify-center shadow-lg"
            onPointerDown={handleRotateStart}
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 cursor-nwse-resize rounded-tl-sm flex items-center justify-center"
            onPointerDown={handleResizeStart}
          >
            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-white" />
          </div>
          
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-emerald-600 font-bold bg-white/80 px-1 rounded shadow-sm border border-emerald-100">
            {object.width.toFixed(1)}m × {object.length.toFixed(1)}m @ {Math.round(object.rotation)}°
          </div>
        </>
      )}
    </div>
  );
};

export default DraggableItem;
