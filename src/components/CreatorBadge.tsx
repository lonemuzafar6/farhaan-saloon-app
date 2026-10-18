import React, { useState } from 'react';
import { Phone, MessageSquare, Sparkles, Award, ShieldCheck, X } from 'lucide-react';
import { useSaloon } from '../context/SaloonContext';

export const CreatorBadge: React.FC = () => {
  const { settings } = useSaloon();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {/* Sleek App Creator Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-charcoal-900 to-amber-950/80 border-y border-amber-500/20 px-3 py-2 text-xs text-amber-200">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-300 font-medium">App Creator:</span>
            <span className="font-bold text-amber-300 tracking-wide">{settings.creator_name}</span>
            <span className="hidden sm:inline text-amber-400/60">•</span>
            <span className="hidden sm:inline text-slate-400">Custom Smart Queue & PWA Solutions</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${settings.creator_phone}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors font-medium text-xs"
              title="Call Creator"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>{settings.creator_phone}</span>
            </a>

            <button
              onClick={() => setShowModal(true)}
              className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold transition-all text-xs shadow-sm hover:shadow"
            >
              Get App for Your Business
            </button>
          </div>
        </div>
      </div>

      {/* Creator Ad & Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-charcoal-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Verified Software Architect</span>
                <h3 className="text-lg font-bold text-white">{settings.creator_name}</h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
              Transform your business with a tailor-made <strong>Smart Queue & Booking PWA</strong>. Ideal for:
            </p>

            <ul className="space-y-2 mb-5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Salons, Barbershops & Beauty Parlours</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Doctors, Dental & Aesthetic Clinics</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Automobile Detailing & Service Centers</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Zero customer app installs • Instant QR Code check-in</span>
              </li>
            </ul>

            <div className="bg-charcoal-950/70 rounded-xl p-3 border border-charcoal-800 mb-5">
              <div className="text-xs text-slate-400 mb-1">Direct Developer Helpline:</div>
              <div className="text-base font-bold text-amber-400 flex items-center justify-between">
                <span>{settings.creator_phone}</span>
                <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Available on Call & WhatsApp</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={`tel:${settings.creator_phone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold text-sm transition-colors border border-charcoal-700"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Call Now</span>
              </a>

              <a
                href={`https://wa.me/${settings.creator_phone.replace(/[^0-9]/g, '')}?text=Hello%20Dr.%20Mohd%20Muzzafar%20Lone,%20I%20am%20interested%20in%20a%20Smart%20Queue%20%26%20Appointment%20App%20for%20my%20business.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-900/30"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
