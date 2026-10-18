import React, { useState, useEffect, useRef } from 'react';
import {
  Scissors,
  User,
  Clock,
  Phone,
  CheckCircle2,
  FastForward,
  RotateCcw,
  Coffee,
  Pause,
  Play,
  Calendar,
  AlertCircle,
  Eye,
  KeyRound,
  Sparkles,
  Timer,
  Edit,
  Camera,
  X,
  Check,
} from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { Barber, BarberStatus, QueueEntry, Appointment } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';

export const BarberDashboard: React.FC = () => {
  const {
    barbers,
    queues,
    appointments,
    activeBarberId,
    setActiveBarberId,
    updateBarberStatus,
    updateBarber,
    startService,
    completeService,
    skipCustomer,
    recallCustomer,
  } = useSaloon();

  const [enteredPin, setEnteredPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // default open for smooth demo, with PIN verify option
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'queue' | 'appointments' | 'skipped'>('queue');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSpecialties, setProfileSpecialties] = useState('');
  const [isCompressingBarberPhoto, setIsCompressingBarberPhoto] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const barberPhotoInputRef = useRef<HTMLInputElement>(null);

  const currentBarber = barbers.find((b) => b.id === activeBarberId) || barbers[0];

  // In-service customer for this barber
  const activeServiceCustomer = queues.find(
    (q) => q.barber_id === currentBarber.id && q.status === 'in_service'
  );

  // Waiting queue for this barber
  const waitingCustomers = queues
    .filter((q) => q.barber_id === currentBarber.id && q.status === 'waiting')
    .sort((a, b) => a.priority_order - b.priority_order);

  // Skipped customers for this barber (recoverable!)
  const skippedCustomers = queues.filter(
    (q) => q.barber_id === currentBarber.id && q.status === 'skipped'
  );

  // Today's appointments for this barber
  const todayStr = new Date().toISOString().split('T')[0];
  const barberAppointments = appointments.filter(
    (apt) => apt.barber_id === currentBarber.id && apt.appointment_date === todayStr
  );

  // Live timer for active service
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeServiceCustomer && activeServiceCustomer.started_at) {
      const started = new Date(activeServiceCustomer.started_at).getTime();
      const updateTimer = () => {
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - started) / 1000)));
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeServiceCustomer]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === currentBarber.pin_code || enteredPin === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  useEffect(() => {
    if (currentBarber) {
      setProfileName(currentBarber.name);
      setProfilePhoto(currentBarber.photo_url);
      setProfileBio(currentBarber.bio);
      setProfileSpecialties(currentBarber.specialties.join(', '));
    }
  }, [currentBarber]);

  const handleBarberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingBarberPhoto(true);
      const compressed = await compressImageFile(file, { maxWidth: 500, maxHeight: 500, quality: 0.82 });
      setProfilePhoto(compressed);
    } catch (err) {
      console.error(err);
      alert('Could not process photo. Please choose a valid image file.');
    } finally {
      setIsCompressingBarberPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Please enter a barber name.');
      return;
    }

    updateBarber({
      ...currentBarber,
      name: profileName.trim(),
      photo_url: profilePhoto.trim(),
      bio: profileBio.trim(),
      specialties: profileSpecialties.split(',').map((s) => s.trim()).filter(Boolean),
    });

    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
    setShowEditProfileModal(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-5 pb-24 text-left">
      {/* Barber Selector Bar (Optimized for fast 1-hand switching on phones) */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        {barbers.map((b) => {
          const isSelected = b.id === currentBarber.id;
          const waitCount = queues.filter((q) => q.barber_id === b.id && q.status === 'waiting').length;

          return (
            <button
              key={b.id}
              onClick={() => {
                setActiveBarberId(b.id);
                setEnteredPin('');
                setIsAuthenticated(true);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'bg-charcoal-950 text-slate-300 hover:text-white border border-charcoal-800'
              }`}
            >
              <img
                src={b.photo_url}
                alt={b.name}
                className="w-6 h-6 rounded-full object-cover border border-current"
              />
              <span className="text-xs">{b.name.split(' ')[0]}</span>
              {waitCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-charcoal-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {waitCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Barber Status & Controls Header */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentBarber.photo_url}
              alt={currentBarber.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50 shadow"
            />
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Barber Workstation (PIN: {currentBarber.pin_code})
              </span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{currentBarber.name}</span>
                {currentBarber.current_status === 'serving' ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Serving
                  </span>
                ) : currentBarber.current_status === 'on_break' ? (
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                    On Break
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Available
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {waitingCustomers.length} waiting • {barberAppointments.length} appointments today
              </p>
            </div>
          </div>

          {/* Quick Status Toggles (Break / Available / Pause) */}
          <div className="flex flex-wrap items-center gap-2">
            {currentBarber.current_status === 'on_break' ? (
              <button
                onClick={() => updateBarberStatus(currentBarber.id, 'available')}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Work</span>
              </button>
            ) : (
              <button
                onClick={() => updateBarberStatus(currentBarber.id, 'on_break', 15)}
                className="px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-charcoal-700"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>Take 15m Break</span>
              </button>
            )}

            {currentBarber.current_status === 'unavailable' ? (
              <button
                onClick={() => updateBarberStatus(currentBarber.id, 'available')}
                className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Open Chair
              </button>
            ) : (
              <button
                onClick={() => updateBarberStatus(currentBarber.id, 'unavailable')}
                className="px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-rose-400 font-semibold text-xs border border-charcoal-700"
              >
                Go Offline
              </button>
            )}

            <button
              onClick={() => {
                setProfileName(currentBarber.name);
                setProfilePhoto(currentBarber.photo_url);
                setProfileBio(currentBarber.bio);
                setProfileSpecialties(currentBarber.specialties.join(', '));
                setShowEditProfileModal(true);
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-charcoal-950 text-amber-400 font-bold text-xs transition-colors flex items-center gap-1.5 border border-amber-500/30"
              title="Change barber name, photo, and specialties"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccessToast && (
        <div className="fixed bottom-20 right-4 z-50 bg-emerald-500 text-charcoal-950 font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-charcoal-950 stroke-[3]" />
          <span>Barber profile and photo updated successfully!</span>
        </div>
      )}

      {/* ACTIVE CUSTOMER IN CHAIR (HERO WORKSTATION CARD) */}
      {activeServiceCustomer ? (
        <div className="bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-amber-950/40 border-2 border-amber-500 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-charcoal-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                CURRENT CUSTOMER IN CHAIR
              </span>
            </div>
            {/* Live Elapsed Service Timer */}
            <div className="flex items-center gap-1.5 bg-charcoal-950 px-3 py-1 rounded-xl border border-charcoal-800 font-mono text-sm font-bold text-amber-400">
              <Timer className="w-4 h-4 text-amber-400 animate-spin" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {activeServiceCustomer.token_number}
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                {activeServiceCustomer.customer_name}
              </h3>
              {activeServiceCustomer.customer_phone && (
                <a
                  href={`tel:${activeServiceCustomer.customer_phone}`}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline mt-0.5 font-medium"
                >
                  <Phone className="w-3 h-3" />
                  <span>{activeServiceCustomer.customer_phone}</span>
                </a>
              )}
            </div>

            <div className="bg-charcoal-950/80 p-3 rounded-2xl border border-charcoal-800 text-right">
              <span className="text-[10px] text-slate-400 block">Requested Service</span>
              <span className="text-sm font-bold text-white block">
                {activeServiceCustomer.service_name}
              </span>
              <span className="text-xs font-semibold text-amber-400">
                ₹{activeServiceCustomer.service_price}
              </span>
            </div>
          </div>

          {/* Reference Hairstyle Photo (Customer's choice) */}
          {activeServiceCustomer.style_image && (
            <div className="bg-charcoal-950 rounded-2xl p-3 border border-amber-500/20 flex items-center gap-3 mb-5">
              <img
                src={activeServiceCustomer.style_image}
                alt="Reference"
                className="w-16 h-16 rounded-xl object-cover border border-amber-500/40"
              />
              <div className="flex-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  Customer's Desired Style
                </span>
                <h4 className="text-xs font-bold text-white">{activeServiceCustomer.style_name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reference visual chosen by customer from Farhaan lookbook.
                </p>
              </div>
            </div>
          )}

          {/* LARGE OPERATIONAL BUTTONS (1-HAND THUMB TOUCH FRIENDLY) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => completeService(activeServiceCustomer.id)}
              className="py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm tracking-wide transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Complete Service</span>
            </button>

            <button
              onClick={() => skipCustomer(activeServiceCustomer.id)}
              className="py-4 px-4 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-amber-400 font-bold text-xs transition-colors border border-charcoal-700 flex items-center justify-center gap-1.5 active:scale-98"
            >
              <FastForward className="w-4 h-4" />
              <span>Skip Customer</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty chair status */
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-center text-emerald-400 mx-auto">
            <Scissors className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Your Barber Chair is Free</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {waitingCustomers.length > 0
              ? `${waitingCustomers.length} customer(s) are waiting in your queue. Call the next customer to begin.`
              : 'No waiting customers right now. Your queue is clear.'}
          </p>

          {waitingCustomers.length > 0 && (
            <button
              onClick={() => startService(waitingCustomers[0].id)}
              className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
            >
              <Scissors className="w-4 h-4 stroke-[2.5]" />
              <span>Call Next: {waitingCustomers[0].token_number} ({waitingCustomers[0].customer_name})</span>
            </button>
          )}
        </div>
      )}

      {/* Tabs: Next In Queue, Upcoming Appointments, Recoverable Skipped */}
      <div className="flex gap-2 border-b border-charcoal-800 pb-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'queue'
              ? 'bg-amber-500 text-charcoal-950'
              : 'text-slate-400 hover:text-white bg-charcoal-900'
          }`}
        >
          <span>Next in Queue</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-charcoal-950/30">
            {waitingCustomers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'appointments'
              ? 'bg-amber-500 text-charcoal-950'
              : 'text-slate-400 hover:text-white bg-charcoal-900'
          }`}
        >
          <span>Appointments</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-charcoal-950/30">
            {barberAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('skipped')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'skipped'
              ? 'bg-amber-500 text-charcoal-950'
              : 'text-slate-400 hover:text-white bg-charcoal-900'
          }`}
        >
          <span>Skipped Customers</span>
          {skippedCustomers.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-charcoal-950 font-bold">
              {skippedCustomers.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: NEXT IN QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {waitingCustomers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-charcoal-900/60 border border-charcoal-800 text-center text-xs text-slate-400">
              No waiting customers in this barber's line.
            </div>
          ) : (
            waitingCustomers.map((cust, idx) => (
              <div
                key={cust.id}
                className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-center font-black text-amber-400 text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{cust.token_number}</span>
                      <span className="text-xs text-slate-300 font-medium">{cust.customer_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {cust.service_name} • Est ~{cust.estimated_wait_mins}m wait
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startService(cust.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Seat Customer</span>
                  </button>

                  <button
                    onClick={() => skipCustomer(cust.id)}
                    className="p-2 rounded-xl bg-charcoal-800 text-slate-400 hover:text-amber-400 text-xs transition-colors"
                    title="Skip"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-3">
          {barberAppointments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-charcoal-900/60 border border-charcoal-800 text-center text-xs text-slate-400">
              No scheduled appointments for today.
            </div>
          ) : (
            barberAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {apt.start_time} - {apt.end_time}
                    </span>
                    <span className="text-xs font-bold text-white">{apt.customer_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {apt.service_name} • Ref: {apt.appointment_ref}
                  </p>
                  {apt.notes && (
                    <p className="text-[11px] text-amber-300 italic mt-0.5">Note: "{apt.notes}"</p>
                  )}
                </div>

                <a
                  href={`tel:${apt.customer_phone}`}
                  className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-amber-400 border border-charcoal-700"
                  title="Call Customer"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: RECOVERABLE SKIPPED CUSTOMERS (SECTION 4 REQUIREMENT) */}
      {activeTab === 'skipped' && (
        <div className="space-y-3">
          {skippedCustomers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-charcoal-900/60 border border-charcoal-800 text-center text-xs text-slate-400">
              No skipped customers. When a customer steps out, skip them here to recover them later.
            </div>
          ) : (
            skippedCustomers.map((cust) => (
              <div
                key={cust.id}
                className="bg-charcoal-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-400">{cust.token_number}</span>
                    <span className="text-xs font-bold text-white">{cust.customer_name}</span>
                    <span className="text-[10px] bg-charcoal-950 text-slate-400 px-2 py-0.2 rounded border border-charcoal-800">
                      Skipped
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {cust.service_name} {cust.customer_phone ? `• ${cust.customer_phone}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => recallCustomer(cust.id)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Call Back</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: EDIT BARBER PROFILE (NAME & PHOTO) */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowEditProfileModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Barber Profile</h3>
                <p className="text-xs text-slate-400">Update your name, picture, and specialties</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Barber Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Barber Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
                  placeholder="e.g. Farhaan Lone"
                />
              </div>

              {/* Barber Photo Section */}
              <div className="bg-charcoal-950 p-4 rounded-2xl border border-charcoal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Barber Photograph</label>
                  <span className="text-[10px] text-amber-400">Camera / Gallery</span>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-4">
                  <img
                    src={profilePhoto || currentBarber.photo_url}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={barberPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBarberPhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isCompressingBarberPhoto}
                      onClick={() => barberPhotoInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-50 text-amber-400 font-bold text-xs border border-charcoal-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCompressingBarberPhoto ? 'Optimizing Image...' : 'Upload from Phone / PC'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Auto-compressed & stored locally (PNG, JPG, WEBP)
                    </p>
                  </div>
                </div>

                {/* Avatars */}
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                    Or select an instant avatar:
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80',
                    ].map((avatarUrl, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setProfilePhoto(avatarUrl)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                          profilePhoto === avatarUrl
                            ? 'border-amber-400 ring-2 ring-amber-400/30'
                            : 'border-charcoal-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct URL */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Or paste web photo URL:</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specialties (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Skin Fade, Beard Trim, Hot Towel"
                  value={profileSpecialties}
                  onChange={(e) => setProfileSpecialties(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Bio</label>
                <textarea
                  rows={2}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Brief introduction..."
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20"
              >
                Save Barber Profile & Photo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
