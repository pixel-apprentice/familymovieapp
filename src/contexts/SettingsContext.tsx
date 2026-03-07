import React, { createContext, useContext, useState } from 'react';

export type RecommendationMode = 'balanced' | 'familiar' | 'explore' | 'safe';
export type ContentMaxRating = 'PG' | 'PG-13' | 'R';

interface SettingsContextType {
    allowRatedR: boolean;
    setAllowRatedR: (val: boolean) => void;
    recommendationMode: RecommendationMode;
    setRecommendationMode: (mode: RecommendationMode) => void;
    contentMaxRating: ContentMaxRating;
    setContentMaxRating: (rating: ContentMaxRating) => void;
    blockMatureThemes: boolean;
    setBlockMatureThemes: (val: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [allowRatedR, setAllowRatedRState] = useState<boolean>(() => {
        return localStorage.getItem('allowRatedR') === 'true';
    });
    const [recommendationMode, setRecommendationModeState] = useState<RecommendationMode>(() =>
        (localStorage.getItem('recommendationMode') as RecommendationMode) || 'balanced'
    );
    const [contentMaxRating, setContentMaxRatingState] = useState<ContentMaxRating>(() =>
        (localStorage.getItem('contentMaxRating') as ContentMaxRating) || 'PG-13'
    );
    const [blockMatureThemes, setBlockMatureThemesState] = useState<boolean>(() =>
        localStorage.getItem('blockMatureThemes') !== 'false'
    );

    const setAllowRatedR = (val: boolean) => {
        setAllowRatedRState(val);
        localStorage.setItem('allowRatedR', val ? 'true' : 'false');
        if (val) {
            setContentMaxRatingState('R');
            localStorage.setItem('contentMaxRating', 'R');
        }
    };

    const setRecommendationMode = (mode: RecommendationMode) => {
        setRecommendationModeState(mode);
        localStorage.setItem('recommendationMode', mode);
    };

    const setContentMaxRating = (rating: ContentMaxRating) => {
        setContentMaxRatingState(rating);
        localStorage.setItem('contentMaxRating', rating);
        setAllowRatedRState(rating === 'R');
        localStorage.setItem('allowRatedR', rating === 'R' ? 'true' : 'false');
    };

    const setBlockMatureThemes = (val: boolean) => {
        setBlockMatureThemesState(val);
        localStorage.setItem('blockMatureThemes', val ? 'true' : 'false');
    };

    return (
        <SettingsContext.Provider value={{
            allowRatedR,
            setAllowRatedR,
            recommendationMode,
            setRecommendationMode,
            contentMaxRating,
            setContentMaxRating,
            blockMatureThemes,
            setBlockMatureThemes,
        }}>
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
