import React from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ShieldCheck, Database, Wifi, WifiOff, User } from 'lucide-react';

export function DataStatusPanel() {
    const { syncStatus, isLocalMode, movies } = useData();
    const { user } = useAuth();
    const { theme } = useTheme();

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className={`text-xl md:text-2xl font-black uppercase tracking-widest text-theme-primary ${theme === 'vintage-ticket' ? 'font-serif italic' : ''}`}>
                    System Health
                </h2>
                <div className="h-px flex-1 bg-theme-border/30" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sync Status Tile */}
                <div className="bg-theme-surface/50 border border-theme-border rounded-3xl p-5 flex items-center gap-4 shadow-lg">
                    <div className={`p-3 rounded-2xl ${syncStatus === 'synced' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
                        {syncStatus === 'synced' ? <Wifi size={24} /> : <WifiOff size={24} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Sync State</p>
                        <p className={`text-sm font-black uppercase ${syncStatus === 'synced' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {syncStatus}
                        </p>
                    </div>
                </div>

                {/* Storage Mode Tile */}
                <div className="bg-theme-surface/50 border border-theme-border rounded-3xl p-5 flex items-center gap-4 shadow-lg">
                    <div className={`p-3 rounded-2xl ${isLocalMode ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        <Database size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Storage</p>
                        <p className={`text-sm font-black uppercase ${isLocalMode ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {isLocalMode ? 'Local Mode' : 'Cloud Syncing'}
                        </p>
                    </div>
                </div>

                {/* Auth Mode Tile */}
                <div className="bg-theme-surface/50 border border-theme-border rounded-3xl p-5 flex items-center gap-4 shadow-lg">
                    <div className={`p-3 rounded-2xl ${user ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Connectivity</p>
                        <p className={`text-sm font-black uppercase ${user ? 'text-emerald-500' : 'text-red-500'}`}>
                            {user ? 'Linked' : 'Standalone'}
                        </p>
                    </div>
                </div>

                {/* Record Count Tile */}
                <div className="bg-theme-surface/50 border border-theme-border rounded-3xl p-5 flex items-center gap-4 shadow-lg">
                    <div className="p-3 rounded-2xl bg-theme-primary/20 text-theme-primary">
                        <User size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">Active Library</p>
                        <p className="text-sm font-black uppercase text-theme-primary">
                            {movies.length} Movies
                        </p>
                    </div>
                </div>
            </div>

            {user && (
                <div className="p-4 bg-theme-base/50 rounded-2xl border border-theme-border flex items-center justify-between text-[10px] font-mono whitespace-nowrap overflow-hidden">
                    <span className="text-theme-muted uppercase tracking-widest shrink-0">Session ID:</span>
                    <span className="text-theme-primary truncate ml-4 select-all">{user.uid}</span>
                </div>
            )}
        </section>
    );
}
