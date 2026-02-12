
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VendorInfo, StandObject, ObjectType, OBJECT_DEFAULTS, Boundary } from '../types';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import Controls from './Controls';
import { toPng } from 'html-to-image';

interface DesignerProps {
  vendor: VendorInfo;
  onLogout: () => void;
}

const Designer: React.FC<DesignerProps> = ({ vendor, onLogout }) => {
  const [boundary, setBoundary] = useState<Boundary>({ width: 10, length: 8 });
  const [objects, setObjects] = useState<StandObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isBoundarySet, setIsBoundarySet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [history, setHistory] = useState<StandObject[][]>([]);
  const [redoStack, setRedoStack] = useState<StandObject[][]>([]);
  const [scale, setScale] = useState(40);

  const saveToHistory = useCallback((currentObjects: StandObject[]) => {
    setHistory(prev => [...prev, currentObjects]);
    setRedoStack([]);
  }, []);

  const addObject = useCallback((type: ObjectType) => {
    saveToHistory(objects);
    const defaults = OBJECT_DEFAULTS[type];
    const newObj: StandObject = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: boundary.width / 2 - defaults.width / 2,
      y: type === 'Queue Barrier' ? boundary.length + 1 : boundary.length / 2 - defaults.length / 2,
      width: defaults.width,
      length: defaults.length,
      rotation: 0,
      color: defaults.color,
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
  }, [boundary, objects, saveToHistory]);

  const updateObject = (id: string, updates: Partial<StandObject>, finalUpdate = false) => {
    if (finalUpdate) {
      saveToHistory(objects);
    }
    setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  };

  const removeObject = (id: string) => {
    saveToHistory(objects);
    setObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const undo = useCallback(() => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      const newHistory = history.slice(0, history.length - 1);
      setRedoStack(prev => [objects, ...prev]);
      setObjects(previous);
      setHistory(newHistory);
    }
  }, [history, objects]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      const next = redoStack[0];
      const newRedoStack = redoStack.slice(1);
      setHistory(prev => [...prev, objects]);
      setObjects(next);
      setRedoStack(newRedoStack);
    }
  }, [redoStack, objects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
          removeObject(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId]);

  const resetDesigner = () => {
    if (confirm("Clear your entire sketch?")) {
      saveToHistory(objects);
      setObjects([]);
      setSelectedId(null);
    }
  };

  const exportDesign = async () => {
    const node = document.getElementById('full-site-canvas');
    if (!node) return;

    setIsExporting(true);
    setSelectedId(null); // Clear selection for clean export

    setTimeout(async () => {
      try {
        const dataUrl = await toPng(node, {
          quality: 1,
          pixelRatio: 3, 
          backgroundColor: '#f1f5f9',
          style: {
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        });

        const safeTraderName = vendor.traderName.replace(/[^a-z0-9]/gi, '-');
        const safeVendorId = vendor.vendorId.replace(/[^a-z0-9]/gi, '-');
        const link = document.createElement('a');
        link.download = `StandPlan-${safeTraderName}-${safeVendorId}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed:', err);
        alert('Export failed. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  if (!isBoundarySet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Set Your Stand Dimensions</h2>
          <p className="text-slate-500 mb-8">Enter the outer boundaries of your pitch in meters.</p>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Width (m)</label>
              <input
                type="number"
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={boundary.width}
                onChange={(e) => setBoundary({ ...boundary, width: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Length (m)</label>
              <input
                type="number"
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                value={boundary.length}
                onChange={(e) => setBoundary({ ...boundary, length: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <button
            onClick={() => setIsBoundarySet(true)}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg"
          >
            Open Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 print:h-auto print:overflow-visible">
      <Sidebar onAddObject={addObject} />
      
      <main className="flex-1 flex flex-col min-w-0 relative print:bg-white print:p-0">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-30 print:hidden">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-800 truncate max-w-xs">{vendor.traderName}</h1>
            <span className="text-slate-400">|</span>
            <span className="text-sm text-slate-500 font-mono">{vendor.vendorId}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={undo}
              disabled={history.length === 0}
              className={`p-2 rounded-lg transition ${history.length === 0 ? 'text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'}`}
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </button>
            <button 
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`p-2 rounded-lg transition ${redoStack.length === 0 ? 'text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-600'}`}
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2m18-8l-6 6m6-6l-6-6" /></svg>
            </button>
            <span className="text-slate-200 mx-2">|</span>
            <button 
              onClick={exportDesign}
              disabled={isExporting}
              className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition flex items-center shadow-sm ${isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900'}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isExporting ? 'Exporting...' : 'Export (PNG)'}
            </button>
            <span className="text-slate-200 mx-2">|</span>
             <button 
              onClick={resetDesigner}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 transition"
            >
              Clear
            </button>
            <button 
              onClick={onLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-auto p-12 flex justify-center items-center canvas-container print:p-0 print:overflow-visible">
          <Canvas 
            boundary={boundary} 
            objects={objects} 
            selectedId={selectedId}
            scale={scale}
            onSelect={setSelectedId}
            onUpdate={updateObject}
          />
        </div>
        
        <Controls 
          selectedObject={objects.find(o => o.id === selectedId) || null}
          onUpdate={updateObject}
          onRemove={removeObject}
          onClose={() => setSelectedId(null)}
        />
      </main>
    </div>
  );
};

export default Designer;
