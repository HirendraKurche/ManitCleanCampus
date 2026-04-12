// components/InstallPrompt.jsx
// Shows an "Install App" banner when the browser fires the beforeinstallprompt event.
// On iOS (which doesn't support beforeinstallprompt), shows manual Safari instructions instead.
// Dismissed state is remembered in localStorage so it doesn't nag repeatedly.

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Don't show if already installed (running in standalone mode)
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        // Don't show if user already dismissed
        if (localStorage.getItem('pwa-install-dismissed')) return;

        // Check iOS
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        if (ios) {
            // iOS: show after a short delay
            setTimeout(() => setShow(true), 3000);
            return;
        }

        // Android / Desktop Chrome: listen for install event
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
            localStorage.setItem('pwa-install-dismissed', '1');
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('pwa-install-dismissed', '1');
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-3 right-3 md:bottom-6 md:left-auto md:right-6 md:w-80 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        FM
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">Install CleanCampus App</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Add to your home screen for quick access — works offline too!
                        </p>
                    </div>
                    <button onClick={handleDismiss} className="text-slate-500 hover:text-slate-300 shrink-0 p-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {isIOS ? (
                    <>
                        <button
                            onClick={() => setShowIOSGuide(!showIOSGuide)}
                            className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            📱 How to Install on iPhone / iPad
                        </button>
                        {showIOSGuide && (
                            <div className="mt-3 space-y-2 text-xs text-slate-300 bg-slate-800/60 rounded-xl p-3">
                                <p className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                                    Tap the <strong>Share</strong> button (box with arrow) in Safari's toolbar
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                                    Scroll down and tap <strong>"Add to Home Screen"</strong>
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                                    Tap <strong>"Add"</strong> — done! Open from your home screen
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        onClick={handleInstall}
                        className="mt-3 w-full py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
                    >
                        ⬇ Install App
                    </button>
                )}
            </div>
        </div>
    );
}
