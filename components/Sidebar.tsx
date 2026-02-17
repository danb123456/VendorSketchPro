
import React from 'react';
import { ObjectType, OBJECT_DEFAULTS } from '../types';

interface SidebarProps {
  onAddObject: (type: ObjectType) => void;
}

const CATEGORIES = {
  'Stall Points': ['Service Point', 'Collection Point', 'Entry/Exit Point'],
  Infrastructure: ['Pagoda', 'Tent', 'Van/Truck', 'Queue Barrier'],
  Safety: ['Fire Extinguisher'],
  Equipment: ['Smoker', 'Hot Hold', 'Oven', 'Fridge', 'Freezer', 'Baine Marie', 'Asado', 'Fryer', 'Prep Table'],
  Other: ['Other (Hot)', 'Other (aesthetic)', 'Other (cold)', 'Other (misc)', 'Bench Set', 'Flag'],
  Staff: ['Pitmaster', 'Chef', 'Manager', 'Server']
};

const Sidebar: React.FC<SidebarProps> = ({ onAddObject }) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-20 print:hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(CATEGORIES).map(([cat, items]) => (
          <div key={cat}>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{cat}</h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <button
                  key={item}
                  onClick={() => onAddObject(item as ObjectType)}
                  className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all group text-center"
                >
                  <div 
                    className="w-10 h-10 rounded-lg mb-2 shadow-sm transition group-hover:scale-110 flex items-center justify-center overflow-hidden" 
                    style={{ backgroundColor: OBJECT_DEFAULTS[item as ObjectType].color }}
                  >
                    {item === 'Fire Extinguisher' && <span className="text-white font-bold text-[10px]">EXT</span>}
                    {item === 'Entry/Exit Point' && <span className="text-white font-bold text-[10px]">IN/OUT</span>}
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 group-hover:text-emerald-700 leading-tight">
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
