import React, { useState, useEffect } from 'react';
import { X, Flame, CheckCircle2, AlertTriangle, Plus, Trash2, Save, Sparkles } from 'lucide-react';
import { curryPointStorage, IHandiPotItem } from '../../services/curryPointStorage';

interface LiveHandiBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
  restaurantName?: string;
}

export const LiveHandiBoardModal: React.FC<LiveHandiBoardModalProps> = ({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
}) => {
  const [pots, setPots] = useState<IHandiPotItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Pot Form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<IHandiPotItem['category']>('VEG_GRAVY');
  const [newFoodType, setNewFoodType] = useState<'VEG' | 'NON_VEG' | 'EGG'>('VEG');
  const [newPriceSmall, setNewPriceSmall] = useState('35');
  const [newPriceMedium, setNewPriceMedium] = useState('65');
  const [newPriceLarge, setNewPriceLarge] = useState('120');

  const loadPots = () => {
    setPots(curryPointStorage.getPots(restaurantId));
  };

  useEffect(() => {
    if (isOpen) {
      loadPots();
      setIsAddingNew(false);
    }
  }, [isOpen, restaurantId]);

  if (!isOpen) return null;

  const handleUpdateStatus = (id: string, potStatus: 'FULL_POT' | 'HALF_POT' | 'FINISHED') => {
    const updated = curryPointStorage.updatePotStatus(id, potStatus, restaurantId);
    setPots(updated);
  };

  const handleCreatePot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    curryPointStorage.addCustomPot(
      {
        name: newName.trim(),
        category: newCategory,
        potStatus: 'FULL_POT',
        priceSmall: Number(newPriceSmall) || 35,
        priceMedium: Number(newPriceMedium) || 65,
        priceLarge: Number(newPriceLarge) || 120,
        foodType: newFoodType,
        isAvailable: true,
      },
      restaurantId
    );

    setNewName('');
    setIsAddingNew(false);
    loadPots();
  };

  const handleDeletePot = (id: string) => {
    if (window.confirm('Remove this pot from counter display?')) {
      const updated = curryPointStorage.deletePot(id, restaurantId);
      setPots(updated);
    }
  };

  const filteredPots = pots.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 w-full max-w-4xl shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl">
              🥘
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-100 font-heading">
                  Live Handi / Pot Counter Board
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  {pots.filter((p) => p.potStatus !== 'FINISHED').length} POTS ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                1-tap update pot stock level (Full / Low / Empty) to sync with POS and online takeaway menus.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingNew ? 'Cancel' : '+ Add New Curry Pot'}</span>
          </button>
        </div>

        {/* ADD NEW POT FORM */}
        {isAddingNew && (
          <form onSubmit={handleCreatePot} className="my-4 p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 text-xs">
            <div className="font-bold text-amber-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add New Pot on Counter</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Curry / Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gongura Mutton / Cabbage Fry"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="DAL_PAPPU">Dal / Pappu</option>
                  <option value="VEG_FRY">Veg Fry (Dry / Vepudu)</option>
                  <option value="VEG_GRAVY">Veg Gravy / Kurma</option>
                  <option value="NON_VEG">Non-Veg Special</option>
                  <option value="STAPLES">Staples (Rice, Phulkas, Sambar)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Dietary Type</label>
                <select
                  value={newFoodType}
                  onChange={(e) => setNewFoodType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="VEG">Pure Veg 🌿</option>
                  <option value="NON_VEG">Non-Veg 🍗</option>
                  <option value="EGG">Contains Egg 🥚</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Price Small (250ml / Single)</label>
                <input
                  type="number"
                  value={newPriceSmall}
                  onChange={(e) => setNewPriceSmall(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Price Medium (500ml / Half)</label>
                <input
                  type="number"
                  value={newPriceMedium}
                  onChange={(e) => setNewPriceMedium(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Price Large (1000ml / Full)</label>
                <input
                  type="number"
                  value={newPriceLarge}
                  onChange={(e) => setNewPriceLarge(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-100 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition shadow-md"
            >
              Add Pot to Live Counter
            </button>
          </form>
        )}

        {/* CATEGORY TABS */}
        <div className="flex items-center space-x-2 my-4 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Handi Pots' },
            { id: 'DAL_PAPPU', label: 'Dal & Pappu' },
            { id: 'VEG_FRY', label: 'Veg Fry (Dry)' },
            { id: 'VEG_GRAVY', label: 'Veg Gravy / Kurma' },
            { id: 'NON_VEG', label: 'Non-Veg Pots' },
            { id: 'STAPLES', label: 'Phulkas & Rice' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* POTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredPots.map((pot) => (
            <div
              key={pot.id}
              className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                pot.potStatus === 'FINISHED'
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  : pot.potStatus === 'HALF_POT'
                  ? 'bg-slate-950/80 border-amber-500/40'
                  : 'bg-slate-950/90 border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pot.foodType === 'VEG'
                          ? 'bg-emerald-400'
                          : pot.foodType === 'EGG'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {pot.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePot(pot.id)}
                    className="text-slate-600 hover:text-rose-400 p-0.5"
                    title="Remove Pot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-extrabold text-slate-100 text-sm line-clamp-1">{pot.name}</div>

                <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400 mt-1">
                  <span>S: ₹{pot.priceSmall}</span>
                  <span>•</span>
                  <span>M: ₹{pot.priceMedium}</span>
                  <span>•</span>
                  <span>L: ₹{pot.priceLarge}</span>
                </div>
              </div>

              {/* 1-TAP STATUS SELECTOR */}
              <div className="pt-2 border-t border-slate-900 grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(pot.id, 'FULL_POT')}
                  className={`py-1 rounded-lg font-bold transition text-center ${
                    pot.potStatus === 'FULL_POT'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  🟢 Full Pot
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(pot.id, 'HALF_POT')}
                  className={`py-1 rounded-lg font-bold transition text-center ${
                    pot.potStatus === 'HALF_POT'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  🟡 Half Low
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(pot.id, 'FINISHED')}
                  className={`py-1 rounded-lg font-bold transition text-center ${
                    pot.potStatus === 'FINISHED'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-rose-300'
                  }`}
                >
                  🔴 Empty
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4 text-xs">
          <div className="text-slate-400 text-[11px]">
            Pots marked as <strong className="text-rose-400">Empty</strong> are automatically hidden from counter POS and standee QRs.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

