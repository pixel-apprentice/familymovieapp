import React from 'react';
import { motion } from 'motion/react';
import { Mail } from 'lucide-react';

interface AddMovieActionsProps {
  isSendingPlex: boolean;
  isSubmitting: boolean;
  handlePlexRequest: () => void;
}

export function AddMovieActions({ isSendingPlex, isSubmitting, handlePlexRequest }: AddMovieActionsProps) {
  return (
    <div className="p-6 border-t border-theme-border bg-theme-base/50 shrink-0 space-y-3">
      <motion.button 
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={handlePlexRequest}
        disabled={isSendingPlex}
        className="w-full min-h-[44px] py-3 bg-indigo-600/10 text-indigo-500 border-2 border-indigo-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Mail size={14} />
        {isSendingPlex ? 'Sending...' : 'Ask Dad to add to Plex'}
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.95 }}
        type="submit"
        form="add-movie-form"
        disabled={isSubmitting}
        className="w-full min-h-[44px] py-4 bg-theme-primary text-theme-base font-black rounded-xl uppercase text-xs tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
      >
        {isSubmitting ? 'Adding...' : 'Add Movie'}
      </motion.button>
    </div>
  );
}
