import React, { useState, useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

export function Modal() {
  const { modalState, hideModal } = useModal();
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (modalState?.type === 'prompt') {
      setInputValue(modalState.defaultValue || '');
    }
  }, [modalState]);

  if (!modalState) return null;

  const handleConfirm = () => {
    if (modalState.type === 'prompt') {
      modalState.resolve(inputValue);
    } else {
      modalState.resolve(true);
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modalState.type === 'prompt') {
      modalState.resolve(null);
    } else {
      modalState.resolve(false);
    }
    hideModal();
  };

  const isConfirm = modalState.type === 'confirm';
  const isPrompt = modalState.type === 'prompt';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={(isConfirm || isPrompt) ? handleCancel : handleConfirm}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-sm bg-theme-surface border border-theme-border rounded-3xl p-6 shadow-2xl overflow-hidden ${
            theme === 'modern-pinnacle' ? 'bg-white/90 backdrop-blur-xl border-white/20' : ''
          } ${
            theme === 'modern-luminous' ? 'bg-white/90 backdrop-blur-xl border-black/5' : ''
          } ${
            theme === 'neon-cyberpunk' ? 'bg-black/90 border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.2)]' : ''
          }`}
        >
          {theme === 'neon-cyberpunk' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          )}

          <div className="flex flex-col gap-4 text-center">
            {modalState.title && (
              <h3 className={`text-xl font-black uppercase tracking-tight text-theme-text ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                {modalState.title}
              </h3>
            )}
            
            <p className="text-sm text-theme-muted font-medium leading-relaxed">
              {modalState.message}
            </p>

            {isPrompt && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={modalState.placeholder || 'Type here...'}
                className="w-full bg-theme-base border-2 border-theme-border rounded-xl px-4 py-3 text-sm font-medium text-theme-text focus:outline-none focus:border-theme-primary transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            )}

            <div className="flex gap-3 mt-4">
              {(isConfirm || isPrompt) && (
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 px-4 rounded-xl bg-theme-surface border border-theme-border text-theme-muted font-black uppercase text-[10px] tracking-widest hover:bg-theme-border/10 transition-colors"
                >
                  {modalState.cancelText || 'Cancel'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                  isConfirm 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-theme-primary text-theme-base'
                }`}
              >
                {isConfirm && <Check size={14} />}
                {modalState.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
