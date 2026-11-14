import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, Save, Utensils } from 'lucide-react';
import { tiffinMealsStorage, IDailyCurryBoard } from '../../services/tiffinMealsStorage';

interface DailyCurryBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
  restaurantName?: string;
}

const DAL_SUGGESTIONS = [
  'Tomato Pappu',
  'Palak Pappu',
  'Dosakaya Pappu',
  'Gongura Pappu',
  'Pappu Charu',
  'Methi Pappu',
  'Raw Mango Pappu',
];

const FRY_SUGGESTIONS = [
  'Bendakaya Fry (Okra)',
  'Dondakaya Fry (Ivy Gourd)',
  'Aloo Fry',
  'Aratikaya Fry (Raw Banana)',
  'Cabbage Carrot Poriyal',
  'Beetroot Fry',
];

const GRAVY_SUGGESTIONS = [
  'Aloo Kurma',
  'Gutti Vankaya (Stuffed Brinjal)',
  'Paneer Butter Masala',
  'Chole / Chana Masala',
  'Capsicum Tomato Gravy',
  'Veg Korma',
];

const SWEET_SUGGESTIONS = [
  'Semiya Payasam',
  'Gulab Jamun',
  'Mysore Pak',
  'Rava Kesari',
  'Double Ka Meetha',
  'Poornam Boorelu',
  'Carrot Halwa',
];

const CHUTNEY_SUGGESTIONS = [
  'Allam (Ginger) & Coconut Chutney',
  'Gongura Pachadi',
  'Tomato Onion Chutney',
  'Kobbari (Coconut) Chutney',
  'Peanut (Palli) Chutney',
  'Dosakaya Pachadi',
];

export const DailyCurryBoardModal: React.FC<DailyCurryBoardModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
}) => {
  const [board, setBoard] = useState<IDailyCurryBoard>(() =>
    tiffinMealsStorage.getDailyBoard(restaurantId)
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBoard(tiffinMealsStorage.getDailyBoard(restaurantId));
      setSavedSuccess(false);
    }
  }, [isOpen, restaurantId]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    tiffinMealsStorage.saveDailyBoard(board, restaurantId);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-2xl shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl">
            🍛
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100 font-heading">
                Today's Daily Curries &amp; Meal Board
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                DAILY SPECIALS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates the South Indian Thali/Meals board on your POS, Dashboard, and customer Standee QRs for today.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center space-x-2 text-xs text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Today's Daily Curry &amp; Meal Board updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* MEALS STATUS TOGGLE */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block text-xs">Afternoon Meals Availability</span>
              <span className="text-[11px] text-slate-400">
                {board.isMealsAvailable ? 'Currently serving hot lunch meals & thalis' : 'Lunch meals sold out / closed for today'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBoard({ ...board, isMealsAvailable: !board.isMealsAvailable })}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-xs flex items-center space-x-1.5 ${
                board.isMealsAvailable
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
              }`}
            >
              <span>{board.isMealsAvailable ? '🟢 SERVING MEALS' : '🔴 MEALS CLOSED'}</span>
            </button>
          </div>

          {/* DAL / PAPPU */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              1. Dal / Pappu of the Day <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={board.dalPappu}
              onChange={(e) => setBoard({ ...board, dalPappu: e.target.value })}
              placeholder="e.g. Tomato Pappu / Gongura Pappu"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {DAL_SUGGESTIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setBoard({ ...board, dalPappu: item })}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 transition"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* VEG CURRY 1 (DRY / FRY) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              2. Veg Curry 1 (Crispy Fry / Poriyal) <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={board.vegCurry1}
              onChange={(e) => setBoard({ ...board, vegCurry1: e.target.value })}
              placeholder="e.g. Bendakaya Fry / Aloo Fry"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {FRY_SUGGESTIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setBoard({ ...board, vegCurry1: item })}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 transition"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* VEG CURRY 2 (GRAVY / KURMA) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              3. Veg Curry 2 (Gravy / Kurma) <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              value={board.vegCurry2}
              onChange={(e) => setBoard({ ...board, vegCurry2: e.target.value })}
              placeholder="e.g. Aloo Kurma / Gutti Vankaya"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {GRAVY_SUGGESTIONS.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setBoard({ ...board, vegCurry2: item })}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 transition"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* SPECIAL SWEET & CHUTNEY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                4. Today's Sweet <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={board.specialSweet}
                onChange={(e) => setBoard({ ...board, specialSweet: e.target.value })}
                placeholder="e.g. Semiya Payasam / Gulab Jamun"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {SWEET_SUGGESTIONS.slice(0, 4).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setBoard({ ...board, specialSweet: item })}
                    className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[9px] text-slate-300"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                5. Special Chutney / Pachadi <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={board.specialChutney}
                onChange={(e) => setBoard({ ...board, specialChutney: e.target.value })}
                placeholder="e.g. Gongura & Coconut Chutney"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap gap-1 mt-1">
                {CHUTNEY_SUGGESTIONS.slice(0, 3).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setBoard({ ...board, specialChutney: item })}
                    className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[9px] text-slate-300"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SAMBAR & RASAM */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              6. Sambar &amp; Rasam Special
            </label>
            <input
              type="text"
              value={board.sambarRasam}
              onChange={(e) => setBoard({ ...board, sambarRasam: e.target.value })}
              placeholder="e.g. Udupi Drumstick Sambar & Pepper Rasam"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* NON-VEG SPECIAL (OPTIONAL) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
              <span>7. Non-Veg Special of the Day (Optional for Military / Non-Veg Mess)</span>
              <span className="text-[10px] text-slate-500 font-normal">Leave blank if pure vegetarian</span>
            </label>
            <input
              type="text"
              value={board.nonVegSpecial || ''}
              onChange={(e) => setBoard({ ...board, nonVegSpecial: e.target.value })}
              placeholder="e.g. Sunday Country Chicken Curry / Mutton Sukka"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* BUTTONS */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition shadow-lg shadow-amber-500/25 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Update Today's Board</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

