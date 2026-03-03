import React from 'react';
import { hapticFeedback } from '../../utils/haptics';

interface Profile {
  id: string;
  name: string;
  color: string;
}

interface AddMoviePickerSelectorProps {
  profiles: Profile[];
  picker: string;
  setPicker: (picker: string) => void;
  isFamilyPick: boolean;
  setIsFamilyPick: (isFamilyPick: boolean) => void;
}

export function AddMoviePickerSelector({ profiles, picker, setPicker, isFamilyPick, setIsFamilyPick }: AddMoviePickerSelectorProps) {
  return (
    <div className="space-y-3 px-6">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-theme-muted">Who picked it?</label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={isFamilyPick}
            onChange={e => { hapticFeedback.light(); setIsFamilyPick(e.target.checked); }}
            className="hidden"
          />
          <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${isFamilyPick ? 'bg-theme-primary border-theme-primary' : 'border-theme-border group-hover:border-theme-primary/50'}`}>
            {isFamilyPick && <div className="w-1.5 h-1.5 bg-theme-base rounded-full" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted group-hover:text-theme-primary transition-colors">Family Pick</span>
        </label>
      </div>
      <div className={`grid grid-cols-2 gap-2 transition-opacity ${isFamilyPick ? 'opacity-30 pointer-events-none' : ''}`}>
        {profiles.map(profile => (
          <button
            key={profile.id}
            type="button"
            onClick={() => { hapticFeedback.light(); setPicker(profile.id); }}
            className={`min-h-[44px] py-2 px-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2 flex items-center justify-center gap-2 ${
              picker === profile.id 
                ? 'border-transparent text-white' 
                : 'bg-theme-base text-theme-text border-theme-border hover:border-theme-primary/50'
            }`}
            style={picker === profile.id ? { backgroundColor: profile.color } : {}}
          >
            {picker === profile.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            {profile.name}
          </button>
        ))}
      </div>
    </div>
  );
}
