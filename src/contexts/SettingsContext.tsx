import React, { createContext, useContext } from 'react';
import { CACHE_KEYS } from '../constants/settings';
import { usePersistence } from '../hooks/usePersistence';

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
    const [allowRatedR, setAllowRatedRState] = usePersistence<boolean>(
        CACHE_KEYS.ALLOW_RATED_R,
        false
    );
    const [recommendationMode, setRecommendationMode] = usePersistence<RecommendationMode>(
        CACHE_KEYS.RECOMMENDATION_MODE,
        'balanced'
    );
    const [contentMaxRating, setContentMaxRatingState] = usePersistence<ContentMaxRating>(
        CACHE_KEYS.CONTENT_MAX_RATING,
        'PG-13'
    );
    const [blockMatureThemes, setBlockMatureThemes] = usePersistence<boolean>(
        CACHE_KEYS.BLOCK_MATURE_THEMES,
        true
    );

    const setAllowRatedR = (val: boolean) => {
        setAllowRatedRState(val);
        if (val) {
            setContentMaxRatingState('R');
        } else if (contentMaxRating === 'R') {
            setContentMaxRatingState('PG-13');
        }
    };

    const setContentMaxRating = (rating: ContentMaxRating) => {
        setContentMaxRatingState(rating);
        setAllowRatedRState(rating === 'R');
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
