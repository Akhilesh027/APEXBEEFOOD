import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  MapPin,
  Utensils,
  Clock,
  CreditCard,
  Truck,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  ShieldAlert,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { restaurant, setRestaurantData } = useFoodAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    restaurantName: restaurant?.restaurantName || '',
    businessType: restaurant?.businessType || 'RESTAURANT',
    description: restaurant?.description || '',
    foodPreference: restaurant?.foodPreference || 'BOTH',

    legalBusinessName: restaurant?.legalBusinessName || '',
    fssaiNumber: restaurant?.fssaiNumber || '',
    gstNumber: restaurant?.gstNumber || '',
    panNumber: restaurant?.panNumber || '',

    address: restaurant?.address || '',
    locality: restaurant?.locality || '',
    city: restaurant?.city || 'Hyderabad',
    state: restaurant?.state || 'Telangana',
    pincode: restaurant?.pincode || '500001',

    cuisines: restaurant?.cuisines || ['Hyderabadi', 'South Indian'],
    averagePreparationMinutes: restaurant?.averagePreparationMinutes || 20,
    minimumOrderValue: restaurant?.minimumOrderValue || 100,
    packagingCharge: 15,
  });

  useEffect(() => {
    if (restaurant?.onboardingStep) {
      setCurrentStep(Math.min(10, restaurant.onboardingStep));
    }
  }, [restaurant]);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        const res = await foodService.getProfile();
        if (res.data?.profile) {
          const p = res.data.profile;
          setRestaurantData(p);
          setFormData((prev) => ({
            ...prev,
            restaurantName: p.restaurantName || prev.restaurantName,
            businessType: p.businessType || prev.businessType,
            description: p.description || prev.description,
            foodPreference: p.foodPreference || prev.foodPreference,
            legalBusinessName: p.legalBusinessName || prev.legalBusinessName,
            fssaiNumber: p.fssaiNumber || prev.fssaiNumber,
            gstNumber: p.gstNumber || prev.gstNumber,
            panNumber: p.panNumber || prev.panNumber,
            address: p.address || prev.address,
            locality: p.locality || prev.locality,
            city: p.city || prev.city,
            state: p.state || prev.state,
            pincode: p.pincode || prev.pincode,
            cuisines: p.cuisines?.length ? p.cuisines : prev.cuisines,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch profile in onboarding wizard:', err);
      }
    };

    fetchLatestProfile();
  }, []);

  const handleNextStep = async () => {
    setLoading(true);
    try {
      const nextStep = currentStep + 1;
      const res = await foodService.saveOnboardingStep(nextStep, formData);
      if (res.data?.profile) {
        setRestaurantData(res.data.profile);
      }
      if (nextStep <= 10) {
        setCurrentStep(nextStep);
      }
    } catch (err) {
      console.error('Failed to save step:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    try {
      const res = await foodService.submitOnboarding();
      if (res.data?.profile) {
        setRestaurantData(res.data.profile);
      }
      navigate('/dashboard');
    } catch (err) {
      alert('Submission failed. Please check required fields.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Restaurant Details', icon: Building2 },
    { num: 2, label: 'Legal & FSSAI', icon: FileText },
    { num: 3, label: 'Documents', icon: Upload },
    { num: 4, label: 'Location', icon: MapPin },
    { num: 5, label: 'Cuisine', icon: Utensils },
    { num: 6, label: 'Hours', icon: Clock },
    { num: 7, label: 'Bank Details', icon: CreditCard },
    { num: 8, label: 'Delivery', icon: Truck },
    { num: 9, label: 'Menu Setup', icon: BookOpen },
    { num: 10, label: 'Review & Submit', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 mb-3">
            <Utensils className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-slate-100">Restaurant Onboarding Setup</h1>
          <p className="text-xs text-slate-400 mt-1">Complete your profile setup for verification by ApexBee Admin</p>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[700px]">
            {steps.map((s) => {
              const Icon = s.icon;
              const isDone = s.num < currentStep;
              const isCurrent = s.num === currentStep;

              return (
                <div key={s.num} className="flex flex-col items-center flex-1 relative">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 text-center ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP FORM CONTAINER */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl mb-8">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-heading text-amber-400 flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Step 1: Restaurant Basic Information</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  placeholder="e.g. Royal Bawarchi Biryani"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Food Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100"
                  >
                    <option value="RESTAURANT">Restaurants</option>
                    <option value="STREET_FOOD">Street Food</option>
                    <option value="CAFE_BAKERY_BEVERAGES">Cafés, Bakery & Beverages</option>
                    <option value="SWEETS_DESSERTS">Sweets & Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Food Preference</label>
                  <select
                    value={formData.foodPreference}
                    onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100"
                  >
                    <option value="BOTH">Veg & Non-Veg (Both)</option>
                    <option value="VEG">Pure Veg</option>
                    <option value="NON_VEG">Non-Veg Specialty</option>
                    <option value="VEGAN">Pure Vegan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Tagline</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Authentic Hyderabadi Dum Biryani & Kebabs"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-heading text-amber-400 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Step 2: Legal Business & Compliance</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Business Name</label>
                <input
                  type="text"
                  value={formData.legalBusinessName}
                  onChange={(e) => setFormData({ ...formData, legalBusinessName: e.target.value })}
                  placeholder="e.g. Royal Bawarchi Foods Pvt Ltd"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">FSSAI Registration / License No.</label>
                  <input
                    type="text"
                    value={formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                    placeholder="14-digit FSSAI Number"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="GSTIN"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    placeholder="PAN Number"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep >= 3 && currentStep <= 9 && (
            <div className="space-y-4 text-center py-6">
              <h2 className="text-lg font-bold font-heading text-amber-400">Step {currentStep}: Setup Configuration</h2>
              <p className="text-xs text-slate-400">Configuring restaurant details, operating hours, delivery settings, and menu foundation.</p>
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Restaurant:</span>
                  <strong className="text-amber-400">{formData.restaurantName || 'ApexBee Partner'}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Category:</span>
                  <span className="capitalize">{formData.businessType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Avg Prep Time:</span>
                  <span>{formData.averagePreparationMinutes} Mins</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center space-x-3 text-xs">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <div>
                  <strong className="block text-sm">Onboarding Details Complete!</strong>
                  <span>Your Food Partner registration application is ready to be submitted for Admin approval.</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Restaurant:</span>
                  <span className="font-bold text-slate-200">{formData.restaurantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Business Type:</span>
                  <span className="text-slate-200">{formData.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">FSSAI Number:</span>
                  <span className="font-mono text-slate-200">{formData.fssaiNumber || 'Pending Upload'}</span>
                </div>
              </div>
            </div>
          )}

          {/* BUTTON CONTROLS */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 1 || loading}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < 10 ? (
              <button
                onClick={handleNextStep}
                disabled={loading}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitApplication}
                disabled={loading}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
              >
                <span>Submit Application for Approval</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
