import React from 'react';
import { Check, X } from 'lucide-react';

interface MovieEditFormProps {
  editForm: {
    date: string;
    status: 'wishlist' | 'watched';
    pickedBy: string;
  };
  setEditForm: React.Dispatch<React.SetStateAction<{
    date: string;
    status: 'wishlist' | 'watched';
    pickedBy: string;
  }>>;
  profiles: { id: string; name: string; color: string }[];
  handleSave: () => void;
  setIsEditing: (isEditing: boolean) => void;
}

export function MovieEditForm({ editForm, setEditForm, profiles, handleSave, setIsEditing }: MovieEditFormProps) {
  return (
    <div className="flex flex-col gap-4 bg-theme-surface/80 backdrop-blur-md p-6 rounded-2xl border-2 border-theme-primary/20 w-full shadow-xl">
      <h3 className="text-sm font-black uppercase tracking-widest text-theme-primary mb-2">Edit Movie Details</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest">Date Watched</label>
          <input 
            type="date" 
            value={editForm.date} 
            onChange={e => setEditForm({...editForm, date: e.target.value})}
            className="bg-theme-base border-2 border-theme-border rounded-xl px-4 py-3 text-sm font-mono text-theme-text focus:outline-none focus:border-theme-primary transition-colors w-full"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest">Status</label>
          <select
            value={editForm.status}
            onChange={e => setEditForm({...editForm, status: e.target.value as any})}
            className="bg-theme-base border-2 border-theme-border rounded-xl px-4 py-3 text-sm font-black uppercase text-theme-text focus:outline-none focus:border-theme-primary transition-colors w-full"
          >
            <option value="wishlist">Wishlist</option>
            <option value="watched">Watched</option>
          </select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase font-black text-theme-muted tracking-widest">Picked By</label>
          <select
            value={editForm.pickedBy}
            onChange={e => setEditForm({...editForm, pickedBy: e.target.value})}
            className="bg-theme-base border-2 border-theme-border rounded-xl px-4 py-3 text-sm font-black uppercase text-theme-text focus:outline-none focus:border-theme-primary transition-colors w-full"
          >
            <option value="Family">Family</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full mt-4 pt-4 border-t border-theme-border/50">
        <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all font-black uppercase text-sm tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98]" title="Save Changes">
          <Check size={20} /> Save Changes
        </button>
        <button onClick={() => setIsEditing(false)} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-theme-base border-2 border-theme-border text-theme-text hover:bg-theme-border/50 rounded-xl transition-all font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-[0.98]" title="Cancel">
          <X size={20} /> Cancel
        </button>
      </div>
    </div>
  );
}
