import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  MapPin,
  Utensils,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Eye,
  CheckCircle2,
  Truck,
  Percent,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { getBusinessCapabilities } from '../../utils/businessCapabilities';

export const RestaurantProfilePage: React.FC = () => {
  const { restaurant, setRestaurantData } = useFoodAuthStore();
  const caps = React.useMemo(
    () => getBusinessCapabilities(restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines),
    [restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await foodService.uploadImage(file);
      if (res?.url) {
        setFormData((prev) => ({ ...prev, logo: res.url }));
        setMsg('✅ Logo image uploaded successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload logo image');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const res = await foodService.uploadImage(file);
      if (res?.url) {
        setFormData((prev) => ({ ...prev, bannerImage: res.url }));
        setMsg('✅ Banner image uploaded successfully!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload banner image');
    } finally {
      setUploadingBanner(false);
    }
  };

  const [formData, setFormData] = useState({
    restaurantName: '',
    legalBusinessName: '',
    tagline: '',
    businessType: 'RESTAURANT',
    foodPreference: 'BOTH' as 'VEG' | 'NON_VEG' | 'BOTH' | 'VEGAN',
    description: '',
    logo: '',
    bannerImage: '',

    fssaiNumber: '',
    hasGst: false,
    gstNumber: '',
    gstPricingMode: 'inclusive' as 'inclusive' | 'exclusive',
    gstRate: 5,
    deliveryMode: 'platform_delivery' as 'platform_delivery' | 'self_delivery' | 'pickup_only',
    isSelfDelivery: false,
    isSelfPickup: true,
    deliveryRadiusKm: 5,
    deliveryCharge: 0,
    panNumber: '',

    phone: '',
    email: '',
    address: '',
    locality: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '',

    cuisines: ['Hyderabadi', 'South Indian'],
    cuisinesText: 'Hyderabadi, South Indian',
    averagePreparationMinutes: 20,
    minimumOrderValue: 100,
    packagingCharge: 15,
  });

  const normalizeBusinessType = (bt?: string) => {
    if (!bt) return 'RESTAURANT';
    const u = bt.toUpperCase();
    if (u === 'CURRY_POINT' || u.includes('CURRY') || u.includes('ROTI_POINT')) return 'CURRY_POINT';
    if (u === 'TIFFINS_MEALS' || u.includes('TIFFIN') || u.includes('MEAL') || u.includes('MESS') || u.includes('UDUPI') || u.includes('DARSHINI')) return 'TIFFINS_MEALS';
    if (u === 'FAST_FOOD' || u.includes('FAST') || u.includes('QSR') || u.includes('BURGER') || u.includes('PIZZA')) return 'FAST_FOOD';
    if (u === 'BAKERY' || u.includes('BAKER') || u.includes('CAKE') || u.includes('PASTRY')) return 'BAKERY';
    if (u.includes('CAFE')) return 'CAFE_BAKERY';
    if (u.includes('SWEET') || u.includes('DESSERT')) return 'SWEETS_DESSERTS';
    if (u.includes('STREET') || u.includes('CHAAT')) return 'STREET_FOOD';
    return 'RESTAURANT';
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await foodService.getProfile();
      if (res.data?.profile) {
        const p = res.data.profile;
        setRestaurantData(p);
        setFormData({
          restaurantName: p.restaurantName || '',
          legalBusinessName: p.legalBusinessName || '',
          tagline: p.tagline || 'Authentic Flavors & Fresh Cooking',
          businessType: normalizeBusinessType(p.businessType),
          foodPreference: p.foodPreference || 'BOTH',
          description: p.description || '',
          logo: p.logo || '',
          bannerImage: p.bannerImage || p.coverImage || '',

          fssaiNumber: p.fssaiNumber || '',
          hasGst: Boolean(p.hasGst || (p.gstNumber && p.gstNumber.trim().length > 0)),
          gstNumber: p.gstNumber || '',
          gstPricingMode: p.gstPricingMode || 'inclusive',
          gstRate: p.gstRate !== undefined ? Number(p.gstRate) : 5,
          deliveryMode: p.deliveryMode || (p.isSelfDelivery ? 'self_delivery' : 'platform_delivery'),
          isSelfDelivery: Boolean(p.isSelfDelivery || p.deliveryMode === 'self_delivery'),
          isSelfPickup: p.isSelfPickup !== undefined ? Boolean(p.isSelfPickup) : true,
          deliveryRadiusKm: p.deliveryRadiusKm !== undefined ? Number(p.deliveryRadiusKm) : 5,
          deliveryCharge: p.deliveryCharge !== undefined ? Number(p.deliveryCharge) : 0,
          panNumber: p.panNumber || '',

          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          locality: p.locality || '',
          city: p.city || 'Hyderabad',
          state: p.state || 'Telangana',
          pincode: p.pincode || '',

          cuisines: p.cuisines || ['Hyderabadi', 'South Indian'],
          cuisinesText: Array.isArray(p.cuisines) ? p.cuisines.join(', ') : p.cuisines || 'Hyderabadi, South Indian',
          averagePreparationMinutes: p.averagePreparationMinutes || 20,
          minimumOrderValue: p.minimumOrderValue || 100,
          packagingCharge: p.packagingCharge || 15,
        });
      }
    } catch (err) {
      console.error('Failed to load restaurant profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const cuisinesArray = formData.cuisinesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const payload: any = {
        ...formData,
        cuisines: cuisinesArray,
      };
      delete payload.cuisinesText;

      const res = await foodService.updateProfile(payload);

      if (res.data?.profile) {
        setRestaurantData(res.data.profile);
      }
      setMsg('✅ Restaurant profile updated successfully! Changes are live on ApexBee Customer App.');
    } catch (err: any) {
      setMsg(err.response?.data?.message || '❌ Failed to save restaurant profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl text-base bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {caps.formatBadgeIcon}
            </span>
            <h1 className="text-2xl font-extrabold font-heading text-slate-100">
              {caps.isBakery ? 'Public Bakery Profile & Storefront' : 'Public Restaurant Profile & Storefront'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {caps.isBakery
              ? 'Configure your bakery storefront banner, specialty cakes, FSSAI compliance, address, and customer app card.'
              : 'Configure your restaurant display banner, cuisines, FSSAI compliance, address, and customer app card.'}
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2 cursor-pointer self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save & Publish Profile'}</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-slate-900 border border-slate-800 text-xs font-semibold text-amber-400 rounded-xl">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading profile details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN EDITABLE PROFILE FORM */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-2 space-y-6">
            {/* SECTION 1: PUBLIC BRANDING & IDENTITY */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-100 font-heading flex items-center space-x-2 pb-2 border-b border-slate-800">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>1. Public Restaurant Identity</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Display Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    placeholder="e.g. Hyderabad Spice Kitchen"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Authentic Dum Biryanis & Kebabs"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Food Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="RESTAURANT">Restaurant / Fine Dining</option>
                    <option value="CURRY_POINT">Curry Point & Takeaway Counter (Curries & Phulkas)</option>
                    <option value="TIFFINS_MEALS">South Indian Tiffins, Meals & Mess Center</option>
                    <option value="FAST_FOOD">Fast Food Center / QSR (Quick Service)</option>
                    <option value="BAKERY">Bakery, Cake & Pastry Shop</option>
                    <option value="CAFE_BAKERY">Café, Bakery & Beverages</option>
                    <option value="STREET_FOOD">Street Food & Chaat Stall</option>
                    <option value="SWEETS_DESSERTS">Sweets & Desserts Shop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Food Dietary Preference</label>
                  <select
                    value={formData.foodPreference}
                    onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="BOTH">Pure Veg & Non-Veg</option>
                    <option value="VEG">Pure Veg Only</option>
                    <option value="NON_VEG">Non-Veg Specialty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cuisines Offered (Comma Separated)</label>
                <input
                  type="text"
                  value={formData.cuisinesText}
                  onChange={(e) => setFormData({ ...formData, cuisinesText: e.target.value })}
                  placeholder="e.g. Biryani, South Indian, North Indian, Chinese"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Store Description / Story</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell diners about your signature dishes, hygiene standards, and heritage recipes..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Restaurant Logo</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {uploadingLogo && <span className="text-[11px] text-amber-400 font-bold animate-pulse">Uploading...</span>}
                  </div>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="Or enter direct Image URL (https://...)"
                    className="w-full mt-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Cover Banner Image</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {uploadingBanner && <span className="text-[11px] text-amber-400 font-bold animate-pulse">Uploading...</span>}
                  </div>
                  <input
                    type="text"
                    value={formData.bannerImage}
                    onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                    placeholder="Or enter direct Image URL (https://...)"
                    className="w-full mt-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: LEGAL, FSSAI & GST COMPLIANCE */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-100 font-heading flex items-center space-x-2 pb-2 border-b border-slate-800">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>2. FSSAI &amp; GST Tax Compliance</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">FSSAI License No. *</label>
                  <input
                    type="text"
                    required
                    value={formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                    placeholder="14-digit FSSAI Number"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    placeholder="10-digit PAN"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GST Registered Business?</label>
                  <div className="flex items-center space-x-3 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasGst}
                        onChange={(e) => setFormData({ ...formData, hasGst: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                      />
                      <span className="text-xs font-semibold text-slate-200">Yes, collect GST</span>
                    </label>
                  </div>
                </div>
              </div>

              {formData.hasGst && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN (15-Digit GST Number) *</label>
                    <input
                      type="text"
                      required={formData.hasGst}
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="e.g. 36AAAAA0000A1Z5"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">GST Pricing Mode</label>
                    <select
                      value={formData.gstPricingMode}
                      onChange={(e) => setFormData({ ...formData, gstPricingMode: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="inclusive">GST Inclusive (Menu price includes GST)</option>
                      <option value="exclusive">GST Exclusive (Add GST on checkout bill)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Applicable GST Rate (%)</label>
                    <select
                      value={formData.gstRate}
                      onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    >
                      <option value={5}>5% (Standard Restaurant / Food GST)</option>
                      <option value={12}>12% (Packaged / Specialty Foods)</option>
                      <option value={18}>18% (Air Conditioned / Luxury Dining)</option>
                      <option value={0}>0% (Exempted)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: ADDRESS & CONTACT LOCATION */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-100 font-heading flex items-center space-x-2 pb-2 border-b border-slate-800">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>3. Location & Contact Info</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot / Shop No., Building, Street Name"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Locality</label>
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="e.g. Madhapur"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City / District</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: DELIVERY LOGISTICS & SELF-DELIVERY FLEET */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-100 font-heading flex items-center space-x-2 pb-2 border-b border-slate-800">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>4. Delivery Logistics &amp; Fleet Model</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Delivery Fulfillment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMode: 'platform_delivery', isSelfDelivery: false })}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      formData.deliveryMode === 'platform_delivery'
                        ? 'bg-amber-500/15 border-amber-500 text-slate-100 ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-amber-400 flex items-center gap-1.5 mb-1">
                      <span>🚴 Platform Delivery</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ApexBee auto-assigns nearby platform delivery partners to pick up and deliver food.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMode: 'self_delivery', isSelfDelivery: true })}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      formData.deliveryMode === 'self_delivery'
                        ? 'bg-emerald-500/15 border-emerald-500 text-slate-100 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-emerald-400 flex items-center gap-1.5 mb-1">
                      <span>🚚 Store Self-Delivery</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Our restaurant's staff / in-house riders deliver directly. No external rider OTP required.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryMode: 'pickup_only', isSelfDelivery: false })}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      formData.deliveryMode === 'pickup_only'
                        ? 'bg-purple-500/15 border-purple-500 text-slate-100 ring-1 ring-purple-500/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-extrabold text-xs text-purple-400 flex items-center gap-1.5 mb-1">
                      <span>🛍️ Takeaway / Pickup Only</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Takeaway counter &amp; dine-in only. No door-to-door delivery dispatched.
                    </div>
                  </button>
                </div>
              </div>

              {formData.deliveryMode === 'self_delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Self-Delivery Radius (KM)</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.deliveryRadiusKm}
                      onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: Number(e.target.value) })}
                      placeholder="e.g. 5"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Maximum distance our store riders will deliver.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Store Delivery Charge (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.deliveryCharge}
                      onChange={(e) => setFormData({ ...formData, deliveryCharge: Number(e.target.value) })}
                      placeholder="e.g. 0 for Free Delivery or 30"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Flat customer delivery charge added to order total.</span>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* RIGHT SIDEBAR: LIVE CUSTOMER APP PREVIEW */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-100 font-heading flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>ApexBee Customer App Preview</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                This is how your restaurant card appears to diners searching on the ApexBee Food App:
              </p>

              {/* SIMULATED APP CARD */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
                {/* COVER BANNER */}
                <div className="h-32 bg-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800/80">
                  {formData.bannerImage ? (
                    <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>Banner Image Preview</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[9px]">
                    ONLINE
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-100">{formData.restaurantName || 'Restaurant Name'}</h4>
                    <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/30">
                      ★ 4.8
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{formData.tagline || 'Tagline / Slogan'}</p>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-2">
                    <span className="text-slate-300 font-semibold">{formData.cuisinesText || 'Cuisines'}</span>
                    <span>•</span>
                    <span>{formData.locality || formData.city}</span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{formData.averagePreparationMinutes} Mins</span>
                    </span>
                    <span className="text-amber-400 font-bold">FSSAI: {formData.fssaiNumber || 'Verified'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
