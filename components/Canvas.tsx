
import React, { useRef, useState, useEffect } from 'react';
import { StandObject, Boundary, OBJECT_DEFAULTS } from '../types';
import DraggableItem from './DraggableItem';
import { checkCollision, isOutOfBounds } from '../utils/collisions';

interface CanvasProps {
  boundary: Boundary;
  objects: StandObject[];
  selectedId: string | null;
  scale: number;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<StandObject>, finalUpdate?: boolean) => void;
}

const Canvas: React.FC<CanvasProps> = ({ boundary, objects, selectedId, scale, onSelect, onUpdate }) => {
  const widthPx = boundary.width * scale;
  const heightPx = boundary.length * scale;

  // 30m site buffer for comprehensive layout planning
  const paddingMeters = 30;
  const paddingPx = paddingMeters * scale;

  return (
    <div 
      id="full-site-canvas"
      className="relative bg-slate-200/50 rounded-lg shadow-inner print:p-0 print:bg-white transition-all"
      style={{ 
        width: widthPx + (paddingPx * 2), 
        height: heightPx + (paddingPx * 2),
        padding: `${paddingPx}px`
      }}
      onClick={() => onSelect(null)}
    >
      <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest print:hidden pointer-events-none">
        Extended Site Ground (30m buffer)
      </div>

      <div 
        className="relative bg-white shadow-2xl border-4 border-slate-800 rounded-sm"
        style={{ width: widthPx, height: heightPx }}
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
            backgroundSize: `${scale}px ${scale}px`
          }}
        />
        
        <div className="absolute -top-10 left-0 text-xs font-bold text-slate-400 print:text-slate-800">
          Stand Width: {boundary.width}m
        </div>
        <div className="absolute -left-10 top-0 text-xs font-bold text-slate-400 rotate-90 origin-top-left translate-x-3 print:text-slate-800">
          Stand Length: {boundary.length}m
        </div>

        {objects.map((obj) => {
          const colliding = objects.some(other => {
            if (other.id === obj.id) return false;
            const configA = OBJECT_DEFAULTS[obj.type];
            const configB = OBJECT_DEFAULTS[other.type];
            if (configA.ignoreCollision || configB.ignoreCollision) return false;
            return checkCollision(obj, other);
          });

          const outOfBounds = isOutOfBounds(obj, boundary);
          const canBeOutside = obj.type === 'Queue Barrier' || obj.type === 'Fire Extinguisher' || obj.type === 'Entry/Exit Point';

          return (
            <DraggableItem
              key={obj.id}
              object={obj}
              scale={scale}
              boundary={boundary}
              isSelected={selectedId === obj.id}
              hasError={colliding || (outOfBounds && !canBeOutside)}
              onSelect={(e) => {
                e.stopPropagation();
                onSelect(obj.id);
              }}
              onUpdate={(updates, finalUpdate) => onUpdate(obj.id, updates, finalUpdate)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Canvas;
