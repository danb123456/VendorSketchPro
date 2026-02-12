
import React from 'react';
import { StandObject } from '../types';

interface ControlsProps {
  selectedObject: StandObject | null;
  onUpdate: (id: string, updates: Partial<StandObject>, finalUpdate?: boolean) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const Controls: React.FC<ControlsProps> = ({ selectedObject, onUpdate, onRemove, onClose }) => {
  if (!selectedObject) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-6 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 min-w-[500px]">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Custom Menu</span>
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: selectedObject.color }} />
              {selectedObject.type} Edits
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-end gap-6">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Width (m)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                value={selectedObject.width}
                onChange={(e) => onUpdate(selectedObject.id, { width: parseFloat(e.target.value) || 0.1 }, true)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Length (m)</label>
              <input
                type="number"
                step="0.1"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                value={selectedObject.length}
                onChange={(e) => onUpdate(selectedObject.id, { length: parseFloat(e.target.value) || 0.1 }, true)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Rotate (°)</label>
              <input
                type="number"
                step="1"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                value={Math.round(selectedObject.rotation)}
                onChange={(e) => onUpdate(selectedObject.id, { rotation: parseFloat(e.target.value) || 0 }, true)}
              />
            </div>
          </div>
          
          <button
            onClick={() => onRemove(selectedObject.id)}
            className="px-5 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
