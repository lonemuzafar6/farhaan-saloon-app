import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useSaloon } from '../context/SaloonContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useSaloon();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600/90 text-charcoal-950 font-medium px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between shadow-lg sticky top-0 z-40 backdrop-blur">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-bounce" />
        <span>
          <strong>Offline Mode:</strong> Showing cached queue information. Live updates and token creation require internet connectivity.
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 bg-charcoal-950 text-amber-400 px-2.5 py-1 rounded-md text-xs font-bold hover:bg-charcoal-900 transition-colors ml-2 flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </div>
  );
};
