import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Phone,
  FileText,
} from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { isSlotAvailable } from '../../lib/queueAlgorithm';
import { Barber, HaircutStyle, Appointment } from '../../types';

interface AppointmentBookingViewProps {
  onGoToQueue: () => void;
  preselectedStyle?: HaircutStyle | null;
}

export const AppointmentBookingView: React.FC<AppointmentBookingViewProps> = ({
  onGoToQueue,
  preselectedStyle,
}) => {
  const { settings, barbers, services, styles, appointments, bookAppointment, cancelAppointment } =
    useSaloon();

  // If online booking is disabled by the owner
  if (!settings.online_booking_enabled) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-center text-amber-500 mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Online Appointments Paused</h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
          Farhaan Men's Saloon is currently operating exclusively on live walk-ins to serve all customers with zero wait delays.
        </p>
        <button
          onClick={onGoToQueue}
          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
        >
          Join Walk-in Queue Instead
        </button>
      </div>
    );
  }

  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(
    preselectedStyle?.id || null
  );
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barbers[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [confirmedApt, setConfirmedApt] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Generate next 7 available dates
  const availableDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      list.push({ iso, dayName, dateNum });
    }
    return list;
  }, []);

  const chosenService = services.find((s) => s.id === selectedServiceId) || services[0];
  const chosenBarber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];
  const chosenStyle = styles.find((s) => s.id === selectedStyleId);

  // Generate genuine 30-min time slots from 09:30 AM to 08:30 PM (20:30)
  const availableSlots = useMemo(() => {
    const slots = [];
    const startHour = 9;
    const endHour = 20;

    for (let h = startHour; h <= endHour; h++) {
      for (const m of [0, 30]) {
        if (h === endHour && m > 30) continue;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        // Check genuine availability
        const isFree = isSlotAvailable(
          selectedBarberId,
          selectedDate,
          timeStr,
          chosenService?.duration_minutes || 30,
          appointments
        );

        slots.push({
          timeStr,
          display: new Date(`2000-01-01T${timeStr}:00`).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          isFree,
        });
      }
    }
    return slots;
  }, [selectedBarberId, selectedDate, chosenService, appointments]);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!selectedSlot) {
      setBookingError('Please choose an available appointment time slot.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setBookingError('Please provide your name and phone number for booking confirmation.');
      return;
    }

    try {
      const apt = bookAppointment({
        barberId: selectedBarberId,
        serviceId: selectedServiceId,
        styleId: selectedStyleId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        notes: notes.trim() || undefined,
      });

      setConfirmedApt(apt);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setBookingError(errMsg);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (confirmedApt) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 text-left space-y-5 pb-24">
        <div className="bg-charcoal-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
            Appointment Confirmed
          </span>
          <h2 className="text-2xl font-black text-white mt-0.5">
            Ref: {confirmedApt.appointment_ref}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            We have reserved your appointment with <strong>{confirmedApt.barber_name}</strong>.
          </p>

          <div className="bg-charcoal-950 rounded-2xl p-4 border border-charcoal-800 space-y-2.5 my-5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <strong className="text-white">
                {confirmedApt.appointment_date} at {confirmedApt.start_time}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Barber:</span>
              <strong className="text-amber-400">{confirmedApt.barber_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service:</span>
              <strong className="text-white">{confirmedApt.service_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Price:</span>
              <strong className="text-white">₹{confirmedApt.service_price} (Pay at Salon)</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Customer:</span>
              <span className="text-slate-300">
                {confirmedApt.customer_name} ({confirmedApt.customer_phone})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed mb-5">
            <strong>Arrival Policy:</strong> Please arrive 5 minutes prior to your time. If you run late, kindly inform the salon directly at {settings.phone}.
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `Appointment ${confirmedApt.appointment_ref} at Farhaan Men's Saloon on ${confirmedApt.appointment_date} at ${confirmedApt.start_time} with ${confirmedApt.barber_name}.`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-colors shadow"
            >
              Share via WhatsApp
            </button>

            <button
              onClick={() => {
                setConfirmedApt(null);
                setSelectedSlot(null);
              }}
              className="py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 font-semibold text-xs text-center border border-charcoal-700 transition-colors"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6 pb-24 text-left">
      {/* Title */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
          Reserved Chair Booking
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Book an Appointment
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select your barber and a guaranteed time slot. No online pre-payment required.
        </p>
      </div>

      {bookingError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Step 1: Barber Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            1. Select Master Barber
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {barbers.map((b) => {
              const isSelected = selectedBarberId === b.id;
              return (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => {
                    setSelectedBarberId(b.id);
                    setSelectedSlot(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-charcoal-900 border-charcoal-800 text-slate-400 hover:border-charcoal-700'
                  }`}
                >
                  <img
                    src={b.photo_url}
                    alt={b.name}
                    className="w-12 h-12 rounded-xl object-cover mb-2 border border-charcoal-700"
                  />
                  <span className="text-xs font-bold text-white leading-tight">{b.name}</span>
                  <span className="text-[10px] text-amber-400 mt-0.5">{b.specialties[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Service Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            2. Choose Service & Duration
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => {
              setSelectedServiceId(e.target.value);
              setSelectedSlot(null);
            }}
            className="w-full px-4 py-3 rounded-2xl bg-charcoal-900 border border-charcoal-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — ₹{s.price_inr} (~{s.duration_minutes} mins)
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Date Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            3. Choose Appointment Date
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {availableDates.map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <button
                  type="button"
                  key={d.iso}
                  onClick={() => {
                    setSelectedDate(d.iso);
                    setSelectedSlot(null);
                  }}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-charcoal-950 font-bold border-amber-400 shadow'
                      : 'bg-charcoal-900 text-slate-400 border-charcoal-800 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] uppercase block tracking-wider">{d.dayName}</span>
                  <span className="text-xs font-bold block">{d.dateNum}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Available Genuine Time Slots */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            4. Choose Available Time Slot
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot === slot.timeStr;
              return (
                <button
                  type="button"
                  key={slot.timeStr}
                  disabled={!slot.isFree}
                  onClick={() => setSelectedSlot(slot.timeStr)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-charcoal-950 shadow-md ring-2 ring-amber-400'
                      : slot.isFree
                      ? 'bg-charcoal-900 border border-charcoal-800 text-slate-200 hover:border-amber-500/50'
                      : 'bg-charcoal-950 text-slate-600 border border-charcoal-850 line-through cursor-not-allowed opacity-50'
                  }`}
                >
                  {slot.display}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 5: Customer Details */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            5. Customer Contact Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Farooq Lone"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone Number (Required) *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Grooming Notes / Requests (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Wedding grooming, skin fade, or sensitive skin"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Price & Summary */}
        <div className="bg-charcoal-950 rounded-2xl p-4 border border-charcoal-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Total Due at Salon</span>
            <span className="text-lg font-bold text-white">₹{chosenService.price_inr}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Barber & Duration</span>
            <span className="text-xs font-semibold text-amber-400">
              {chosenBarber.name} (~{chosenService.duration_minutes}m)
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Confirm Online Appointment</span>
        </button>
      </form>
    </div>
  );
};
