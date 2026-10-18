import React from 'react';
import { Scissors, UserCheck, Shield, Users, Bell, Clock, MapPin } from 'lucide-react';
import { useSaloon } from '../context/SaloonContext';

export const Header: React.FC = () => {
  const { settings, activeRole, setActiveRole, requestNotificationPermission } = useSaloon();

  const handleNotificationClick = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      alert('Push notifications enabled! You will receive turn alerts when in queue.');
    } else {
      alert('Notification permissions are not enabled or blocked in your browser.');
    }
  };

  return (
    <header className="bg-charcoal-900 border-b border-charcoal-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Salon Branding */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-charcoal-950 shadow-lg shadow-amber-600/20">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {settings.name}
                </h1>
                {settings.is_open ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    OPEN
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    CLOSED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500/80" />
                <span>{settings.city}, {settings.state}</span>
                <span className="text-charcoal-600">•</span>
                <Clock className="w-3 h-3 text-amber-500/80" />
                <span>9 AM - 9 PM</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleNotificationClick}
            className="sm:hidden p-2 rounded-lg bg-charcoal-800 text-slate-300 hover:text-amber-400 transition-colors"
            title="Enable notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>

        {/* Role Navigation Switcher (Customer / Barber / Admin) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <div className="inline-flex p-1 bg-charcoal-950 rounded-xl border border-charcoal-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveRole('customer')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'customer'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => setActiveRole('barber')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'barber'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Barber</span>
            </button>

            <button
              onClick={() => setActiveRole('admin')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'admin'
                  ? 'bg-amber-500 text-charcoal-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Owner Admin</span>
            </button>
          </div>

          <button
            onClick={handleNotificationClick}
            className="hidden sm:flex items-center gap-1 p-2 rounded-lg bg-charcoal-800 text-slate-300 hover:text-amber-400 transition-colors"
            title="Enable push notifications"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
