import React from 'react';
import { Users, Clock, Sparkles, Calendar, Ticket } from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';

interface CustomerBottomNavProps {
  activeTab: 'queue' | 'barbers' | 'styles' | 'booking';
  setActiveTab: (tab: 'queue' | 'barbers' | 'styles' | 'booking') => void;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { settings, activeCustomerQueueEntry } = useSaloon();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-charcoal-900/95 backdrop-blur-md border-t border-charcoal-800 pb-safe shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {/* Live Queue */}
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'queue'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Ticket className="w-5 h-5 mb-0.5" />
            {activeCustomerQueueEntry && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-charcoal-950 font-bold text-[9px] animate-pulse">
                {activeCustomerQueueEntry.token_number}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Live Queue</span>
        </button>

        {/* Our Barbers */}
        <button
          onClick={() => setActiveTab('barbers')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'barbers'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Our Barbers</span>
        </button>

        {/* Trending Styles */}
        <button
          onClick={() => setActiveTab('styles')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'styles'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Styles</span>
        </button>

        {/* Book Online */}
        <button
          onClick={() => setActiveTab('booking')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'booking'
              ? 'text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">
            Book
            {!settings.online_booking_enabled && (
              <span className="block text-[8px] text-slate-500 leading-none">Off</span>
            )}
          </span>
        </button>
      </div>
    </nav>
  );
};
