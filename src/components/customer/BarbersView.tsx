import React, { useState } from 'react';
import { Clock, Scissors, Award, Heart, Check, Users, ChevronRight, Sparkles } from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { calculateBarberWaitTime } from '../../lib/queueAlgorithm';
import { Barber } from '../../types';

interface BarbersViewProps {
  onJoinQueueForBarber: (barberId: string) => void;
}

export const BarbersView: React.FC<BarbersViewProps> = ({ onJoinQueueForBarber }) => {
  const { barbers, services, queues, appointments } = useSaloon();
  const [favoriteBarberId, setFavoriteBarberId] = useState<string | null>(() => {
    return localStorage.getItem('farhaan_fav_barber') || null;
  });

  const handleToggleFavorite = (barberId: string) => {
    if (favoriteBarberId === barberId) {
      setFavoriteBarberId(null);
      localStorage.removeItem('farhaan_fav_barber');
    } else {
      setFavoriteBarberId(barberId);
      localStorage.setItem('farhaan_fav_barber', barberId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
            Farhaan Men's Saloon Team
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Master Barbers & Stylists
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pick your preferred barber. Real-time wait ranges update automatically as customers are served.
        </p>
      </div>

      {/* Barbers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {barbers.map((barber) => {
          const waitEst = calculateBarberWaitTime(barber, queues, appointments);
          const isFavorite = favoriteBarberId === barber.id;
          const isServing = barber.current_status === 'serving';
          const isBreak = barber.current_status === 'on_break';
          const isUnavailable = barber.current_status === 'unavailable';

          return (
            <div
              key={barber.id}
              className={`bg-charcoal-900 border rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                isFavorite
                  ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'border-charcoal-800 hover:border-charcoal-700'
              }`}
            >
              <div>
                {/* Top Bar: Status & Favorite Heart */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={barber.photo_url}
                      alt={barber.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-white">{barber.name}</h3>
                        {isFavorite && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                            Your Favourite
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-400 font-medium mt-0.5">
                        {barber.experience_years}+ Years Experience
                      </p>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Avg Service: ~{barber.avg_service_mins} mins</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFavorite(barber.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      isFavorite
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-charcoal-800 text-slate-500 hover:text-amber-400'
                    }`}
                    title={isFavorite ? 'Remove from favourites' : 'Mark as favourite barber'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Barber Bio */}
                <p className="text-xs text-slate-300 mb-4 leading-relaxed line-clamp-2">
                  {barber.bio}
                </p>

                {/* Specialties */}
                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                    Specialties:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {barber.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-charcoal-950 text-slate-300 border border-charcoal-800 px-2.5 py-0.5 rounded-lg"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Real-time Status & Queue Indicator Box */}
                <div className="bg-charcoal-950 rounded-2xl p-3 border border-charcoal-800 grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Current Status</span>
                    <div className="mt-0.5">
                      {isServing ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          In Chair
                        </span>
                      ) : isBreak ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          Short Break
                        </span>
                      ) : isUnavailable ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                          Unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Available Now
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">Est. Wait & Queue</span>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {isUnavailable ? (
                        'Closed'
                      ) : (
                        <span className="text-amber-400">
                          {waitEst.min_wait_mins}-{waitEst.max_wait_mins}m ({waitEst.queue_length} ahead)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onJoinQueueForBarber(barber.id)}
                disabled={isUnavailable}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-charcoal-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
              >
                <Scissors className="w-4 h-4 stroke-[2.5]" />
                <span>Join {barber.name.split(' ')[0]}'s Queue</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
