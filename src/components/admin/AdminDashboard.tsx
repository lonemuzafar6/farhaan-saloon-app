import React, { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Calendar,
  DollarSign,
  Scissors,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  UserPlus,
  Sparkles,
  BarChart3,
  RotateCcw,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { calculateBarberWaitTime } from '../../lib/queueAlgorithm';
import { Barber, Service, HaircutStyle, QueueEntry, StyleCategory } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    settings,
    updateSettings,
    barbers,
    updateBarber,
    addBarber,
    deleteBarber,
    services,
    addService,
    updateService,
    deleteService,
    styles,
    addStyle,
    updateStyle,
    deleteStyle,
    queues,
    appointments,
    auditLogs,
    addManualWalkin,
    reassignBarber,
    startService,
    completeService,
    skipCustomer,
    resetAllDemoData,
  } = useSaloon();

  const [activeTab, setActiveTab] = useState<
    'queues' | 'bookings' | 'barbers' | 'services' | 'gallery' | 'reports' | 'settings'
  >('queues');

  // Modal states
  const [showAddWalkinModal, setShowAddWalkinModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState<QueueEntry | null>(null);
  const [transferTargetBarberId, setTransferTargetBarberId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Load balancing');

  // Manual Walkin Form
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinBarberId, setWalkinBarberId] = useState(barbers[0]?.id || '');
  const [walkinServiceId, setWalkinServiceId] = useState(services[0]?.id || '');
  const [walkinPriority, setWalkinPriority] = useState(false);

  // New Service Form
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Haircut');
  const [newServicePrice, setNewServicePrice] = useState(200);
  const [newServiceDuration, setNewServiceDuration] = useState(25);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // New Style Form
  const [showAddStyleModal, setShowAddStyleModal] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleCategory, setNewStyleCategory] = useState<StyleCategory>('fade_taper');
  const [newStyleImage, setNewStyleImage] = useState('');
  const [newStylePrice, setNewStylePrice] = useState(220);
  const [newStyleDuration, setNewStyleDuration] = useState(30);
  const [newStyleDesc, setNewStyleDesc] = useState('');
  const [newStyleNotes, setNewStyleNotes] = useState('');
  const [newStyleTrending, setNewStyleTrending] = useState(true);

  // Calculate Daily Analytics
  const analytics = useMemo(() => {
    const todayEntries = queues; // current operational session
    const completed = todayEntries.filter((q) => q.status === 'completed');
    const waiting = todayEntries.filter((q) => q.status === 'waiting');
    const inService = todayEntries.filter((q) => q.status === 'in_service');
    const cancelled = todayEntries.filter((q) => q.status === 'cancelled');

    const totalRevenue = completed.reduce((sum, item) => sum + (item.service_price || 200), 0);
    const avgWaitMins =
      todayEntries.length > 0
        ? Math.round(
            todayEntries.reduce((sum, item) => sum + (item.estimated_wait_mins || 15), 0) /
              todayEntries.length
          )
        : 15;

    return {
      totalServed: completed.length,
      currentlyWaiting: waiting.length,
      currentlyServing: inService.length,
      cancelledCount: cancelled.length,
      totalRevenue,
      avgWaitMins,
    };
  }, [queues]);

  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim()) return;

    addManualWalkin({
      customerName: walkinName.trim(),
      customerPhone: walkinPhone.trim() || undefined,
      barberId: walkinBarberId,
      serviceId: walkinServiceId,
      priority: walkinPriority,
    });

    setWalkinName('');
    setWalkinPhone('');
    setShowAddWalkinModal(false);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal || !transferTargetBarberId) return;

    reassignBarber(showTransferModal.id, transferTargetBarberId, transferReason);
    setShowTransferModal(null);
  };

  const handleCreateServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    addService({
      name: newServiceName.trim(),
      category: newServiceCategory,
      price_inr: Number(newServicePrice),
      duration_minutes: Number(newServiceDuration),
      description: newServiceDesc.trim(),
      is_active: true,
    });

    setNewServiceName('');
    setNewServiceDesc('');
    setShowAddServiceModal(false);
  };

  const handleCreateStyleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName.trim() || !newStyleImage.trim()) return;

    addStyle({
      name: newStyleName.trim(),
      category: newStyleCategory,
      image_url: newStyleImage.trim(),
      default_price_inr: Number(newStylePrice),
      estimated_mins: Number(newStyleDuration),
      description: newStyleDesc.trim(),
      barber_instruction_notes: newStyleNotes.trim(),
      is_trending: newStyleTrending,
    });

    setNewStyleName('');
    setNewStyleImage('');
    setNewStyleDesc('');
    setShowAddStyleModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6 pb-24 text-left">
      {/* Top Banner: Salon Operational Switches */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Management Command Center
              </span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full border border-amber-500/30">
                Owner Access
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {settings.name} Admin
            </h2>
            <p className="text-xs text-slate-400">
              Live multi-barber queue orchestrator, online appointment controls, and daily revenue.
            </p>
          </div>

          {/* Quick Toggle Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Salon Open / Closed */}
            <button
              onClick={() => updateSettings({ is_open: !settings.is_open })}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                settings.is_open
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-rose-600/20 text-rose-300 border-rose-500/40 hover:bg-rose-600/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.is_open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>Salon: {settings.is_open ? 'OPEN' : 'CLOSED'}</span>
            </button>

            {/* Queue Pause */}
            <button
              onClick={() => updateSettings({ is_queue_paused: !settings.is_queue_paused })}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                settings.is_queue_paused
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                  : 'bg-charcoal-800 text-slate-300 border-charcoal-700 hover:text-white'
              }`}
            >
              Queue: {settings.is_queue_paused ? 'PAUSED' : 'ACTIVE'}
            </button>

            {/* Add Walkin Manual Button */}
            <button
              onClick={() => setShowAddWalkinModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Walk-in</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-charcoal-800">
        {[
          { id: 'queues', label: 'All 4 Barbers Queues', icon: Users },
          { id: 'bookings', label: 'Online Booking Switch', icon: Calendar },
          { id: 'reports', label: 'Daily Analytics & Revenue', icon: BarChart3 },
          { id: 'barbers', label: 'Barber Staff', icon: Scissors },
          { id: 'services', label: 'Services & Pricing', icon: DollarSign },
          { id: 'gallery', label: 'Style Lookbook Gallery', icon: Sparkles },
          { id: 'settings', label: 'Saloon Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-charcoal-950 shadow'
                  : 'bg-charcoal-900 text-slate-400 hover:text-white border border-charcoal-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALL 4 BARBERS QUEUE MANAGEMENT */}
      {activeTab === 'queues' && (
        <div className="space-y-6">
          {/* Workload Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Total In Chairs Now</span>
              <span className="text-2xl font-black text-amber-400">
                {analytics.currentlyServing}
              </span>
            </div>
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Waiting in Queue</span>
              <span className="text-2xl font-black text-white">
                {analytics.currentlyWaiting}
              </span>
            </div>
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Services Completed Today</span>
              <span className="text-2xl font-black text-emerald-400">
                {analytics.totalServed}
              </span>
            </div>
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Est. Average Wait</span>
              <span className="text-2xl font-black text-slate-200">
                ~{analytics.avgWaitMins}m
              </span>
            </div>
          </div>

          {/* 4 Barber Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {barbers.map((barber) => {
              const activeCust = queues.find(
                (q) => q.barber_id === barber.id && q.status === 'in_service'
              );
              const waitingList = queues
                .filter((q) => q.barber_id === barber.id && q.status === 'waiting')
                .sort((a, b) => a.priority_order - b.priority_order);

              const waitEst = calculateBarberWaitTime(barber, queues, appointments);

              return (
                <div
                  key={barber.id}
                  className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {/* Barber Header */}
                    <div className="flex items-center gap-3 border-b border-charcoal-800 pb-3 mb-3">
                      <img
                        src={barber.photo_url}
                        alt={barber.name}
                        className="w-10 h-10 rounded-xl object-cover border border-amber-500/40"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{barber.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {barber.current_status === 'serving' ? (
                            <span className="text-[10px] text-amber-400 font-semibold">
                              In Chair ({waitEst.queue_length} total)
                            </span>
                          ) : barber.current_status === 'on_break' ? (
                            <span className="text-[10px] text-slate-400">On Break</span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              Available
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Customer in Chair */}
                    <div className="mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        In Chair
                      </span>
                      {activeCust ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-amber-300">
                              {activeCust.token_number}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ₹{activeCust.service_price}
                            </span>
                          </div>
                          <div className="text-xs text-white font-medium truncate">
                            {activeCust.customer_name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {activeCust.service_name}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 mt-2">
                            <button
                              onClick={() => completeService(activeCust.id)}
                              className="py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            >
                              Done
                            </button>
                            <button
                              onClick={() => skipCustomer(activeCust.id)}
                              className="py-1 rounded-lg bg-charcoal-800 text-slate-300 text-[10px]"
                            >
                              Skip
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-charcoal-950 text-center text-[11px] text-slate-500">
                          Chair is empty
                        </div>
                      )}
                    </div>

                    {/* Waiting Queue List */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Waiting ({waitingList.length})
                        </span>
                        <span className="text-[10px] text-amber-400">
                          ~{waitEst.min_wait_mins}m wait
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {waitingList.length === 0 ? (
                          <div className="text-[11px] text-slate-600 text-center py-2">
                            Queue is empty
                          </div>
                        ) : (
                          waitingList.map((cust, idx) => (
                            <div
                              key={cust.id}
                              className="p-2 rounded-xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-bold text-white flex items-center gap-1">
                                  <span>#{idx + 1}</span>
                                  <span className="text-amber-400">{cust.token_number}</span>
                                </div>
                                <div className="text-[11px] text-slate-300 truncate max-w-[90px]">
                                  {cust.customer_name}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startService(cust.id)}
                                  className="p-1.5 rounded-lg bg-amber-500 text-charcoal-950 font-bold hover:bg-amber-400"
                                  title="Seat customer"
                                >
                                  <Scissors className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setShowTransferModal(cust);
                                    setTransferTargetBarberId(
                                      barbers.find((b) => b.id !== cust.barber_id)?.id || ''
                                    );
                                  }}
                                  className="p-1.5 rounded-lg bg-charcoal-800 text-slate-400 hover:text-white"
                                  title="Reassign to another barber"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add direct walkin for this specific barber */}
                  <button
                    onClick={() => {
                      setWalkinBarberId(barber.id);
                      setShowAddWalkinModal(true);
                    }}
                    className="w-full mt-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-[11px] font-semibold border border-charcoal-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to {barber.name.split(' ')[0]}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ONLINE BOOKING PROMINENT SWITCH & SETTINGS (SECTION 5 REQUIREMENT) */}
      {activeTab === 'bookings' && (
        <div className="max-w-2xl bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Booking Policy & Walk-in Integration
            </span>
            <h3 className="text-xl font-bold text-white mt-1">Online Appointment Controls</h3>
            <p className="text-xs text-slate-400 mt-1">
              Toggle online appointments on or off at will. Existing appointments are always preserved.
            </p>
          </div>

          {/* Master Prominent Toggle */}
          <div className="p-5 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Online Appointment Booking</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {settings.online_booking_enabled
                  ? 'Active: Customers can view slots and book reserved chairs.'
                  : 'Disabled: Customer booking tab is hidden; saloon operates on live walk-ins.'}
              </p>
            </div>

            <button
              onClick={() =>
                updateSettings({ online_booking_enabled: !settings.online_booking_enabled })
              }
              className={`p-1.5 rounded-full transition-colors ${
                settings.online_booking_enabled ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              {settings.online_booking_enabled ? (
                <ToggleRight className="w-12 h-12" />
              ) : (
                <ToggleLeft className="w-12 h-12" />
              )}
            </button>
          </div>

          {/* Integrated Walk-ins setting */}
          <div className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Accept Walk-ins When Booking is ON</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Keep walk-in queue active in parallel with scheduled appointment slots.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.accept_walkins_when_booking_on}
              onChange={(e) =>
                updateSettings({ accept_walkins_when_booking_on: e.target.checked })
              }
              className="w-5 h-5 accent-amber-500 rounded"
            />
          </div>

          {/* Buffer & advance booking options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Appointment Buffer (Mins)</label>
              <input
                type="number"
                value={settings.buffer_minutes}
                onChange={(e) => updateSettings({ buffer_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Advance Booking Window (Days)</label>
              <input
                type="number"
                value={settings.advance_booking_days}
                onChange={(e) => updateSettings({ advance_booking_days: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
              />
            </div>
          </div>

          {/* Existing Appointments List */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              All Existing Appointments ({appointments.length})
            </h4>
            <div className="space-y-2">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-amber-400">{apt.appointment_ref}</span>
                      <span>{apt.customer_name}</span>
                      <span className="text-slate-400 font-normal">({apt.customer_phone})</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {apt.appointment_date} at {apt.start_time} with {apt.barber_name} •{' '}
                      {apt.service_name} (₹{apt.service_price})
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      apt.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-charcoal-800 text-slate-400'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAILY ANALYTICS & AUDIT LOGS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800">
              <span className="text-xs text-slate-400 block mb-1">Total Daily Revenue (₹)</span>
              <span className="text-3xl font-black text-emerald-400">₹{analytics.totalRevenue}</span>
              <p className="text-[11px] text-slate-500 mt-1">Calculated from completed haircuts</p>
            </div>

            <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800">
              <span className="text-xs text-slate-400 block mb-1">Completed Customers</span>
              <span className="text-3xl font-black text-amber-400">{analytics.totalServed}</span>
              <p className="text-[11px] text-slate-500 mt-1">Services finished today</p>
            </div>

            <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800">
              <span className="text-xs text-slate-400 block mb-1">Customer Cancellations</span>
              <span className="text-3xl font-black text-rose-400">{analytics.cancelledCount}</span>
              <p className="text-[11px] text-slate-500 mt-1">Tokens cancelled</p>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-white">System Audit & Reassignment Trail</h4>
              <span className="text-xs text-slate-400">{auditLogs.length} events logged</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-mono text-[10px] text-amber-400 font-bold mr-2">
                      [{log.action_type}]
                    </span>
                    <span className="text-slate-200">{log.notes}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BARBERS MANAGEMENT */}
      {activeTab === 'barbers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Barber Staff Team (4 Configured)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-4 flex items-start gap-4"
              >
                <img
                  src={b.photo_url}
                  alt={b.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-amber-500/30"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-bold text-white">{b.name}</h4>
                    <span className="text-xs font-mono text-amber-400">PIN: {b.pin_code}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{b.experience_years} years exp • ~{b.avg_service_mins}m avg</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {b.specialties.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-charcoal-950 text-slate-300 px-2 py-0.5 rounded border border-charcoal-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SERVICES & PRICING */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Salon Services & Pricing</h3>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="p-4 rounded-2xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Category: {srv.category} • ~{srv.duration_minutes} mins
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-amber-400">₹{srv.price_inr}</span>
                  <button
                    onClick={() => deleteService(srv.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STYLES GALLERY MANAGEMENT */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Haircut & Beard Styles Management</h3>
              <p className="text-xs text-slate-400">
                Upload new trending images or adjust reference cutting instructions.
              </p>
            </div>
            <button
              onClick={() => setShowAddStyleModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Style</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {styles.map((st) => (
              <div
                key={st.id}
                className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden p-2 relative group"
              >
                <img
                  src={st.image_url}
                  alt={st.name}
                  className="w-full aspect-[4/3] object-cover rounded-xl mb-2"
                />
                <h5 className="text-xs font-bold text-white truncate">{st.name}</h5>
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span className="text-amber-400 font-bold">₹{st.default_price_inr}</span>
                  <span>{st.category}</span>
                </div>
                <button
                  onClick={() => deleteStyle(st.id)}
                  className="absolute top-3 right-3 p-1 rounded bg-black/60 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Style"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SETTINGS & CREATOR INFO */}
      {activeTab === 'settings' && (
        <div className="max-w-xl bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Saloon Profile Settings</h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Saloon Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSettings({ name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={settings.city}
                onChange={(e) => updateSettings({ city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => updateSettings({ phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-charcoal-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">Developer Reset Option</span>
            <button
              onClick={resetAllDemoData}
              className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-rose-600/20 text-rose-400 text-xs font-semibold transition-colors"
            >
              Reset to Demo Data
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD MANUAL WALKIN CUSTOMER */}
      {showAddWalkinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAddWalkinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Add Walk-in Customer</span>
            </h3>

            <form onSubmit={handleWalkinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Javed Dar"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Assign to Barber</label>
                <select
                  value={walkinBarberId}
                  onChange={(e) => setWalkinBarberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Service</label>
                <select
                  value={walkinServiceId}
                  onChange={(e) => setWalkinServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (₹{s.price_inr})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="priorityToggle"
                  checked={walkinPriority}
                  onChange={(e) => setWalkinPriority(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <label htmlFor="priorityToggle" className="text-xs text-slate-300">
                  Priority Seat (Place at top of queue)
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs"
              >
                Issue Walk-in Token
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER CUSTOMER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowTransferModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <span>Transfer Customer</span>
            </h3>

            <p className="text-xs text-slate-300 mb-4">
              Reassign Token <strong>{showTransferModal.token_number}</strong> (
              {showTransferModal.customer_name}) to another barber.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Target Barber</label>
                <select
                  value={transferTargetBarberId}
                  onChange={(e) => setTransferTargetBarberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Reason for Transfer *</label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs"
              >
                Confirm Reassignment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SERVICE */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAddServiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3">Add New Service</h3>

            <form onSubmit={handleCreateServiceSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Category</label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  <option value="Haircut">Haircut</option>
                  <option value="Beard">Beard</option>
                  <option value="Shave">Shave</option>
                  <option value="Combo">Combo</option>
                  <option value="Grooming">Grooming</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs"
              >
                Save Service
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STYLE */}
      {showAddStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAddStyleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3">Add Haircut / Beard Style</h3>

            <form onSubmit={handleCreateStyleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Style Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Low Taper Fade"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newStyleImage}
                  onChange={(e) => setNewStyleImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newStylePrice}
                    onChange={(e) => setNewStylePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Est. Mins</label>
                  <input
                    type="number"
                    value={newStyleDuration}
                    onChange={(e) => setNewStyleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Category</label>
                <select
                  value={newStyleCategory}
                  onChange={(e) => setNewStyleCategory(e.target.value as StyleCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  <option value="fade_taper">Fade & Taper</option>
                  <option value="classic">Classic Cuts</option>
                  <option value="modern_textured">Modern Textured</option>
                  <option value="crew_short">Crew Short</option>
                  <option value="long_hair">Long Hair</option>
                  <option value="beard_shaping">Beard Shaping</option>
                  <option value="moustache">Moustache</option>
                  <option value="combo">Combo</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs"
              >
                Add to Gallery
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
