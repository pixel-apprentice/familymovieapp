import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useModal } from '../../contexts/ModalContext';

export function DatabaseManagementPanel() {
  const { isLocalMode, resetDatabase } = useData();
  const { showModal } = useModal();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    const confirmed = await showModal({
      type: 'confirm',
      title: 'Reset Database',
      message: 'Are you sure you want to reset the database? This will clear all movies and re-seed from the master list.',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      setIsResetting(true);
      await resetDatabase();
      setIsResetting(false);
    }
  };

  return (
    <section className="mt-12 pt-12 border-t border-theme-border/20">
      <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-lg font-black uppercase tracking-widest text-red-500">Danger Zone</h3>
          <p className="text-xs text-theme-muted font-mono uppercase tracking-widest">Reset the database to the master seed list</p>
        </div>
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <button 
            onClick={handleReset}
            disabled={isResetting}
            className="px-8 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all uppercase text-xs tracking-widest shadow-lg disabled:opacity-50"
          >
            {isResetting ? 'Resetting...' : 'Reset Database'}
          </button>
          {isLocalMode && localStorage.getItem('forceLocal') === 'true' ? (
            <button 
              onClick={() => {
                localStorage.removeItem('forceLocal');
                window.location.reload();
              }}
              className="px-8 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black rounded-xl hover:bg-emerald-500/20 transition-all uppercase text-[10px] tracking-widest"
            >
              Try Firebase Again
            </button>
          ) : !isLocalMode && (
            <button 
              onClick={async () => {
                const confirmed = await showModal({
                  type: 'confirm',
                  title: 'Switch to Local Mode',
                  message: "Switch to Local Mode? This will ignore Firebase and use your browser's storage instead.",
                  confirmText: 'Switch',
                  cancelText: 'Cancel'
                });
                if (confirmed) {
                  localStorage.setItem('forceLocal', 'true');
                  window.location.reload();
                }
              }}
              className="px-8 py-2 bg-theme-surface border border-theme-border text-theme-muted font-black rounded-xl hover:text-theme-primary transition-all uppercase text-[10px] tracking-widest"
            >
              Force Local Mode
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
