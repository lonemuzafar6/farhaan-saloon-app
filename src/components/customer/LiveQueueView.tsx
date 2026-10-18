import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Ticket,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Share2,
  XCircle,
  Copy,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Flame,
  ArrowRight,
  QrCode,
} from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { calculateBarberWaitTime, calculateQueuePosition } from '../../lib/queueAlgorithm';
import { Barber, HaircutStyle } from '../../types';

interface LiveQueueViewProps {
  onSelectBarberTab: () => void;
  onSelectStylesTab: () => void;
  preselectedStyle?: HaircutStyle | null;
  onClearPreselectedStyle?: () => void;
}

export const LiveQueueView: React.FC<LiveQueueViewProps> = ({
  onSelectBarberTab,
  onSelectStylesTab,
  preselectedStyle,
  onClearPreselectedStyle,
}) => {
  const {
    settings,
    barbers,
    services,
    styles,
    queues,
    appointments,
    activeCustomerQueueEntry,
    joinQueue,
    cancelToken,
  } = useSaloon();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null); // null = Any Available
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(services[0]?.id || null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(preselectedStyle?.id || null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // If a preselected style comes from the styles gallery, open modal automatically
  React.useEffect(() => {
    if (preselectedStyle) {
      setSelectedStyleId(preselectedStyle.id);
      setShowJoinModal(true);
    }
  }, [preselectedStyle]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    try {
      const entry = joinQueue({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        barberId: selectedBarberId,
        serviceId: selectedServiceId,
        styleId: selectedStyleId,
      });

      setShowJoinModal(false);
      setCustomerName('');
      setCustomerPhone('');
      if (onClearPreselectedStyle) onClearPreselectedStyle();

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(`Could not join queue: ${errMsg}`);
    }
  };

  const currentToken = activeCustomerQueueEntry;
  const positionDetails = currentToken ? calculateQueuePosition(currentToken, queues) : null;
  const assignedBarber = currentToken ? barbers.find((b) => b.id === currentToken.barber_id) : null;

  const tokenShareUrl = currentToken
    ? `${window.location.origin}/?token=${currentToken.secure_token}`
    : '';

  const handleCopyLink = () => {
    if (tokenShareUrl) {
      navigator.clipboard.writeText(tokenShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    if (!currentToken) return;
    const text = encodeURIComponent(
      `Here is my live queue token #${currentToken.token_number} at Farhaan Men's Saloon! Check real-time waiting status: ${tokenShareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Operating Status Notices */}
      {!settings.is_open ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-white">Saloon is Currently Closed</h3>
            <p className="text-xs text-rose-200/80 mt-1">
              Farhaan Men's Saloon operating hours are 9:00 AM - 9:00 PM. Please check back during business hours to grab your token.
            </p>
          </div>
        </div>
      ) : settings.is_queue_paused ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
          <Clock className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-white">Live Queue is Temporarily Paused</h3>
            <p className="text-xs text-amber-200/80 mt-1">
              Barbers are finishing the current queue backlog. New tokens will resume shortly.
            </p>
          </div>
        </div>
      ) : null}

      {/* ACTIVE TOKEN HERO CARD (If customer holds a token) */}
      {currentToken && positionDetails && (
        <div className="bg-gradient-to-b from-charcoal-900 to-charcoal-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-charcoal-800 pb-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                Live Saloon Token
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                <span>{currentToken.token_number}</span>
                {currentToken.status === 'in_service' && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    In Chair Now!
                  </span>
                )}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Queue Position</span>
              <span className="text-2xl font-bold text-amber-400">
                {currentToken.status === 'in_service'
                  ? 'Serving Now'
                  : `#${positionDetails.position} in line`}
              </span>
            </div>
          </div>

          {/* Key Queue Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-charcoal-950/80 p-3 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Est. Waiting Time
              </span>
              <div className="text-base sm:text-lg font-bold text-white">
                {currentToken.status === 'in_service'
                  ? 'In Progress'
                  : `${positionDetails.estimatedWaitRange.min} - ${positionDetails.estimatedWaitRange.max} mins`}
              </div>
            </div>

            <div className="bg-charcoal-950/80 p-3 rounded-2xl border border-charcoal-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Ahead of You
              </span>
              <div className="text-base sm:text-lg font-bold text-white">
                {currentToken.status === 'in_service'
                  ? '0 (You are next)'
                  : `${positionDetails.peopleAhead} ${
                      positionDetails.peopleAhead === 1 ? 'customer' : 'customers'
                    }`}
              </div>
            </div>
          </div>

          {/* Assigned Barber Profile & Service */}
          <div className="bg-charcoal-900/90 rounded-2xl p-4 border border-charcoal-800 flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <img
                src={assignedBarber?.photo_url}
                alt={assignedBarber?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40"
              />
              <div>
                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">
                  Your Barber
                </span>
                <h4 className="text-sm font-bold text-white">{assignedBarber?.name || currentToken.barber_name}</h4>
                <p className="text-xs text-slate-400">{currentToken.service_name}</p>
              </div>
            </div>

            {currentToken.style_image && (
              <div className="text-right flex items-center gap-2">
                <img
                  src={currentToken.style_image}
                  alt={currentToken.style_name || 'Haircut reference'}
                  className="w-11 h-11 rounded-lg object-cover border border-amber-500/30"
                  title="Your reference hairstyle"
                />
              </div>
            )}
          </div>

          {/* Digital QR Code for Fast In-Saloon Check-in */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-charcoal-950/90 p-4 rounded-2xl border border-charcoal-800 mb-5">
            <div className="p-2 bg-white rounded-xl shadow">
              <QRCodeSVG
                value={tokenShareUrl || currentToken.token_number}
                size={100}
                level="M"
              />
            </div>
            <div className="text-center sm:text-left">
              <h5 className="text-xs font-bold text-white mb-1">Show this QR Code at the Counter</h5>
              <p className="text-[11px] text-slate-400 mb-2">
                When you arrive at Farhaan Men's Saloon, your barber can scan this code to call you immediately.
              </p>
              <div className="text-[10px] font-mono text-slate-400">
                Holder: <strong className="text-slate-200">{currentToken.customer_name}</strong>
              </div>
            </div>
          </div>

          {/* Sharing and Token Recovery Actions */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 text-xs font-semibold border border-charcoal-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Status Link'}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share to WhatsApp</span>
            </button>
          </div>

          {/* Cancel Token Control */}
          {!confirmCancel ? (
            <button
              onClick={() => setConfirmCancel(true)}
              className="w-full text-center py-2 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Cancel my token
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
              <p className="text-xs text-rose-300">Are you sure you want to give up your position?</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => cancelToken(currentToken.secure_token)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Yes, Cancel Token
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-slate-300 text-xs font-medium"
                >
                  Keep My Place
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IF CUSTOMER DOES NOT HOLD A TOKEN: JOIN QUEUE SECTIONS */}
      {!currentToken && (
        <div className="space-y-5">
          {/* Welcome & Fast Entry Hero */}
          <div className="bg-gradient-to-br from-charcoal-900 via-charcoal-900 to-amber-950/40 border border-charcoal-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 mb-2">
                  <Flame className="w-3 h-3" />
                  Instant Queue • No App Required
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Skip the Waiting Room
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md leading-relaxed">
                  Join Farhaan Men's Saloon live queue online or by scanning our QR code. Choose your favourite barber or get the fastest available chair.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedBarberId(null);
                  setShowJoinModal(true);
                }}
                disabled={!settings.is_open || settings.is_queue_paused}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-charcoal-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Ticket className="w-4 h-4 stroke-[2.5]" />
                <span>Join Live Queue Now</span>
              </button>
            </div>
          </div>

          {/* Quick Choice: Fastest Barber vs Favourite Barber */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>Choose Your Barber or Fastest Chair</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time calculated waiting times based on current in-chair services
                </p>
              </div>
              <button
                onClick={onSelectBarberTab}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5"
              >
                <span>View Profiles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Any Available Barber Quick Card */}
            <div
              onClick={() => {
                setSelectedBarberId(null);
                setShowJoinModal(true);
              }}
              className="cursor-pointer bg-gradient-to-r from-charcoal-900 to-charcoal-850 hover:to-charcoal-800 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl p-4 mb-3 transition-all shadow-md group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Any Available Barber</h4>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.2 rounded font-medium border border-emerald-500/20">
                        Fastest Turnaround
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automatically assigns you to the barber with earliest availability
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-400 block">Est. Wait</span>
                    <span className="text-xs font-bold text-emerald-400">~10 - 20 mins</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-charcoal-800 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-charcoal-950 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Barbers Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {barbers.map((barber) => {
                const estimate = calculateBarberWaitTime(barber, queues, appointments);
                const isServing = barber.current_status === 'serving';
                const isBreak = barber.current_status === 'on_break';

                return (
                  <div
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarberId(barber.id);
                      setShowJoinModal(true);
                    }}
                    className="cursor-pointer bg-charcoal-900/90 hover:bg-charcoal-850 border border-charcoal-800 hover:border-amber-500/40 rounded-2xl p-3.5 transition-all shadow group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={barber.photo_url}
                          alt={barber.name}
                          className="w-12 h-12 rounded-xl object-cover border border-charcoal-700 group-hover:border-amber-500/50 transition-colors"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                              {barber.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isServing ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Serving ({estimate.queue_length} in queue)
                              </span>
                            ) : isBreak ? (
                              <span className="text-[10px] text-slate-400">On Short Break</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Chair Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Est. Wait</span>
                        <span className="text-xs font-bold text-amber-400">
                          {estimate.min_wait_mins}-{estimate.max_wait_mins}m
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Styles Callout Banner */}
          <div className="bg-charcoal-900/80 border border-charcoal-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Trending Haircuts & Beard Styles
                </h4>
                <p className="text-[11px] text-slate-400">
                  Explore skin fades, textured crops & royal beards. Show reference photos directly to your barber!
                </p>
              </div>
            </div>

            <button
              onClick={onSelectStylesTab}
              className="px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <span>View Gallery</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* In-Store Counter Standee & QR Pass */}
          <div className="bg-charcoal-900/60 border border-charcoal-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-300 truncate">Visiting Farhaan Men's Saloon?</p>
                <p className="text-[11px] text-slate-400 truncate">Scan our counter QR code or open printable standee</p>
              </div>
            </div>
            <a
              href="/counter-standee.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[11px] flex-shrink-0 bg-charcoal-850 px-2.5 py-1.5 rounded-lg border border-charcoal-700"
            >
              <span>View Standee</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* JOIN QUEUE MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowJoinModal(false);
                if (onClearPreselectedStyle) onClearPreselectedStyle();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Join Farhaan Saloon Queue</h3>
                <p className="text-xs text-slate-400">Get your digital token instantly</p>
              </div>
            </div>

            {/* If style preselected from gallery */}
            {selectedStyleId && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                {styles.find((s) => s.id === selectedStyleId)?.image_url && (
                  <img
                    src={styles.find((s) => s.id === selectedStyleId)?.image_url}
                    alt="Style"
                    className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
                  />
                )}
                <div className="flex-1">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                    Requested Style Reference
                  </span>
                  <div className="text-xs font-bold text-white">
                    {styles.find((s) => s.id === selectedStyleId)?.name}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    ₹{styles.find((s) => s.id === selectedStyleId)?.default_price_inr} •{' '}
                    {styles.find((s) => s.id === selectedStyleId)?.estimated_mins} mins
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStyleId(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Change
                </button>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Ahmad"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Customer Phone (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number <span className="text-slate-500 font-normal">(Optional for SMS alert)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Barber Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Barber
                </label>
                <select
                  value={selectedBarberId || 'any'}
                  onChange={(e) =>
                    setSelectedBarberId(e.target.value === 'any' ? null : e.target.value)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="any">⚡ Any Available Barber (Fastest Service)</option>
                  {barbers.map((b) => {
                    const est = calculateBarberWaitTime(b, queues, appointments);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.specialties[0]}) • Est. {est.min_wait_mins}-{est.max_wait_mins}m
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Requested Service
                </label>
                <select
                  value={selectedServiceId || ''}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-950 border border-charcoal-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — ₹{s.price_inr} ({s.duration_minutes}m)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Issue My Token</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
