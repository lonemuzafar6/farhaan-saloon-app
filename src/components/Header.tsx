import React, { useState } from 'react';
import { Scissors, UserCheck, Shield, Users, Bell, Clock, MapPin, Lock, LogOut } from 'lucide-react';
import { useSaloon } from '../context/SaloonContext';
import { StaffLoginModal } from './StaffLoginModal';

export const Header: React.FC = () => {
  const { settings, activeRole, setActiveRole, activeBarberId, barbers, requestNotificationPermission } = useSaloon();
  const [showStaffModal, setShowStaffModal] = useState(false);

  const currentBarber = barbers.find((b) => b.id === activeBarberId) || barbers[0];

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

          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={handleNotificationClick}
              className="p-2 rounded-lg bg-charcoal-800 text-slate-300 hover:text-amber-400 transition-colors"
              title="Enable notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {activeRole === 'customer' ? (
              <button
                onClick={() => setShowStaffModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-charcoal-800 text-amber-400 font-bold text-xs border border-charcoal-700"
                title="Staff & Owner Portal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveRole('customer')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/30"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Action Controls: Notification + Role-Specific Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={handleNotificationClick}
            className="flex items-center gap-1 p-2 rounded-lg bg-charcoal-800 text-slate-300 hover:text-amber-400 transition-colors"
            title="Enable push notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {activeRole === 'customer' && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 hover:text-amber-400 text-xs font-semibold border border-charcoal-700 transition-colors"
              title="Barber and Owner access with PIN"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Staff Login</span>
            </button>
          )}

          {activeRole === 'barber' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Station: {currentBarber.name}</span>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem(`farhaan_barber_authed_${activeBarberId}`);
                  setActiveRole('customer');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold border border-rose-500/30 transition-colors"
                title="Lock workstation and return to customer view"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Exit Workstation</span>
              </button>
            </div>
          )}

          {activeRole === 'admin' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Suite</span>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('farhaan_admin_authed');
                  setActiveRole('customer');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold border border-rose-500/30 transition-colors"
                title="Exit admin and return to customer view"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Staff Login Modal */}
      <StaffLoginModal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} />
    </header>
  );
};
