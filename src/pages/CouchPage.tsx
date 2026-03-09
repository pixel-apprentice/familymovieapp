import { useEffect } from 'react';

export function CouchPage() {
    useEffect(() => {
        // Set a flag in session storage so we know this device is a TV (Receiver)
        sessionStorage.setItem('fmn_couch_mode', 'true');
        // Redirect to home with a couch flag in the URL for immediate sync detection
        window.location.href = '/?couch=true';
    }, []);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-theme-primary font-black uppercase tracking-widest text-sm animate-pulse">
                    Initializing Couch Mode...
                </p>
            </div>
        </div>
    );
}
