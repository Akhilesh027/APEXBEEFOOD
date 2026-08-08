import React, { useState, useEffect } from 'react';
import { Tag, Plus, Percent, CheckCircle2, Sparkles, AlertCircle, Calendar, Power } from 'lucide-react';
import { foodService } from '../../services/foodService';

export const OffersManagement: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(20);
  const [minimumOrderValue, setMinimumOrderValue] = useState(299);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(100);
  const [fundingSource, setFundingSource] = useState('RESTAURANT_FUNDED');

  const loadOffers = async () => {
    setLoading(true);
    try {
      const res = await foodService.getOffers();
      if (res.data?.offers) {
        setOffers(res.data.offers);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      alert('Please enter a Coupon Code');
      return;
    }

    try {
      await foodService.createOffer({
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minimumOrderValue,
        maxDiscountAmount,
        fundingSource,
      });

      setShowModal(false);
      setCode('');
      setDiscountValue(20);
      setMinimumOrderValue(299);
      loadOffers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create offer');
    }
  };

  const handleToggleOffer = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await foodService.toggleOfferStatus(id, newStatus);
      loadOffers();
    } catch (err) {
      alert('Failed to toggle offer status');
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Tag className="w-6 h-6 text-amber-400" />
            <span>Promotional Offers & Discount Coupons</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create restaurant-funded or shared discount coupons to boost order volume and repeat orders
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Coupon</span>
        </button>
      </div>

      {/* OFFERS GRID */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-200 text-base">No Promotional Offers Yet</h3>
          <p className="text-xs text-slate-400">Launch a discount coupon like APEXFOOD20 or BIRYANIFEST to attract hungry customers.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg cursor-pointer"
          >
            + Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer) => (
            <div key={offer._id} className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-amber-400 font-mono tracking-wider">{offer.code}</h3>
                      <span className="text-[10px] text-slate-500 font-bold block">{offer.fundingSource || 'RESTAURANT_FUNDED'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleOffer(offer._id, offer.status)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition flex items-center space-x-1 cursor-pointer ${
                      offer.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{offer.status || 'ACTIVE'}</span>
                  </button>
                </div>

                <div className="mt-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Discount:</span>
                    <span className="font-bold text-amber-400">
                      {offer.discountType === 'FLAT' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Min Order:</span>
                    <span className="font-mono">₹{offer.minimumOrderValue || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Max Savings:</span>
                    <span className="font-mono">₹{offer.maxDiscountAmount || 'No Limit'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Valid on all food orders</span>
                <span className="text-amber-400 font-bold">Restaurant Coupon</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 w-full max-w-md space-y-4 my-8">
            <h2 className="text-lg font-bold text-slate-100 font-heading">Create Promotional Offer</h2>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. APEXFOOD20, BIRYANIFEST"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono tracking-widest uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minimumOrderValue}
                    onChange={(e) => setMinimumOrderValue(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md">
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
