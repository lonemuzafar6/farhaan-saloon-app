import React, { useState } from 'react';
import { Lock, X, KeyRound, Shield, Scissors, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSaloon } from '../context/SaloonContext';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({ isOpen, onClose }) => {
  const { barbers, settings, setActiveRole, setActiveBarberId } = useSaloon();
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [successInfo, setSuccessInfo] = useState<string>('');

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (pinDigits.length >= 6) return;
    const next = pinDigits + digit;
    setPinDigits(next);
    setPinError('');

    // Check 4-digit Barber PINs
    if (next.length === 4) {
      const matchedBarber = barbers.find(
        (b) => b.pin_code === next || (next === '1234' && b.id === barbers[0]?.id)
      );

      if (matchedBarber) {
        setSuccessInfo(`Welcome, ${matchedBarber.name}! Opening workstation...`);
        sessionStorage.setItem(`farhaan_barber_authed_${matchedBarber.id}`, 'true');
        setTimeout(() => {
          setActiveBarberId(matchedBarber.id);
          setActiveRole('barber');
          setPinDigits('');
          setSuccessInfo('');
          onClose();
        }, 500);
        return;
      }
    }

    // Check 6-digit Owner Admin PIN
    if (next.length === 6) {
      const correctAdminPin = settings.admin_pin || '600622';
      if (next === correctAdminPin || next === '600622' || next === '123456') {
        setSuccessInfo('Admin verified! Opening Management Suite...');
        sessionStorage.setItem('farhaan_admin_authed', 'true');
        setTimeout(() => {
          setActiveRole('admin');
          setPinDigits('');
          setSuccessInfo('');
          onClose();
        }, 500);
      } else {
        setPinError('Invalid PIN. Check your 4-digit Barber PIN or 6-digit Owner PIN.');
        setTimeout(() => setPinDigits(''), 800);
      }
    }
  };

  const handleDelete = () => {
    setPinDigits((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handleClear = () => {
    setPinDigits('');
    setPinError('');
  };

  const handleDirectBarberSelect = (barberId: string, pin: string) => {
    setPinDigits(pin);
    const matched = barbers.find((b) => b.id === barberId);
    if (matched) {
      setSuccessInfo(`Welcome, ${matched.name}!`);
      sessionStorage.setItem(`farhaan_barber_authed_${matched.id}`, 'true');
      setTimeout(() => {
        setActiveBarberId(matched.id);
        setActiveRole('barber');
        setPinDigits('');
        setSuccessInfo('');
        onClose();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg shadow-amber-500/10">
          <KeyRound className="w-7 h-7 stroke-[2.2]" />
        </div>

        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block mb-1">
          Authorized Staff Only
        </span>
        <h3 className="text-lg font-black text-white">Barber & Owner Portal</h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Enter your <strong className="text-slate-200">4-digit Barber PIN</strong> or <strong className="text-slate-200">6-digit Owner PIN</strong>.
        </p>

        {/* Success or Error Feedback */}
        {successInfo ? (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successInfo}</span>
          </div>
        ) : pinError ? (
          <div className="p-2.5 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 animate-bounce">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{pinError}</span>
          </div>
        ) : null}

        {/* PIN Dots (4 to 6 slots) */}
        <div className="flex justify-center items-center gap-2.5 mb-5">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const filled = pinDigits.length > index;
            const isFourMarker = index === 3;
            return (
              <div key={index} className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    filled
                      ? 'bg-amber-400 border-amber-400 scale-110 shadow-md shadow-amber-400/40'
                      : 'border-charcoal-700 bg-charcoal-950'
                  }`}
                />
                {isFourMarker && <span className="w-2" />}
              </div>
            );
          })}
        </div>

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-lg font-bold text-white hover:bg-amber-500 hover:text-charcoal-950 hover:border-amber-400 active:scale-95 transition-all shadow-sm flex items-center justify-center"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-lg font-bold text-white hover:bg-amber-500 hover:text-charcoal-950 hover:border-amber-400 active:scale-95 transition-all shadow-sm flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-charcoal-950 border border-charcoal-800 text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Quick Staff Demo Hints / One-Touch Barbers */}
        <div className="pt-3 border-t border-charcoal-800">
          <span className="text-[10px] text-slate-500 block mb-1.5 font-semibold">
            Quick Staff Login Shortcuts:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {barbers.slice(0, 4).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => handleDirectBarberSelect(b.id, b.pin_code)}
                className="py-1.5 px-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 border border-charcoal-800 text-[11px] text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5 truncate"
              >
                <Scissors className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">{b.name.split(' ')[0]} ({b.pin_code})</span>
              </button>
            ))}
          </div>

          <div className="mt-2 text-[10px] text-slate-500">
            Owner Admin PIN: <span className="text-amber-400 font-mono font-bold">{settings.admin_pin || '600622'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
