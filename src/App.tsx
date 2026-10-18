import React, { useState } from 'react';
import { SaloonProvider, useSaloon } from './context/SaloonContext';
import { Header } from './components/Header';
import { CreatorBadge } from './components/CreatorBadge';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallPWA } from './components/InstallPWA';
import { LiveQueueView } from './components/customer/LiveQueueView';
import { BarbersView } from './components/customer/BarbersView';
import { StylesGalleryView } from './components/customer/StylesGalleryView';
import { AppointmentBookingView } from './components/customer/AppointmentBookingView';
import { CustomerBottomNav } from './components/customer/CustomerBottomNav';
import { BarberDashboard } from './components/barber/BarberDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { HaircutStyle } from './types';
import { Scissors, Phone, Heart, Shield } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeRole, settings } = useSaloon();
  const [customerTab, setCustomerTab] = useState<'queue' | 'barbers' | 'styles' | 'booking'>('queue');
  const [preselectedStyle, setPreselectedStyle] = useState<HaircutStyle | null>(null);

  const handleSelectStyleForQueue = (style: HaircutStyle) => {
    setPreselectedStyle(style);
    setCustomerTab('queue');
  };

  const handleSelectStyleForBooking = (style: HaircutStyle) => {
    setPreselectedStyle(style);
    setCustomerTab('booking');
  };

  const handleJoinQueueForBarber = (_barberId: string) => {
    setCustomerTab('queue');
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-charcoal-950 font-sans">
      {/* Offline Status Warning */}
      <OfflineBanner />

      {/* Prominent App Creator Credentials Banner */}
      <CreatorBadge />

      {/* Application Header with Role Switcher & Push Notification button */}
      <Header />

      {/* PWA Install Promotion Banner */}
      <InstallPWA />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-2">
        {activeRole === 'customer' && (
          <div>
            {customerTab === 'queue' && (
              <LiveQueueView
                onSelectBarberTab={() => setCustomerTab('barbers')}
                onSelectStylesTab={() => setCustomerTab('styles')}
                preselectedStyle={preselectedStyle}
                onClearPreselectedStyle={() => setPreselectedStyle(null)}
              />
            )}

            {customerTab === 'barbers' && (
              <BarbersView onJoinQueueForBarber={handleJoinQueueForBarber} />
            )}

            {customerTab === 'styles' && (
              <StylesGalleryView
                onSelectStyleForQueue={handleSelectStyleForQueue}
                onSelectStyleForBooking={handleSelectStyleForBooking}
              />
            )}

            {customerTab === 'booking' && (
              <AppointmentBookingView
                onGoToQueue={() => setCustomerTab('queue')}
                preselectedStyle={preselectedStyle}
              />
            )}

            {/* Mobile Bottom Navigation */}
            <CustomerBottomNav activeTab={customerTab} setActiveTab={setCustomerTab} />
          </div>
        )}

        {activeRole === 'barber' && <BarberDashboard />}

        {activeRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-charcoal-900 border-t border-charcoal-800 text-xs text-slate-400 py-6 px-4 mt-auto mb-14 sm:mb-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Scissors className="w-4 h-4 text-amber-500" />
              <strong className="text-white font-bold">{settings.name}</strong>
              <span className="text-charcoal-600">•</span>
              <span>{settings.address}, {settings.city}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Smart Live Queue & Barber Appointment System • Default Timezone: {settings.timezone}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 text-center sm:text-right">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Application Developer Credit
            </div>
            <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
              <span>{settings.creator_name}</span>
              <span className="text-slate-400">|</span>
              <a
                href={`tel:${settings.creator_phone}`}
                className="text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <Phone className="w-3 h-3" />
                <span>{settings.creator_phone}</span>
              </a>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Contact for custom business queues, PWAs & booking software
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <SaloonProvider>
      <MainAppContent />
    </SaloonProvider>
  );
}

export default App;
