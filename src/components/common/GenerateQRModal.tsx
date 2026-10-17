import React, { useState } from 'react';
import {
  X,
  QrCode,
  Search,
  Check,
  CheckCircle2,
  Sparkles,
  Utensils,
  Smartphone,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  Tag,
} from 'lucide-react';
import {
  qrMenuStorage,
  IQRRecord,
  IQRMenuItem,
} from '../../services/qrMenuStorage';
import { QRCodeCard } from './QRCodeCard';

interface GenerateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTable?: string;
  defaultSection?: string;
  posCartItems?: Array<{ id: string; name: string }>;
  onQRGenerated?: (qr: IQRRecord) => void;
  onSimulateCustomerScan?: (url: string) => void;
}

const CATEGORIES = ['All', 'Biryanis', 'Starters', 'Curries', 'Breads', 'Beverages', 'Desserts'];

export const GenerateQRModal: React.FC<GenerateQRModalProps> = ({
  isOpen,
  onClose,
  defaultTable = 'T-01',
  defaultSection = 'Main Dining Hall',
  posCartItems = [],
  onQRGenerated,
  onSimulateCustomerScan,
}) => {
  const [step, setStep] = useState<'CONFIGURE' | 'RESULT'>('CONFIGURE');
  const [tableNumber, setTableNumber] = useState(defaultTable);
  const [section, setSection] = useState(defaultSection);
  const [label, setLabel] = useState(`Table ${defaultTable} QR Menu`);
  const [specialNote, setSpecialNote] = useState('Scan with any mobile phone to view menu & punch order');
  const [discountPercent, setDiscountPercent] = useState<number>(10);

  // Menu Selection Mode ("Ask for menu adding")
  const [menuMode, setMenuMode] = useState<'ALL_ITEMS' | 'CUSTOM_SELECTION'>('CUSTOM_SELECTION');
  const [menuItems, setMenuItems] = useState<IQRMenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    if (posCartItems.length > 0) {
      return posCartItems.map((c) => c.id);
    }
    return [];
  });
  const [menuSearch, setMenuSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [generatedQR, setGeneratedQR] = useState<IQRRecord | null>(null);

  // Fetch real menu items added in restaurant menu
  React.useEffect(() => {
    let isMounted = true;
    const fetchMenu = async () => {
      setLoadingMenu(true);
      const items = await qrMenuStorage.loadRealMenuItems();
      if (isMounted) {
        setMenuItems(items);
        if (selectedItemIds.length === 0 && items.length > 0) {
          setSelectedItemIds(items.map((i) => i.id));
        }
        setLoadingMenu(false);
      }
    };
    fetchMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [menuItems]);

  if (!isOpen) return null;

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedItemIds(menuItems.map((m) => m.id));
  };

  const selectOnlyVeg = () => {
    setSelectedItemIds(menuItems.filter((m) => m.foodType === 'VEG').map((m) => m.id));
  };

  const selectOnlyBestsellers = () => {
    setSelectedItemIds(menuItems.filter((m) => m.isBestseller || m.isRecommended).map((m) => m.id));
  };

  const importPosCart = () => {
    if (posCartItems.length === 0) return;
    const ids = posCartItems.map((c) => c.id);
    setSelectedItemIds(ids);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTable = tableNumber.trim().toUpperCase() || 'T-01';
    const newQR: IQRRecord = {
      id: `qr-${cleanTable.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
      tableNumber: cleanTable,
      section,
      label: label.trim() || `Table ${cleanTable} Digital Menu`,
      menuMode,
      selectedItemIds: menuMode === 'ALL_ITEMS' ? menuItems.map((m) => m.id) : selectedItemIds,
      discountPercent,
      specialNote,
      createdAt: new Date().toISOString(),
      isActive: true,
      scanCount: 0,
      lastScannedAt: 'Created just now',
    };

    qrMenuStorage.saveQR(newQR);
    setGeneratedQR(newQR);
    setStep('RESULT');

    if (onQRGenerated) {
      onQRGenerated(newQR);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 md:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base md:text-lg font-black font-heading text-slate-100 leading-tight">
                {step === 'CONFIGURE' ? 'Generate Table & Digital Menu QR' : 'QR Code Generated Successfully!'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {step === 'CONFIGURE'
                  ? 'Assign table details and choose which menu dishes guests see when scanning.'
                  : 'Guests can scan this code to view your customized digital menu and place orders.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: CONFIGURE & ASK FOR MENU ADDING */}
        {step === 'CONFIGURE' && (
          <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 text-xs">
            {/* SECTION 1: TABLE DETAILS */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                <span>1. Table & Session Identity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Table / Counter Number</label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => {
                      setTableNumber(e.target.value);
                      setLabel(`Table ${e.target.value.toUpperCase()} QR Menu`);
                    }}
                    placeholder="e.g. T-01, Counter 1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Main Dining Hall">Main Dining Hall</option>
                    <option value="AC Family Lounge">AC Family Lounge</option>
                    <option value="Rooftop Terrace">Rooftop Terrace</option>
                    <option value="Outdoor Patio">Outdoor Patio</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                    <option value="Billing Counter">Billing Counter</option>
                    <option value="Takeaway Express">Takeaway Express</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">QR Promo Discount (%)</label>
                  <div className="flex items-center space-x-1">
                    {[0, 5, 10, 15].map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setDiscountPercent(d)}
                        className={`flex-1 py-2 rounded-xl font-bold transition text-center ${
                          discountPercent === d
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {d === 0 ? '0%' : `${d}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Greeting / Note on Scanned Menu</label>
                <input
                  type="text"
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  placeholder="e.g. Welcome! Enjoy fresh hot food cooked to order."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* SECTION 2: "ASK FOR MENU ADDING" (WHICH MENU ITEMS TO INCLUDE) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>2. Select Dishes For This QR Menu</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Choose whether guests see your full restaurant menu or a curated set of items.
                  </p>
                </div>

                {/* MODE TOGGLE */}
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMenuMode('CUSTOM_SELECTION')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      menuMode === 'CUSTOM_SELECTION'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Selection ({selectedItemIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuMode('ALL_ITEMS');
                      selectAll();
                    }}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      menuMode === 'ALL_ITEMS'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Full Menu ({menuItems.length})
                  </button>
                </div>
              </div>

              {/* QUICK SELECTION PRESETS */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-slate-400 text-[10px] mr-1">Quick Select:</span>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 text-[10px] font-semibold"
                >
                  All ({menuItems.length})
                </button>
                <button
                  type="button"
                  onClick={selectOnlyVeg}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-semibold"
                >
                  Veg Only
                </button>
                <button
                  type="button"
                  onClick={selectOnlyBestsellers}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[10px] font-semibold"
                >
                  Bestsellers &amp; Chef Specials
                </button>

                {posCartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={importPosCart}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-[10px] font-bold flex items-center space-x-1"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Include POS Cart Items ({posCartItems.length})</span>
                  </button>
                )}
              </div>

              {/* SEARCH & CATEGORY FILTER */}
              <div className="flex items-center space-x-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes to include..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* CATEGORIES PILLS */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* DISH CHECKLIST GRID */}
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40">
                {filteredMenuItems.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  const isVeg = item.foodType === 'VEG';

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`pt-2 flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                        isChecked
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'bg-slate-900/50 border border-transparent hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : 'border-slate-700 bg-slate-950 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isVeg ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </span>

                        <div>
                          <div className="font-bold text-slate-200 text-xs flex items-center space-x-1.5">
                            <span>{item.name}</span>
                            {item.isBestseller && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                Bestseller
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-slate-200 text-xs">
                        ₹{item.price}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                <span>Selected dishes for QR menu:</span>
                <span className="font-bold text-amber-400">
                  {selectedItemIds.length} of {menuItems.length} dishes enabled
                </span>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={selectedItemIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Generate QR with Selected Menu ({selectedItemIds.length} Items)</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: RESULT - LIVE QR GENERATED */}
        {step === 'RESULT' && generatedQR && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 flex flex-col items-center">
            <div className="w-full max-w-sm">
              <QRCodeCard
                qrRecord={generatedQR}
                onOpenCustomerView={(url) => {
                  if (onSimulateCustomerScan) {
                    onSimulateCustomerScan(url);
                  } else {
                    window.open(url, '_blank');
                  }
                }}
              />
            </div>

            {/* DONE BUTTON */}
            <div className="w-full max-w-sm pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('CONFIGURE')}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Edit Menu / Table
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
