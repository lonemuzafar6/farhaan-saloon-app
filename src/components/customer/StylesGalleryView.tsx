import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Flame,
  Clock,
  Eye,
  CheckCircle,
  X,
  Share2,
  Scissors,
  Filter,
} from 'lucide-react';
import { useSaloon } from '../../context/SaloonContext';
import { HaircutStyle, StyleCategory } from '../../types';

interface StylesGalleryViewProps {
  onSelectStyleForQueue: (style: HaircutStyle) => void;
  onSelectStyleForBooking: (style: HaircutStyle) => void;
}

const CATEGORIES: { id: StyleCategory | 'all' | 'favorites'; label: string }[] = [
  { id: 'all', label: 'All Styles' },
  { id: 'favorites', label: 'My Saved' },
  { id: 'fade_taper', label: 'Fade & Taper' },
  { id: 'classic', label: 'Classic Cuts' },
  { id: 'modern_textured', label: 'Textured & Modern' },
  { id: 'crew_short', label: 'Crew & Short' },
  { id: 'long_hair', label: 'Long Hair' },
  { id: 'beard_shaping', label: 'Beard Sculpting' },
  { id: 'moustache', label: 'Moustache' },
  { id: 'combo', label: 'Cut & Beard Combos' },
];

export const StylesGalleryView: React.FC<StylesGalleryViewProps> = ({
  onSelectStyleForQueue,
  onSelectStyleForBooking,
}) => {
  const { styles, favorites, toggleFavorite, settings } = useSaloon();
  const [selectedCategory, setSelectedCategory] = useState<StyleCategory | 'all' | 'favorites'>('all');
  const [activeModalStyle, setActiveModalStyle] = useState<HaircutStyle | null>(null);

  const filteredStyles = styles.filter((style) => {
    if (selectedCategory === 'favorites') {
      return favorites.includes(style.id);
    }
    if (selectedCategory === 'all') return true;
    return style.category === selectedCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <Flame className="w-3 h-3" />
            2026 Trending Lookbook
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Haircut & Beard Styles
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
          Browse trending looks, tap <Heart className="w-3 h-3 inline text-amber-400 fill-amber-400" /> to save favorites, or tap any style to show exact reference instructions to your barber.
        </p>
      </div>

      {/* Filter Tabs Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-charcoal-950 shadow-md shadow-amber-500/20'
                  : 'bg-charcoal-900 text-slate-400 hover:text-white border border-charcoal-800'
              }`}
            >
              {cat.id === 'favorites' && <Heart className={`w-3 h-3 ${isActive ? 'fill-charcoal-950' : 'fill-amber-400 text-amber-400'}`} />}
              <span>{cat.label}</span>
              {cat.id === 'favorites' && (
                <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-charcoal-950/20 text-current">
                  {favorites.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredStyles.length === 0 && (
        <div className="text-center py-12 bg-charcoal-900 border border-charcoal-800 rounded-3xl p-8">
          <Heart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No Saved Styles Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            Tap the heart icon on any hairstyle or beard style to save it for your next salon visit.
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-charcoal-950 font-bold text-xs"
          >
            Browse All Styles
          </button>
        </div>
      )}

      {/* Styles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStyles.map((style) => {
          const isFav = favorites.includes(style.id);

          return (
            <div
              key={style.id}
              className="bg-charcoal-900 border border-charcoal-800 hover:border-amber-500/40 rounded-3xl overflow-hidden shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-950 cursor-pointer" onClick={() => setActiveModalStyle(style)}>
                  <img
                    src={style.image_url}
                    alt={style.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-transparent to-black/30" />

                  {/* Trending Pill */}
                  {style.is_trending && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-amber-500/90 text-charcoal-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full shadow backdrop-blur">
                      <Flame className="w-3 h-3" />
                      Trending
                    </span>
                  )}

                  {/* Favorite Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(style.id);
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                      isFav
                        ? 'bg-amber-500 text-charcoal-950'
                        : 'bg-black/50 text-white hover:text-amber-400'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Save style'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Price & Duration overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-white bg-charcoal-950/80 px-2 py-1 rounded-md backdrop-blur border border-charcoal-800">
                      ₹{style.default_price_inr}
                    </span>
                    <span className="text-slate-300 bg-charcoal-950/80 px-2 py-1 rounded-md backdrop-blur border border-charcoal-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      ~{style.estimated_mins} mins
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3
                    onClick={() => setActiveModalStyle(style)}
                    className="text-base font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {style.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {style.description}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveModalStyle(style)}
                  className="py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-charcoal-700"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Show Barber</span>
                </button>

                <button
                  onClick={() => onSelectStyleForQueue(style)}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Scissors className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Select Look</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL-SCREEN REFERENCE MODAL (Show to Barber) */}
      {activeModalStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl relative text-left">
            <button
              onClick={() => setActiveModalStyle(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-charcoal-950/80 text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* High-Res Reference Photo */}
            <div className="relative aspect-[4/3] bg-charcoal-950">
              <img
                src={activeModalStyle.image_url}
                alt={activeModalStyle.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-amber-500 text-charcoal-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow">
                  Barber Reference Visual
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-xl font-bold text-white">{activeModalStyle.name}</h3>
                  <div className="text-xs text-amber-400 font-medium mt-0.5">
                    Estimated Time: ~{activeModalStyle.estimated_mins} mins • Price: ₹{activeModalStyle.default_price_inr}
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(activeModalStyle.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    favorites.includes(activeModalStyle.id)
                      ? 'bg-amber-500 text-charcoal-950'
                      : 'bg-charcoal-800 text-slate-400 hover:text-white'
                  }`}
                  title="Favorite"
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(activeModalStyle.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {activeModalStyle.description}
              </p>

              {/* Technical Barber Cutting Instructions */}
              <div className="bg-charcoal-950 rounded-2xl p-4 border border-amber-500/20 mb-5">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  Barber Cutting Notes:
                </h4>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{activeModalStyle.barber_instruction_notes || 'Consult with customer on side taper height and preferred crown length.'}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const styleToSelect = activeModalStyle;
                    setActiveModalStyle(null);
                    onSelectStyleForQueue(styleToSelect);
                  }}
                  className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Scissors className="w-4 h-4 stroke-[2.5]" />
                  <span>Join Queue with This Look</span>
                </button>

                {settings.online_booking_enabled ? (
                  <button
                    onClick={() => {
                      const styleToSelect = activeModalStyle;
                      setActiveModalStyle(null);
                      onSelectStyleForBooking(styleToSelect);
                    }}
                    className="py-3 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold text-xs border border-charcoal-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveModalStyle(null)}
                    className="py-3 rounded-xl bg-charcoal-800 text-slate-300 font-semibold text-xs border border-charcoal-700"
                  >
                    Close Lookbook
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
