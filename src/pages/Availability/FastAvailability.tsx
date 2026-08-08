import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Flame,
  Power,
  Sliders,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';

export const FastAvailability: React.FC = () => {
  const { restaurant, setRestaurantData } = useFoodAuthStore();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await foodService.getAvailabilityOverview();
      if (res.data) {
        setCategories(res.data.categories || []);
        setItems(res.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSingleToggle = async (itemId: string, currentSoldOut: boolean) => {
    try {
      await foodService.toggleAvailabilityItem(itemId, !currentSoldOut);
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, soldOut: !currentSoldOut } : item))
      );
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const handleBulkToggle = async (soldOut: boolean) => {
    if (selectedItemIds.length === 0) return;
    setUpdating(true);
    try {
      await foodService.bulkToggleAvailability(selectedItemIds, soldOut);
      setSelectedItemIds([]);
      fetchOverview();
    } catch (err) {
      alert('Failed bulk update');
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCat || item.categoryId === selectedCat || item.categoryId?._id === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Fast Stock & Sold Out Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            1-click toggle menu items as Sold Out or Available during peak kitchen hours
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* BULK ACTION BAR */}
      {selectedItemIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-300">
          <span className="font-bold">{selectedItemIds.length} items selected</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleBulkToggle(true)}
              disabled={updating}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl shadow-md shadow-rose-500/20"
            >
              Mark All Selected as SOLD OUT
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              disabled={updating}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20"
            >
              Mark All Selected as AVAILABLE
            </button>
          </div>
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items to toggle..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCat('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              !selectedCat ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCat(c._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                selectedCat === c._id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* FAST AVAILABILITY LIST TABLE */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
            <tr>
              <th className="p-4 w-10 text-center">#</th>
              <th className="p-4">Item Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Instant Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredItems.map((item) => {
              const isSelected = selectedItemIds.includes(item._id);

              return (
                <tr key={item._id} className="hover:bg-slate-900/40 transition">
                  <td className="p-4 text-center">
                    <button onClick={() => toggleSelectItem(item._id)} className="text-slate-500 hover:text-amber-400">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="p-4 font-bold text-slate-100 flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.foodType === 'VEG' || item.foodType === 'VEGAN' ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{item.name}</span>
                  </td>
                  <td className="p-4 text-slate-400">{item.categoryId?.name || 'Category'}</td>
                  <td className="p-4 font-mono font-bold text-amber-400">₹{item.offerPrice || item.basePrice}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.soldOut
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {item.soldOut ? 'SOLD OUT' : 'AVAILABLE'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleSingleToggle(item._id, item.soldOut)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        item.soldOut
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20'
                      }`}
                    >
                      {item.soldOut ? 'Mark AVAILABLE' : 'Mark SOLD OUT'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
