import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="bg-charcoal-900 border border-amber-500/30 rounded-xl p-3 mx-4 mt-3 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Install Farhaan Saloon PWA</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-normal">Fast & Offline</span>
            </h4>
            <p className="text-xs text-slate-400">
              Add to your home screen for 1-tap queue check & real-time notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded text-slate-500 hover:text-slate-300"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Instructions Modal for Android / iOS */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-amber-400" />
              <span>Install on your Phone</span>
            </h3>

            <p className="text-xs text-slate-300 mb-4">
              To install this Progressive Web App without app store downloads:
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-charcoal-950 border border-charcoal-800">
                <strong className="text-amber-400 block mb-1">Android (Chrome / Edge / Brave):</strong>
                1. Tap the three dots (<strong>⋮</strong>) in the top-right corner.
                <br />
                2. Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.
              </div>

              <div className="p-3 rounded-lg bg-charcoal-950 border border-charcoal-800">
                <strong className="text-amber-400 block mb-1">iPhone / iPad (Safari):</strong>
                1. Tap the <strong>Share</strong> button (box with upward arrow).
                <br />
                2. Scroll down and tap <strong>"Add to Home Screen"</strong>.
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-medium text-xs border border-charcoal-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
