import React from 'react';
import { FamilyProfile } from '../../contexts/DataContext';
import { LayoutGrid, List } from 'lucide-react';

interface FilterBarProps {
  profiles: FamilyProfile[];
  pickerFilter: string;
  togglePicker: (id: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export function FilterBar({
  profiles,
  pickerFilter,
  togglePicker,
  viewMode,
  setViewMode
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 bg-theme-surface/60 backdrop-blur-xl border border-theme-border p-1 md:p-1.5 rounded-2xl sticky top-2 z-40 shadow-xl mx-auto w-full max-w-4xl">
      {/* Scrollable Filters */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
        <button
          onClick={() => togglePicker('all')}
          className={`flex items-center justify-center transition-all whitespace-nowrap h-9 px-3 md:h-10 md:px-4 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${
            pickerFilter === 'all'
              ? 'bg-theme-primary text-theme-base shadow-lg scale-105'
              : 'bg-theme-base text-theme-muted hover:text-theme-text border border-theme-border'
          }`}
        >
          All
        </button>

        <div className="w-[1px] h-6 bg-theme-border mx-1 shrink-0" />

        {profiles.map(p => (
          <button
            key={p.id}
            onClick={() => togglePicker(p.id)}
            className={`relative flex items-center justify-center transition-all shrink-0 border h-9 w-9 md:h-10 md:w-auto md:px-5 rounded-full md:rounded-xl ${
              pickerFilter === p.id
                ? 'scale-110 shadow-lg z-10'
                : 'bg-theme-base text-theme-muted hover:text-theme-text border-theme-border'
            }`}
            style={pickerFilter === p.id ? { backgroundColor: p.color, borderColor: p.color, color: '#fff' } : {}}
            title={p.name}
          >
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">{p.name}</span>
            <span className="md:hidden text-xs font-black uppercase">{p.name.charAt(0)}</span>
            {pickerFilter === p.id && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full md:hidden" />
            )}
          </button>
        ))}
      </div>

      {/* Fixed Controls */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-theme-border/50">
        <div className="flex items-center gap-1 bg-theme-base p-1 rounded-xl border border-theme-border h-full">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-theme-primary text-theme-base shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
            aria-label="Grid View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-theme-primary text-theme-base shadow-md' : 'text-theme-muted hover:text-theme-text'}`}
            aria-label="List View"
          >
            <List size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
