import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Utensils,
  UtensilsCrossed,
  LayoutDashboard,
  ShoppingBag,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  Tag,
  DollarSign,
  BarChart3,
  Star,
  Users,
  Settings,
  LogOut,
  Bell,
  Power,
  Flame,
  Volume2,
  VolumeX,
  Menu,
  X,
  ChevronDown,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { foodService } from '../../services/foodService';
import { NotificationSound } from '../common/NotificationSound';

export const FoodPartnerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, logout, setRestaurantData, hasPermission } = useFoodAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [hasNewOrderAlert, setHasNewOrderAlert] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch latest restaurant profile on layout mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await foodService.getProfile();
        if (res.data?.profile) {
          setRestaurantData(res.data.profile);
        }
      } catch (err) {
        // Silent fallback
      }
    };
    loadProfile();
  }, []);

  // Poll live orders every 10 seconds
  useEffect(() => {
    const fetchLiveFeed = async () => {
      try {
        const res = await foodService.getLiveOrdersFeed();
        if (res.data && res.data.counts) {
          const newCount = res.data.counts.placed || 0;
          if (newCount > liveCount && !soundMuted) {
            setHasNewOrderAlert(true);
            setTimeout(() => setHasNewOrderAlert(false), 3000);
          }
          setLiveCount(res.data.counts.placed + res.data.counts.accepted + res.data.counts.preparing);
        }
      } catch (err) {
        // Silent fallback
      }
    };

    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 10000);
    return () => clearInterval(interval);
  }, [liveCount, soundMuted]);

  const handleToggleAccepting = async () => {
    if (!restaurant) return;
    setUpdatingStatus(true);
    try {
      const nextStatus = !restaurant.acceptingOrders;
      const res = await foodService.updateOperationalStatus({
        acceptingOrders: nextStatus,
        operationalStatus: nextStatus ? 'OPEN' : 'CLOSED',
      });
      const updatedProfile = res.data?.profile || (res.data?.success ? { ...restaurant, acceptingOrders: nextStatus, busyMode: false, operationalStatus: nextStatus ? 'OPEN' : 'CLOSED' } : null);
      if (updatedProfile) {
        setRestaurantData(updatedProfile);
      }
    } catch (err) {
      alert('Failed to update operational status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleBusyMode = async () => {
    if (!restaurant) return;
    setUpdatingStatus(true);
    try {
      const nextBusy = !restaurant.busyMode;
      const res = await foodService.updateOperationalStatus({
        busyMode: nextBusy,
        operationalStatus: nextBusy ? 'BUSY' : 'OPEN',
      });
      if (res.data?.profile) {
        setRestaurantData(res.data.profile);
      }
    } catch (err) {
      alert('Failed to update busy mode');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleDining = async () => {
    if (!restaurant) return;
    setUpdatingStatus(true);
    try {
      const nextDining = restaurant.diningEnabled === false ? true : false;
      const res = await foodService.updateDiningInfo({ diningEnabled: nextDining });
      if (res.data?.success) {
        setRestaurantData({ ...restaurant, diningEnabled: nextDining });
      }
    } catch (err) {
      alert('Failed to update dining status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const navGroups = [
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, perm: '*' },
        { label: 'Live Orders', path: '/orders/live', icon: ShoppingBag, badge: liveCount, perm: 'orders' },
        { label: 'All Orders', path: '/orders', icon: Clock, perm: 'orders' },
        { label: 'Fast Availability', path: '/availability', icon: CheckCircle2, perm: 'availability' },
      ],
    },
    {
      title: 'MENU MANAGEMENT',
      items: [
        { label: 'Menu Items', path: '/menu/items', icon: BookOpen, perm: 'menu' },
        { label: 'Categories', path: '/menu/categories', icon: Layers, perm: 'menu' },
        { label: 'Variants & Add-ons', path: '/menu/addons', icon: Tag, perm: 'menu' },
      ],
    },
    {
      title: 'RESTAURANT & MARKETING',
      items: [
        { label: 'Profile & Details', path: '/restaurant/profile', icon: Building2, perm: 'profile' },
        { label: 'Dining & Bookings', path: '/dining', icon: UtensilsCrossed, perm: 'orders' },
        { label: 'Operating Hours', path: '/restaurant/hours', icon: Clock, perm: 'profile' },
        { label: 'Offers & Discounts', path: '/offers', icon: Tag, perm: 'offers' },
        { label: 'Customer Reviews', path: '/reviews', icon: Star, perm: 'reviews' },
      ],
    },
    {
      title: 'COMMERCIAL & MANAGEMENT',
      items: [
        { label: 'Finance & Earnings', path: '/finance', icon: DollarSign, perm: 'finance' },
        { label: 'Analytics', path: '/analytics', icon: BarChart3, perm: 'reports' },
        { label: 'Staff Roles', path: '/staff', icon: Users, perm: 'staff' },
        { label: 'Subscription', path: '/subscription', icon: Settings, perm: '*' },
        { label: 'Settings', path: '/settings', icon: Settings, perm: '*' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-['Plus_Jakarta_Sans',sans-serif]">
      <NotificationSound play={hasNewOrderAlert} />

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg">
            <Utensils className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-100 font-heading leading-tight">APEXBEE FOOD</div>
            <div className="text-[10px] text-amber-400 font-medium">PARTNER PORTAL</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleAccepting}
            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center space-x-1 ${
              restaurant?.acceptingOrders ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{restaurant?.acceptingOrders ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-300 hover:text-white">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* LOGO BRANDING */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20">
              <Utensils className="w-6 h-6 font-bold" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-wide text-slate-100 font-heading">APEXBEE</div>
              <div className="text-[11px] font-semibold text-amber-400 tracking-wider">FOOD PARTNER</div>
            </div>
          </div>
        </div>

        {/* RESTAURANT BRANCH CONTEXT CARD */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="text-xs font-bold text-slate-200 truncate">{restaurant?.restaurantName || 'ApexBee Restaurant'}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
            <span className="capitalize">{restaurant?.businessType?.replace('_', ' ') || 'Restaurant'}</span>
            <span className="text-emerald-400 font-medium">{restaurant?.locality || 'Hyderabad'}</span>
          </div>
        </div>

        {/* NAV MENU LINKS */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navGroups.map((group, idx) => {
            const filteredItems = group.items.filter((item) => item.perm === '*' || hasPermission(item.perm));
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx}>
                <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-2">{group.title}</div>
                <div className="space-y-1">
                  {filteredItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && item.badge > 0 ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* LOGOUT */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP HEADER BAR */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 bg-slate-900/60 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
          {/* LEFT: STATUS CONTROLS */}
          <div className="flex items-center space-x-4">
            {/* ONLINE / OFFLINE TOGGLE */}
            <button
              onClick={handleToggleAccepting}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm ${
                restaurant?.acceptingOrders
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{restaurant?.acceptingOrders ? 'ACCEPTING ORDERS (ONLINE)' : 'CLOSED (OFFLINE)'}</span>
            </button>

            {/* BUSY MODE TOGGLE */}
            <button
              onClick={handleToggleBusyMode}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border ${
                restaurant?.busyMode
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>{restaurant?.busyMode ? 'BUSY MODE (+15m ETA)' : 'NORMAL SPEED'}</span>
            </button>

            {/* DINING IN TOGGLE */}
            <button
              onClick={handleToggleDining}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer ${
                restaurant?.diningEnabled !== false
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>{restaurant?.diningEnabled !== false ? 'DINING IN (ACTIVE)' : 'DINING IN (OFF)'}</span>
            </button>
          </div>

          {/* RIGHT: NOTIFICATION & USER PROFILE */}
          <div className="flex items-center space-x-4">
            {/* SOUND CHIME TOGGLE */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              title={soundMuted ? 'Unmute order notifications' : 'Mute order notifications'}
              className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white transition"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* LIVE ORDERS ALERT BADGE */}
            <Link
              to="/orders/live"
              className="relative p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white transition"
            >
              <Bell className="w-4 h-4" />
              {liveCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                  {liveCount}
                </span>
              )}
            </Link>

            {/* PROFILE MENU */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold flex items-center justify-center font-heading text-sm">
                {restaurant?.restaurantName?.substring(0, 2).toUpperCase() || 'AP'}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-slate-200">{restaurant?.restaurantName || 'ApexBee Partner'}</div>
                <div className="text-[10px] text-slate-400">Owner Access</div>
              </div>
            </div>
          </div>
        </header>

        {/* VERIFICATION WARNING BANNER IF PENDING */}
        {restaurant && restaurant.verificationStatus !== 'APPROVED' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>
                Account Verification Status: <strong className="uppercase">{restaurant.verificationStatus}</strong>. Complete onboarding setup to enable live customer orders.
              </span>
            </div>
            <Link to="/onboarding" className="font-bold underline text-amber-400 hover:text-amber-300">
              Resume Setup →
            </Link>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
