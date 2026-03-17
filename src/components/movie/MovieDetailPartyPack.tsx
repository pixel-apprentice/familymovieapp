import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cookie, MessageSquare, Gamepad2 } from 'lucide-react';

interface MovieDetailPartyPackProps {
  pack: { snack: string; activity: string; prompt: string } | null;
  isVisible: boolean;
  onClose: () => void;
}

export function MovieDetailPartyPack({ pack, isVisible, onClose }: MovieDetailPartyPackProps) {
  return (
    <AnimatePresence>
      {isVisible && pack && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-theme-primary/10 border border-theme-primary/20 rounded-3xl p-6 mt-4 space-y-6 relative group">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-theme-primary/40 hover:text-theme-primary transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              Close
            </button>
            
            <div className="flex items-center gap-3 text-theme-primary mb-2">
              <Sparkles size={18} className="animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Movie Night Party Pack</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-theme-primary/60">
                  <Cookie size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">The Snack</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{pack.snack}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-theme-primary/60">
                  <Gamepad2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">The Activity</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{pack.activity}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-theme-primary/60">
                  <MessageSquare size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Family Chat</span>
                </div>
                <p className="text-sm font-italic font-medium leading-relaxed opacity-80 italic">"{pack.prompt}"</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
