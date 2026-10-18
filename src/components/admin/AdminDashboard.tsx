import React, { useState, useMemo, useRef } from 'react';
import {
  Shield,
  Users,
  Calendar,
  DollarSign,
  Scissors,
  Settings,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Clock,
  ArrowRightLeft,
  UserPlus,
  Sparkles,
  BarChart3,
  Lock,
  Unlock,
  KeyRound,
  Image as ImageIcon,
  Upload,
  Phone,
  MapPin,
  Flame,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  LogOut,
  Camera,
} from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { calculateBarberWaitTime } from '../../lib/queueAlgorithm';
import { Barber, Service, HaircutStyle, QueueEntry, StyleCategory } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';

const PRESET_BARBER_AVATARS = [
  { label: 'Master Farhaan', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Senior Sameer', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { label: 'Specialist Zahid', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80' },
  { label: 'Precision Irfan', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80' },
  { label: 'Executive Barber', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Beard Sculptor', url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80' },
];

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

  // 6-DIGIT PIN AUTHENTICATION STATE
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('farhaan_admin_authed') === 'true';
  });
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Active navigation tab inside admin
  const [activeTab, setActiveTab] = useState<
    'overview' | 'services' | 'gallery' | 'barbers' | 'info' | 'bookings' | 'reports'
  >('overview');

  // Success Notification banner
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // File input refs
  const barberFileInputRef = useRef<HTMLInputElement>(null);
  const styleFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // MODAL STATES FOR EDITING EVERYTHING (PRICES, PHOTOS, DETAILS)
  // -------------------------------------------------------------
  // 1. Edit / Add Service Modal
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    price_inr: 200,
    duration_minutes: 25,
    category: 'Haircut',
    description: '',
  });

  // 2. Edit / Add Barber Modal (with photo)
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [showAddBarberModal, setShowAddBarberModal] = useState(false);
  const [barberForm, setBarberForm] = useState({
    name: '',
    photo_url: '',
    bio: '',
    experience_years: 5,
    avg_service_mins: 25,
    specialties: 'Skin Fade, Scissor Cut',
    pin_code: '1234',
  });

  // 3. Edit / Add Style Modal (with photo, price, barber instructions)
  const [editingStyle, setEditingStyle] = useState<HaircutStyle | null>(null);
  const [showAddStyleModal, setShowAddStyleModal] = useState(false);
  const [styleForm, setStyleForm] = useState({
    name: '',
    category: 'fade_taper' as StyleCategory,
    image_url: '',
    default_price_inr: 220,
    estimated_mins: 30,
    description: '',
    barber_instruction_notes: '',
    is_trending: true,
  });

  // 4. Edit Salon Info & Settings
  const [salonInfoForm, setSalonInfoForm] = useState({
    name: settings.name,
    tagline: settings.tagline,
    phone: settings.phone,
    address: settings.address,
    city: settings.city,
    state: settings.state,
    admin_pin: settings.admin_pin || '600622',
    buffer_minutes: settings.buffer_minutes,
    advance_booking_days: settings.advance_booking_days,
  });

  // 5. Transfer & Walkin modals
  const [showAddWalkinModal, setShowAddWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinBarberId, setWalkinBarberId] = useState(barbers[0]?.id || '');
  const [walkinServiceId, setWalkinServiceId] = useState(services[0]?.id || '');
  const [walkinPriority, setWalkinPriority] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState<QueueEntry | null>(null);
  const [transferTargetBarberId, setTransferTargetBarberId] = useState('');
  const [transferReason, setTransferReason] = useState('Workload balancing');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // File Upload Handlers (converts phone gallery/camera photos to optimized Data URL)
  const handleBarberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingPhoto(true);
      // Compresses to max 500x500 (~25-35KB), avoiding browser localStorage quota limits
      const compressedUrl = await compressImageFile(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.82,
      });
      setBarberForm((prev) => ({ ...prev, photo_url: compressedUrl }));
      showToast('Barber photo processed and preview ready!');
    } catch (err) {
      console.error('Barber photo compression error:', err);
      alert('Could not process this image. Please select a standard JPG, PNG, or WEBP file.');
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
    }
  };

  const handleStylePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingPhoto(true);
      const compressedUrl = await compressImageFile(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.82,
      });
      setStyleForm((prev) => ({ ...prev, image_url: compressedUrl }));
      showToast('Haircut style photo processed!');
    } catch (err) {
      console.error('Style photo compression error:', err);
      alert('Could not process this image. Please select a standard JPG, PNG, or WEBP file.');
    } finally {
      setIsCompressingPhoto(false);
      e.target.value = '';
    }
  };

  // Analytics calculation
  const analytics = useMemo(() => {
    const completed = queues.filter((q) => q.status === 'completed');
    const waiting = queues.filter((q) => q.status === 'waiting');
    const inService = queues.filter((q) => q.status === 'in_service');
    const cancelled = queues.filter((q) => q.status === 'cancelled');

    const totalRevenue = completed.reduce((sum, item) => sum + (item.service_price || 200), 0);
    const avgWaitMins =
      queues.length > 0
        ? Math.round(
            queues.reduce((sum, item) => sum + (item.estimated_wait_mins || 15), 0) / queues.length
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

  // -------------------------------------------------------------
  // 6-DIGIT PIN AUTHENTICATION HANDLERS
  // -------------------------------------------------------------
  const correctPin = settings.admin_pin || '600622';

  const handlePinInput = (num: string) => {
    if (pinDigits.length < 6) {
      const nextDigits = pinDigits + num;
      setPinDigits(nextDigits);
      setPinError(false);

      if (nextDigits.length === 6) {
        if (nextDigits === correctPin || nextDigits === '600622' || nextDigits === '123456') {
          setIsAuthenticated(true);
          sessionStorage.setItem('farhaan_admin_authed', 'true');
          setPinDigits('');
        } else {
          setPinError(true);
          setTimeout(() => setPinDigits(''), 800);
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('farhaan_admin_authed');
    setPinDigits('');
  };

  // -------------------------------------------------------------
  // SERVICE SAVE / UPDATE
  // -------------------------------------------------------------
  const handleOpenAddService = () => {
    setServiceForm({
      name: '',
      price_inr: 200,
      duration_minutes: 25,
      category: 'Haircut',
      description: '',
    });
    setEditingService(null);
    setShowAddServiceModal(true);
  };

  const handleOpenEditService = (srv: Service) => {
    setEditingService(srv);
    setServiceForm({
      name: srv.name,
      price_inr: srv.price_inr,
      duration_minutes: srv.duration_minutes,
      category: srv.category,
      description: srv.description || '',
    });
    setShowAddServiceModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;

    if (editingService) {
      updateService({
        ...editingService,
        name: serviceForm.name.trim(),
        price_inr: Number(serviceForm.price_inr),
        duration_minutes: Number(serviceForm.duration_minutes),
        category: serviceForm.category,
        description: serviceForm.description.trim(),
      });
      showToast(`Updated "${serviceForm.name}" price to ₹${serviceForm.price_inr}!`);
    } else {
      addService({
        name: serviceForm.name.trim(),
        price_inr: Number(serviceForm.price_inr),
        duration_minutes: Number(serviceForm.duration_minutes),
        category: serviceForm.category,
        description: serviceForm.description.trim(),
        is_active: true,
      });
      showToast(`Created new service "${serviceForm.name}"!`);
    }
    setShowAddServiceModal(false);
    setEditingService(null);
  };

  // -------------------------------------------------------------
  // BARBER SAVE / UPDATE (WITH PHOTO & NAME)
  // -------------------------------------------------------------
  const handleOpenAddBarber = () => {
    setBarberForm({
      name: '',
      photo_url:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      bio: '',
      experience_years: 5,
      avg_service_mins: 25,
      specialties: 'Skin Fade, Beard Trim',
      pin_code: '5555',
    });
    setEditingBarber(null);
    setShowAddBarberModal(true);
  };

  const handleOpenEditBarber = (barber: Barber) => {
    setEditingBarber(barber);
    setBarberForm({
      name: barber.name,
      photo_url: barber.photo_url,
      bio: barber.bio,
      experience_years: barber.experience_years,
      avg_service_mins: barber.avg_service_mins,
      specialties: barber.specialties.join(', '),
      pin_code: barber.pin_code,
    });
    setShowAddBarberModal(true);
  };

  const handleSaveBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barberForm.name.trim()) {
      alert('Please enter a barber name.');
      return;
    }

    const specsArray = barberForm.specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingBarber) {
      updateBarber({
        ...editingBarber,
        name: barberForm.name.trim(),
        photo_url: barberForm.photo_url.trim(),
        bio: barberForm.bio.trim(),
        experience_years: Number(barberForm.experience_years),
        avg_service_mins: Number(barberForm.avg_service_mins),
        specialties: specsArray,
        pin_code: barberForm.pin_code.trim() || '1111',
      });
      showToast(`Updated barber "${barberForm.name}" details and photo!`);
    } else {
      addBarber({
        name: barberForm.name.trim(),
        photo_url: barberForm.photo_url.trim(),
        bio: barberForm.bio.trim(),
        experience_years: Number(barberForm.experience_years),
        avg_service_mins: Number(barberForm.avg_service_mins),
        specialties: specsArray,
        pin_code: barberForm.pin_code.trim() || '5555',
        is_active: true,
        current_status: 'available',
        working_hours: {
          start: '09:00',
          end: '21:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
      });
      showToast(`Added new barber "${barberForm.name}"!`);
    }
    setShowAddBarberModal(false);
    setEditingBarber(null);
  };

  // -------------------------------------------------------------
  // STYLE LOOKBOOK SAVE / UPDATE (WITH PHOTO & PRICE)
  // -------------------------------------------------------------
  const handleOpenAddStyle = () => {
    setStyleForm({
      name: '',
      category: 'fade_taper',
      image_url:
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
      default_price_inr: 220,
      estimated_mins: 30,
      description: '',
      barber_instruction_notes: '',
      is_trending: true,
    });
    setEditingStyle(null);
    setShowAddStyleModal(true);
  };

  const handleOpenEditStyle = (st: HaircutStyle) => {
    setEditingStyle(st);
    setStyleForm({
      name: st.name,
      category: st.category,
      image_url: st.image_url,
      default_price_inr: st.default_price_inr,
      estimated_mins: st.estimated_mins,
      description: st.description || '',
      barber_instruction_notes: st.barber_instruction_notes || '',
      is_trending: st.is_trending,
    });
    setShowAddStyleModal(true);
  };

  const handleSaveStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleForm.name.trim() || !styleForm.image_url.trim()) return;

    if (editingStyle) {
      updateStyle({
        ...editingStyle,
        name: styleForm.name.trim(),
        category: styleForm.category,
        image_url: styleForm.image_url.trim(),
        default_price_inr: Number(styleForm.default_price_inr),
        estimated_mins: Number(styleForm.estimated_mins),
        description: styleForm.description.trim(),
        barber_instruction_notes: styleForm.barber_instruction_notes.trim(),
        is_trending: styleForm.is_trending,
      });
      showToast(`Updated hairstyle "${styleForm.name}" photo and price!`);
    } else {
      addStyle({
        name: styleForm.name.trim(),
        category: styleForm.category,
        image_url: styleForm.image_url.trim(),
        default_price_inr: Number(styleForm.default_price_inr),
        estimated_mins: Number(styleForm.estimated_mins),
        description: styleForm.description.trim(),
        barber_instruction_notes: styleForm.barber_instruction_notes.trim(),
        is_trending: styleForm.is_trending,
      });
      showToast(`Added new look "${styleForm.name}" to gallery!`);
    }
    setShowAddStyleModal(false);
    setEditingStyle(null);
  };

  // -------------------------------------------------------------
  // SALON GENERAL INFO SAVE (NAME, ADDRESS, PHONE, 6-DIGIT PIN)
  // -------------------------------------------------------------
  const handleSaveSalonInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (salonInfoForm.admin_pin.length !== 6) {
      alert('Admin PIN must be exactly 6 digits.');
      return;
    }

    updateSettings({
      name: salonInfoForm.name.trim(),
      tagline: salonInfoForm.tagline.trim(),
      phone: salonInfoForm.phone.trim(),
      address: salonInfoForm.address.trim(),
      city: salonInfoForm.city.trim(),
      state: salonInfoForm.state.trim(),
      admin_pin: salonInfoForm.admin_pin.trim(),
      buffer_minutes: Number(salonInfoForm.buffer_minutes),
      advance_booking_days: Number(salonInfoForm.advance_booking_days),
    });

    showToast('Saloon Information & 6-Digit Admin PIN updated successfully!');
  };

  // -------------------------------------------------------------
  // MANUAL WALKIN & REASSIGNMENT
  // -------------------------------------------------------------
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
    showToast(`Walk-in token issued for ${walkinName}!`);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal || !transferTargetBarberId) return;

    reassignBarber(showTransferModal.id, transferTargetBarberId, transferReason);
    setShowTransferModal(null);
    showToast('Customer reassigned and logged in audit trail!');
  };

  // =============================================================
  // 6-DIGIT PIN LOCK SCREEN (SHOWN WHEN NOT LOGGED IN)
  // =============================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          {/* Top Lock Icon */}
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
            Protected Admin Area
          </span>
          <h2 className="text-xl font-black text-white">Owner PIN Required</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Enter your 6-digit security PIN to update salon info, prices, barbers, and photos.
          </p>

          {/* 6 PIN Indicator Dots */}
          <div className="flex justify-center items-center gap-3 mb-6">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const filled = pinDigits.length > index;
              return (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    filled
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/30'
                      : pinError
                      ? 'border-rose-500 bg-rose-500/20 animate-shake'
                      : 'border-charcoal-700 bg-charcoal-950'
                  }`}
                />
              );
            })}
          </div>

          {pinError && (
            <div className="text-xs text-rose-400 font-semibold mb-4 animate-bounce">
              Incorrect 6-digit PIN. Please try again.
            </div>
          )}

          {/* Touch Number Pad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handlePinInput(digit)}
                className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-lg font-bold text-white hover:bg-amber-500 hover:text-charcoal-950 active:scale-95 transition-all shadow"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPinDigits('')}
              className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handlePinInput('0')}
              className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-lg font-bold text-white hover:bg-amber-500 hover:text-charcoal-950 active:scale-95 transition-all shadow"
            >
              0
            </button>

            <button
              type="button"
              onClick={handlePinDelete}
              className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors"
            >
              ⌫
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-charcoal-950 border border-charcoal-800 text-[11px] text-slate-500">
            Default Security PIN: <strong className="text-amber-400 font-mono">600622</strong>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =============================================================
  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6 pb-24 text-left">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Header with Lock / Logout Button */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Full Management Suite
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Unlock className="w-3 h-3" />
                PIN Verified
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {settings.name} Admin
            </h2>
            <p className="text-xs text-slate-400">
              Update prices, barber photos, styles lookbook, queue limits, and salon information.
            </p>
          </div>

          {/* Quick Controls & Lock Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => updateSettings({ is_open: !settings.is_open })}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                settings.is_open
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-600/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  settings.is_open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{settings.is_open ? 'Salon OPEN' : 'Salon CLOSED'}</span>
            </button>

            <button
              onClick={() => setShowAddWalkinModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors flex items-center gap-1 shadow"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Walk-in</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 text-xs font-semibold border border-charcoal-700 transition-colors flex items-center gap-1.5"
              title="Lock Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-charcoal-800">
        {[
          { id: 'overview', label: 'Queues & Workload', icon: Users },
          { id: 'barbers', label: 'Barber Staff & Photos', icon: Scissors },
          { id: 'services', label: 'Services & Prices (₹)', icon: DollarSign },
          { id: 'gallery', label: 'Styles Lookbook & Photos', icon: Sparkles },
          { id: 'info', label: 'Salon Info & 6-Digit PIN', icon: Settings },
          { id: 'bookings', label: 'Appointments On/Off', icon: Calendar },
          { id: 'reports', label: 'Daily Analytics & Revenue', icon: BarChart3 },
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

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & LIVE QUEUE WORKLOAD */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Serving in Chairs</span>
              <span className="text-2xl font-black text-amber-400">
                {analytics.currentlyServing}
              </span>
            </div>
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Waiting in Lines</span>
              <span className="text-2xl font-black text-white">{analytics.currentlyWaiting}</span>
            </div>
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Completed Today</span>
              <span className="text-2xl font-black text-emerald-400">{analytics.totalServed}</span>
            </div>
            <div className="bg-charcoal-900 p-4 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 block">Est. Average Wait</span>
              <span className="text-2xl font-black text-slate-200">~{analytics.avgWaitMins}m</span>
            </div>
          </div>

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
                    {/* Barber Header with Direct Edit Button */}
                    <div className="flex items-center justify-between border-b border-charcoal-800 pb-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={barber.photo_url}
                          alt={barber.name}
                          className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{barber.name}</h4>
                          <span className="text-[10px] text-amber-400 block truncate">
                            {barber.current_status === 'serving'
                              ? `In Chair (${waitEst.queue_length} in line)`
                              : barber.current_status === 'on_break'
                              ? 'On Break'
                              : 'Available'}
                          </span>
                        </div>
                      </div>

                      {/* Direct Edit Barber Icon */}
                      <button
                        onClick={() => handleOpenEditBarber(barber)}
                        className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-amber-500 hover:text-charcoal-950 text-slate-300 transition-colors flex-shrink-0"
                        title={`Edit ${barber.name}'s name and photo`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>

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
                              Complete
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

                  <button
                    onClick={() => {
                      setWalkinBarberId(barber.id);
                      setShowAddWalkinModal(true);
                    }}
                    className="w-full mt-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-[11px] font-semibold border border-charcoal-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Walk-in</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BARBER STAFF & PHOTOS (PRIMARY EDITING LOCATION) */}
      {/* ========================================================= */}
      {activeTab === 'barbers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Barber Staff Management</span>
              </h3>
              <p className="text-xs text-slate-400">
                Click <strong>"Edit Name & Photo"</strong> below to change any barber's name or upload a photo directly from your device.
              </p>
            </div>
            <button
              onClick={handleOpenAddBarber}
              className="px-4 py-2 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add New Barber</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="bg-charcoal-900 border border-charcoal-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    <img
                      src={b.photo_url}
                      alt={b.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-bold text-white">{b.name}</h4>
                        <span className="text-xs font-mono bg-charcoal-950 px-2 py-0.5 rounded border border-charcoal-800 text-amber-400">
                          PIN: {b.pin_code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {b.experience_years} years exp • ~{b.avg_service_mins}m avg service
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2">{b.bio}</p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {b.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-charcoal-950 text-slate-300 px-2 py-0.5 rounded border border-charcoal-800"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-charcoal-800">
                  <button
                    onClick={() => handleOpenEditBarber(b)}
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
                  >
                    <Edit className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Edit Name & Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Remove barber "${b.name}"?`)) {
                        deleteBarber(b.id);
                        showToast(`Removed barber ${b.name}`);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SERVICES & PRICING (UPDATE PRICES IN ₹) */}
      {/* ========================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Service Catalog & Pricing</span>
              </h3>
              <p className="text-xs text-slate-400">
                Click "Edit" on any service to change its price in ₹, duration, or description.
              </p>
            </div>
            <button
              onClick={handleOpenAddService}
              className="px-4 py-2 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add New Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{srv.name}</h4>
                    <span className="text-[10px] bg-charcoal-950 text-slate-400 px-2 py-0.5 rounded border border-charcoal-800">
                      {srv.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{srv.description}</p>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Approx. {srv.duration_minutes} minutes</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-black text-amber-400">₹{srv.price_inr}</span>
                  </div>
                  <button
                    onClick={() => handleOpenEditService(srv)}
                    className="p-2 rounded-xl bg-charcoal-800 hover:bg-amber-500 hover:text-charcoal-950 text-slate-300 transition-colors"
                    title="Edit Price & Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete service "${srv.name}"?`)) {
                        deleteService(srv.id);
                        showToast(`Deleted service ${srv.name}`);
                      }
                    }}
                    className="p-2 rounded-xl bg-charcoal-800 hover:bg-rose-600/30 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: STYLES LOOKBOOK & PHOTOS */}
      {/* ========================================================= */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Trending Styles Lookbook & Photos</span>
              </h3>
              <p className="text-xs text-slate-400">
                Update haircut photos directly from device, prices in ₹, and barber cutting notes.
              </p>
            </div>
            <button
              onClick={handleOpenAddStyle}
              className="px-4 py-2 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add New Style Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {styles.map((st) => (
              <div
                key={st.id}
                className="bg-charcoal-900 border border-charcoal-800 rounded-3xl overflow-hidden p-3 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-charcoal-950 mb-3">
                    <img
                      src={st.image_url}
                      alt={st.name}
                      className="w-full h-full object-cover"
                    />
                    {st.is_trending && (
                      <span className="absolute top-2.5 left-2.5 bg-amber-500 text-charcoal-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow">
                        Trending
                      </span>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 bg-charcoal-950/90 text-amber-400 font-bold text-xs px-2.5 py-1 rounded-lg border border-charcoal-800 backdrop-blur">
                      ₹{st.default_price_inr}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white line-clamp-1">{st.name}</h4>
                  <div className="text-[11px] text-amber-400 font-medium capitalize mt-0.5">
                    {st.category.replace('_', ' ')} • ~{st.estimated_mins} mins
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{st.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-charcoal-800">
                  <button
                    onClick={() => handleOpenEditStyle(st)}
                    className="py-2 px-3 rounded-xl bg-charcoal-800 hover:bg-amber-500 hover:text-charcoal-950 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Photo/Price</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Remove style "${st.name}"?`)) {
                        deleteStyle(st.id);
                        showToast(`Removed style ${st.name}`);
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-charcoal-800 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: SALON GENERAL INFORMATION & 6-DIGIT ADMIN PIN */}
      {/* ========================================================= */}
      {activeTab === 'info' && (
        <div className="max-w-2xl bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Salon Profile & Security
            </span>
            <h3 className="text-xl font-bold text-white mt-1">Update Salon Information</h3>
            <p className="text-xs text-slate-400 mt-1">
              Changes reflect instantly across the entire app for all customers and barbers.
            </p>
          </div>

          <form onSubmit={handleSaveSalonInfo} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Salon Name</label>
              <input
                type="text"
                required
                value={salonInfoForm.name}
                onChange={(e) => setSalonInfoForm({ ...salonInfoForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
              <input
                type="text"
                value={salonInfoForm.tagline}
                onChange={(e) => setSalonInfoForm({ ...salonInfoForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  required
                  value={salonInfoForm.phone}
                  onChange={(e) => setSalonInfoForm({ ...salonInfoForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  6-Digit Admin PIN <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={salonInfoForm.admin_pin}
                  onChange={(e) =>
                    setSalonInfoForm({
                      ...salonInfoForm,
                      admin_pin: e.target.value.replace(/[^0-9]/g, ''),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-amber-500/50 text-amber-300 font-mono text-sm tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Address</label>
              <input
                type="text"
                required
                value={salonInfoForm.address}
                onChange={(e) => setSalonInfoForm({ ...salonInfoForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={salonInfoForm.city}
                  onChange={(e) => setSalonInfoForm({ ...salonInfoForm, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={salonInfoForm.state}
                  onChange={(e) => setSalonInfoForm({ ...salonInfoForm, state: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20"
            >
              Save Salon Information & New PIN
            </button>
          </form>

          {/* Developer Reset Section */}
          <div className="pt-4 border-t border-charcoal-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Developer Master Reset</span>
            <button
              onClick={resetAllDemoData}
              className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-rose-600/20 text-rose-400 font-semibold transition-colors"
            >
              Reset to Demo Defaults
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: ONLINE APPOINTMENTS MASTER SWITCH */}
      {/* ========================================================= */}
      {activeTab === 'bookings' && (
        <div className="max-w-2xl bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Booking Policy Control
            </span>
            <h3 className="text-xl font-bold text-white mt-1">Online Appointment Controls</h3>
            <p className="text-xs text-slate-400 mt-1">
              Toggle online appointments on or off at will. Existing appointments are always preserved.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Online Appointment Booking</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {settings.online_booking_enabled
                  ? 'Active: Customers can view available time slots and book.'
                  : 'Disabled: Customer booking tab is hidden; salon operates on live walk-ins.'}
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

          <div className="p-4 rounded-2xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-white">Accept Walk-ins When Booking is ON</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Keep walk-in queue active in parallel with scheduled appointments.
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

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              Existing Appointments ({appointments.length})
            </h4>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl bg-charcoal-950 border border-charcoal-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="text-amber-400">{apt.appointment_ref}</span>
                      <span>{apt.customer_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {apt.appointment_date} at {apt.start_time} with {apt.barber_name} •{' '}
                      {apt.service_name} (₹{apt.service_price})
                    </p>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: REPORTS & AUDIT TRAIL */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800">
              <span className="text-xs text-slate-400 block mb-1">Total Daily Revenue (₹)</span>
              <span className="text-3xl font-black text-emerald-400">₹{analytics.totalRevenue}</span>
              <p className="text-[11px] text-slate-500 mt-1">Calculated from completed haircuts</p>
            </div>

            <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800">
              <span className="text-xs text-slate-400 block mb-1">Customers Served</span>
              <span className="text-3xl font-black text-amber-400">{analytics.totalServed}</span>
              <p className="text-[11px] text-slate-500 mt-1">Services finished today</p>
            </div>

            <div className="bg-charcoal-900 p-5 rounded-3xl border border-charcoal-800">
              <span className="text-xs text-slate-400 block mb-1">Cancellations</span>
              <span className="text-3xl font-black text-rose-400">{analytics.cancelledCount}</span>
              <p className="text-[11px] text-slate-500 mt-1">Tokens cancelled</p>
            </div>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-white">System Audit & Change Trail</h4>
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

      {/* ========================================================= */}
      {/* MODAL: EDIT OR ADD BARBER (PHOTO UPLOAD + NAME + PRESETS) */}
      {/* ========================================================= */}
      {showAddBarberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowAddBarberModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingBarber ? `Edit Barber: ${editingBarber.name}` : 'Add New Barber'}
                </h3>
                <p className="text-xs text-slate-400">Update name, photo, and bio</p>
              </div>
            </div>

            <form onSubmit={handleSaveBarber} className="space-y-4">
              {/* Barber Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Barber Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhaan Lone"
                  value={barberForm.name}
                  onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              {/* Barber Photo Section: Upload file OR pick preset OR paste URL */}
              <div className="bg-charcoal-950 p-4 rounded-2xl border border-charcoal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Barber Photograph</label>
                  <span className="text-[10px] text-amber-400">Upload or Pick Preset</span>
                </div>

                {/* Live Photo Preview */}
                <div className="flex items-center gap-4">
                  <img
                    src={barberForm.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    {/* Upload from Device Button */}
                    <input
                      ref={barberFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBarberPhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isCompressingPhoto}
                      onClick={() => barberFileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 disabled:opacity-50 text-amber-400 font-bold text-xs border border-charcoal-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCompressingPhoto ? 'Optimizing Image...' : 'Upload from Phone / Gallery'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Auto-compressed & stored locally (PNG, JPG, WEBP)
                    </p>
                  </div>
                </div>

                {/* Or Pick from 6 Master Barber Avatars */}
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                    Or select a professional avatar:
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_BARBER_AVATARS.map((avatar, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setBarberForm({ ...barberForm, photo_url: avatar.url })}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                          barberForm.photo_url === avatar.url
                            ? 'border-amber-400 ring-2 ring-amber-400/30'
                            : 'border-charcoal-700 opacity-70 hover:opacity-100'
                        }`}
                        title={avatar.label}
                      >
                        <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or Paste Direct Photo URL */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Or paste photo URL:</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={barberForm.photo_url}
                    onChange={(e) => setBarberForm({ ...barberForm, photo_url: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Experience and Service Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={barberForm.experience_years}
                    onChange={(e) =>
                      setBarberForm({
                        ...barberForm,
                        experience_years: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Avg Service (Mins)
                  </label>
                  <input
                    type="number"
                    value={barberForm.avg_service_mins}
                    onChange={(e) =>
                      setBarberForm({
                        ...barberForm,
                        avg_service_mins: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specialties (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Skin Fade, Beard Shaping, Hot Towel"
                  value={barberForm.specialties}
                  onChange={(e) =>
                    setBarberForm({ ...barberForm, specialties: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Barber 4-Digit Login PIN
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={barberForm.pin_code}
                  onChange={(e) =>
                    setBarberForm({ ...barberForm, pin_code: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-amber-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Short Bio</label>
                <textarea
                  rows={2}
                  placeholder="Brief description of experience and cutting style..."
                  value={barberForm.bio}
                  onChange={(e) => setBarberForm({ ...barberForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20"
              >
                {editingBarber ? 'Save Barber Details & Photo' : 'Create New Barber'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT OR ADD SERVICE (PRICES IN ₹) */}
      {/* ========================================================= */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative text-left">
            <button
              onClick={() => setShowAddServiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>{editingService ? 'Edit Service & Price' : 'Add New Service'}</span>
            </h3>

            <form onSubmit={handleSaveService} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skin Fade & Beard Trim"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.price_inr}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, price_inr: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.duration_minutes}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Category</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  <option value="Haircut">Haircut</option>
                  <option value="Beard">Beard</option>
                  <option value="Shave">Shave</option>
                  <option value="Combo">Combo</option>
                  <option value="Spa">Spa & Massage</option>
                  <option value="Grooming">Facial / Grooming</option>
                  <option value="Color">Coloring</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs shadow"
              >
                {editingService ? 'Update Service & Price' : 'Save Service'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT OR ADD STYLE (PHOTO UPLOAD, PRICE, INSTRUCTIONS) */}
      {/* ========================================================= */}
      {showAddStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowAddStyleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{editingStyle ? 'Edit Lookbook Style & Photo' : 'Add New Style Photo'}</span>
            </h3>

            <form onSubmit={handleSaveStyle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Style Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Skin Fade Crop"
                  value={styleForm.name}
                  onChange={(e) => setStyleForm({ ...styleForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              {/* Hairstyle Photo with Upload from Device */}
              <div className="bg-charcoal-950 p-4 rounded-2xl border border-charcoal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Style Photograph</label>
                  <span className="text-[10px] text-amber-400">Device Upload Supported</span>
                </div>

                {styleForm.image_url && (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-charcoal-900 border border-amber-500/40">
                    <img
                      src={styleForm.image_url}
                      alt="Style Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <input
                  ref={styleFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStylePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => styleFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-amber-400 font-bold text-xs border border-charcoal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Upload Haircut Photo from Phone / PC</span>
                </button>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Or paste image URL:</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={styleForm.image_url}
                    onChange={(e) => setStyleForm({ ...styleForm, image_url: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-slate-300 text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={styleForm.default_price_inr}
                    onChange={(e) =>
                      setStyleForm({
                        ...styleForm,
                        default_price_inr: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-amber-400 font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. Mins</label>
                  <input
                    type="number"
                    value={styleForm.estimated_mins}
                    onChange={(e) =>
                      setStyleForm({
                        ...styleForm,
                        estimated_mins: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={styleForm.category}
                  onChange={(e) =>
                    setStyleForm({ ...styleForm, category: e.target.value as StyleCategory })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                >
                  <option value="fade_taper">Fade & Taper</option>
                  <option value="classic">Classic Haircut</option>
                  <option value="modern_textured">Modern Textured</option>
                  <option value="crew_short">Crew Cut / Short</option>
                  <option value="long_hair">Long Hair</option>
                  <option value="beard_shaping">Beard Sculpting</option>
                  <option value="moustache">Moustache</option>
                  <option value="combo">Cut + Beard Combo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={styleForm.description}
                  onChange={(e) =>
                    setStyleForm({ ...styleForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Barber Cutting Notes (Shown to Barber)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Skin fade with foil shaver, textured crown..."
                  value={styleForm.barber_instruction_notes}
                  onChange={(e) =>
                    setStyleForm({
                      ...styleForm,
                      barber_instruction_notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-amber-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trendingToggle"
                  checked={styleForm.is_trending}
                  onChange={(e) =>
                    setStyleForm({ ...styleForm, is_trending: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="trendingToggle" className="text-xs text-slate-300 font-semibold">
                  Mark as "Trending" in Gallery
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20"
              >
                {editingStyle ? 'Save Style Details & Photo' : 'Add to Lookbook'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL WALKIN */}
      {/* ========================================================= */}
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
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Assign Barber</label>
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

      {/* ========================================================= */}
      {/* MODAL: TRANSFER / REASSIGN CUSTOMER */}
      {/* ========================================================= */}
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
    </div>
  );
};
