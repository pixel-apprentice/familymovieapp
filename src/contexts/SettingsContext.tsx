import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    allowRatedR: boolean;
    setAllowRatedR: (val: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [allowRatedR, setAllowRatedRState] = useState<boolean>(() => {
        return localStorage.getItem('allowRatedR') === 'true';
    });

    const setAllowRatedR = (val: boolean) => {
        setAllowRatedRState(val);
        localStorage.setItem('allowRatedR', val ? 'true' : 'false');
    };

    return (
        <SettingsContext.Provider value={{ allowRatedR, setAllowRatedR }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
