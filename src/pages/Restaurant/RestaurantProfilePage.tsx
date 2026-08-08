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
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';

export const RestaurantProfilePage: React.FC = () => {
  const { setRestaurantData } = useFoodAuthStore();

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
    gstNumber: '',
    panNumber: '',

    phone: '',
    email: '',
    address: '',
    locality: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',

    cuisines: ['Hyderabadi', 'South Indian'],
    cuisinesText: 'Hyderabadi, South Indian',
    averagePreparationMinutes: 20,
    minimumOrderValue: 100,
    packagingCharge: 15,
  });

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
          businessType: p.businessType || 'RESTAURANT',
          foodPreference: p.foodPreference || 'BOTH',
          description: p.description || '',
          logo: p.logo || '',
          bannerImage: p.bannerImage || '',

          fssaiNumber: p.fssaiNumber || '',
          gstNumber: p.gstNumber || '',
          panNumber: p.panNumber || '',

          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          locality: p.locality || '',
          city: p.city || 'Hyderabad',
          state: p.state || 'Telangana',
          pincode: p.pincode || '500001',

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
      const res = await foodService.updateProfile({
        ...formData,
        cuisines: cuisinesArray,
      });

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
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Public Restaurant Profile & Storefront</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your restaurant display banner, cuisines, FSSAI compliance, address, and customer app card
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
                    <option value="CAFE">Café, Bakery & Beverages</option>
                    <option value="STREET_FOOD">Street Food & Fast Food</option>
                    <option value="SWEETS">Sweets & Desserts Shop</option>
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

            {/* SECTION 2: LEGAL & FSSAI COMPLIANCE */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-extrabold text-slate-100 font-heading flex items-center space-x-2 pb-2 border-b border-slate-800">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>2. FSSAI & Legal Compliance</span>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="15-digit GSTIN"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
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
              </div>
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
