import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Flame,
  Power,
  Utensils,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Globe,
  QrCode,
  Receipt,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Calendar,
  Tv,
  Bell,
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { IFoodOrder } from '../../types/foodPartner';
import { getBusinessCapabilities } from '../../utils/businessCapabilities';
import { bakeryOrderStorage, ICakeAdvanceOrder } from '../../services/bakeryOrderStorage';
import { fastFoodTokenStorage, IFastFoodToken } from '../../services/fastFoodTokenStorage';
import {
  tiffinMealsStorage,
  IDailyCurryBoard,
  TiffinMealSlot,
  getSlotDisplayMeta,
} from '../../services/tiffinMealsStorage';
import { DailyCurryBoardModal } from '../../components/common/DailyCurryBoardModal';
import { curryPointStorage, IHandiPotItem } from '../../services/curryPointStorage';
import { LiveHandiBoardModal } from '../../components/common/LiveHandiBoardModal';

export const FoodDashboard: React.FC = () => {
  const { restaurant, setRestaurantData } = useFoodAuthStore();
  const caps = React.useMemo(
    () => getBusinessCapabilities(restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines),
    [restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines]
  );

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [liveOrders, setLiveOrders] = useState<IFoodOrder[]>([]);
  const [counts, setCounts] = useState({ placed: 0, accepted: 0, preparing: 0, readyForPickup: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [acceptingPrepTime, setAcceptingPrepTime] = useState<number>(20);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [cakeOrders, setCakeOrders] = useState<ICakeAdvanceOrder[]>([]);
  const [tokens, setTokens] = useState<IFastFoodToken[]>([]);
  const [dailyBoard, setDailyBoard] = useState<IDailyCurryBoard>(() =>
    tiffinMealsStorage.getDailyBoard(restaurant?._id)
  );
  const [activeSlot, setActiveSlot] = useState<TiffinMealSlot>(() =>
    tiffinMealsStorage.getActiveSlot(restaurant?._id)
  );
  const [isDailyBoardModalOpen, setIsDailyBoardModalOpen] = useState(false);
  const [curryPots, setCurryPots] = useState<IHandiPotItem[]>(() =>
    curryPointStorage.getPots(restaurant?._id)
  );
  const [isHandiBoardModalOpen, setIsHandiBoardModalOpen] = useState(false);

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

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [feedResult, analyticsResult, earningsResult, invoicesResult] = await Promise.allSettled([
        foodService.getLiveOrdersFeed(),
        foodService.getAnalytics(),
        foodService.getEarnings(),
        foodService.getMyInvoices(),
      ]);

      if (feedResult.status === 'fulfilled' && feedResult.value?.data) {
        setLiveOrders(feedResult.value.data.orders || []);
        setCounts(feedResult.value.data.counts || { placed: 0, accepted: 0, preparing: 0, readyForPickup: 0 });
      }

      if (analyticsResult.status === 'fulfilled' && analyticsResult.value?.data) {
        setAnalytics(analyticsResult.value.data);
      }

      if (earningsResult.status === 'fulfilled' && earningsResult.value?.data) {
        setEarningsData(earningsResult.value.data);
      }

        if (invoicesResult.status === 'fulfilled' && invoicesResult.value?.data?.data) {
        const invs = Array.isArray(invoicesResult.value.data.data) ? invoicesResult.value.data.data : [];
        setPendingInvoices(invs.filter((inv: any) => inv.status === 'pending'));
      }

      if (caps.isBakery) {
        const cakes = bakeryOrderStorage.getCakeOrders(restaurant?._id);
        setCakeOrders(cakes);
      }

      if (caps.canManageTokens || caps.isFastFood || caps.isTiffinsMeals || caps.isCurryPoint) {
        const toks = fastFoodTokenStorage.getTokens(restaurant?._id);
        setTokens(toks);
      }

      if (caps.isCurryPoint || caps.canManageHandiPots) {
        setCurryPots(curryPointStorage.getPots(restaurant?._id));
      }

      if (caps.isTiffinsMeals || caps.canManageDailyCurries) {
        setDailyBoard(tiffinMealsStorage.getDailyBoard(restaurant?._id));
        setActiveSlot(tiffinMealsStorage.getActiveSlot(restaurant?._id));
      }
    } catch (err) {
      // Gracefully handle network glitches during background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleBoardUpdate = () => {
      setDailyBoard(tiffinMealsStorage.getDailyBoard(restaurant?._id));
    };
    const handleSlotUpdate = (e: any) => {
      if (e.detail?.slot) {
        setActiveSlot(e.detail.slot);
      }
    };
    const handlePotsUpdate = () => {
      setCurryPots(curryPointStorage.getPots(restaurant?._id));
    };

    window.addEventListener('apexbee:daily_board_updated', handleBoardUpdate);
    window.addEventListener('apexbee:meal_slot_changed', handleSlotUpdate);
    window.addEventListener('apexbee:curry_pots_updated', handlePotsUpdate);

    const interval = setInterval(fetchDashboardData, 12000);
    return () => {
      window.removeEventListener('apexbee:daily_board_updated', handleBoardUpdate);
      window.removeEventListener('apexbee:meal_slot_changed', handleSlotUpdate);
      window.removeEventListener('apexbee:curry_pots_updated', handlePotsUpdate);
      clearInterval(interval);
    };
  }, [restaurant?._id]);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await foodService.acceptOrder(orderId, acceptingPrepTime);
      setAcceptingOrderId(null);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to accept order');
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    try {
      await foodService.rejectOrder(orderId, 'Restaurant busy / item unavailable');
      fetchDashboardData();
    } catch (err) {
      alert('Failed to reject order');
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TOP TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg text-sm ${caps.isBakery ? 'bg-pink-500/15 border border-pink-500/30' : 'bg-amber-500/15 border border-amber-500/30'}`}>
              {caps.formatBadgeIcon}
            </span>
            <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
              <span>{caps.isBakery ? 'Bakery Operations Dashboard' : 'Operational Dashboard'}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {caps.isBakery
              ? 'Live counter sales, custom cake pre-orders, fresh bakes & daily revenue'
              : 'Live kitchen operations, incoming orders, menu status & real-time sales'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ON / OFF TOGGLE SWITCH BUTTON */}
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-md">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                {caps.isBakery ? 'Bakery Status' : 'Outlet Status'}
              </span>
              <span className={`text-xs font-black tracking-wide ${
                restaurant?.acceptingOrders ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {updatingStatus ? 'UPDATING...' : restaurant?.acceptingOrders ? '🟢 ONLINE (OPEN)' : '🔴 OFFLINE (CLOSED)'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleAccepting}
              disabled={updatingStatus}
              title={restaurant?.acceptingOrders ? 'Click to turn OFF (Close Outlet)' : 'Click to turn ON (Open Outlet)'}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                restaurant?.acceptingOrders ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                  restaurant?.acceptingOrders ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/orders/live"
            className="px-4 py-2.5 font-bold rounded-2xl text-xs transition flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
          >
            <span>{caps.isBakery ? 'Live Counter & Cake Feed' : 'Live Kitchen Feed'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* PENDING ADMIN PAYMENT LINK ALERT BANNER */}
      {pendingInvoices.length > 0 && (
        <div className="space-y-3">
          {pendingInvoices.map((inv: any) => {
            const payUrl = inv.shortPaymentUrl || `https://apexbee.in/pay/${inv.paymentLinkToken}`;
            const isCopied = copiedInvoiceId === inv._id;
            return (
              <div
                key={inv._id}
                className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shrink-0 shadow-md">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        ADMIN PAYMENT LINK ISSUED
                      </span>
                      <span className="text-xs text-slate-400 font-mono">#{inv.invoiceNumber}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-100 font-heading mt-1">
                      {inv.title} - <span className="text-amber-400 font-mono">₹{inv.totalAmount?.toLocaleString('en-IN')}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {inv.notes ? `Note: ${inv.notes}` : 'Please complete the payment for your restaurant account / license.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(payUrl);
                      setCopiedInvoiceId(inv._id);
                      setTimeout(() => setCopiedInvoiceId(null), 2500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Link</span>
                  </a>

                  <Link
                    to="/subscription"
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5"
                  >
                    <span>Pay Online</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/30 to-slate-950">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Wallet Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-emerald-400">
            ₹{earningsData?.walletBalance?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 font-semibold">
            Ready for bank transfer
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-900/40 bg-gradient-to-br from-amber-950/30 to-slate-950">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Pending Payout</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-amber-400">
            ₹{earningsData?.pendingSettlementAmount?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[10px] text-amber-400/80 mt-1">
            In delivery / settlement
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Sales</span>
            <TrendingUp className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-xl font-extrabold font-heading text-slate-100">
            ₹{(earningsData?.totalSalesVolume || analytics?.kpis?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Gross orders revenue</div>
        </div>

        <Link
          to="/orders/live?channel=online"
          className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-cyan-400 text-xs font-bold mb-1">
            <span>Online Website</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-cyan-300">
            {liveOrders.filter((o) => {
              const ot = (o.orderType || '').toUpperCase();
              const n = (o.customerNotes || '').toLowerCase();
              return ot !== 'DINE_IN' && ot !== 'OFFLINE' && ot !== 'QR_CODE' && !o.tableNumber && !n.includes('table');
            }).length}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-1 font-semibold">Web Delivery &amp; Pickup &rarr;</div>
        </Link>

        <Link
          to="/orders/live?channel=offline"
          className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-purple-400 text-xs font-bold mb-1">
            <span>Offline / QR Orders</span>
            <QrCode className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-purple-300">
            {liveOrders.filter((o) => {
              const ot = (o.orderType || '').toUpperCase();
              const n = (o.customerNotes || '').toLowerCase();
              return ot === 'DINE_IN' || ot === 'OFFLINE' || ot === 'QR_CODE' || Boolean(o.tableNumber) || n.includes('table');
            }).length}
          </div>
          <div className="text-[10px] text-purple-400/80 mt-1 font-semibold">
            {caps.isBakery ? 'Counter QR & Showcase Scans →' : 'Dine-In Table Scans →'}
          </div>
        </Link>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Ready Pickup</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-emerald-400">
            {counts.readyForPickup || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Awaiting rider</div>
        </div>
      </div>

      {/* BAKERY ONLY: ADVANCE CAKE ORDERS PIPELINE WIDGET */}
      {caps.isBakery && (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 text-lg border border-amber-500/30">
                🎂
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base md:text-lg font-extrabold font-heading text-slate-100">
                    Advance Celebration Cake Orders
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {cakeOrders.filter((c) => c.status !== 'DELIVERED' && c.status !== 'CANCELLED').length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Custom inscriptions, photo cakes, scheduled pickup time slots &amp; chiller status.
                </p>
              </div>
            </div>

            <Link
              to="/advance-orders"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Cake Pipeline</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {cakeOrders.filter((c) => c.status !== 'DELIVERED' && c.status !== 'CANCELLED').length === 0 ? (
            <div className="p-6 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80">
              <div className="text-xs text-slate-400 font-medium">No advance celebration cakes scheduled yet.</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Orders booked at the Bakery POS terminal or entered in the Cake Pipeline will appear here with message inscriptions and pickup times.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {cakeOrders
                .filter((c) => c.status !== 'DELIVERED' && c.status !== 'CANCELLED')
                .slice(0, 3)
                .map((cake) => (
                  <div
                    key={cake.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-amber-400">#{cake.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            cake.status === 'READY_IN_CHILLER'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : cake.status === 'BAKING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {cake.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="font-bold text-sm text-slate-100 line-clamp-1">{cake.cakeName}</div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2">
                        <span>{cake.weight}</span>
                        <span>•</span>
                        <span className={cake.foodType === 'EGGLESS' ? 'text-emerald-400' : 'text-amber-400'}>
                          {cake.foodType === 'EGGLESS' ? '🌿 Eggless' : '🥚 Contains Egg'}
                        </span>
                      </div>

                      {cake.messageOnCake && (
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 italic line-clamp-1">
                          "{cake.messageOnCake}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {cake.pickupDate} ({cake.pickupTimeSlot})
                        </span>
                      </div>
                      <div className="font-bold text-slate-200">
                        ₹{cake.totalAmount}
                        {cake.balanceDue > 0 && (
                          <span className="text-rose-400 text-[10px] ml-1">(₹{cake.balanceDue} due)</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TIFFINS & MEALS ONLY: TODAY'S DAILY CURRIES & SESSION SWITCHER */}
      {(caps.isTiffinsMeals || caps.canManageDailyCurries) && (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-slate-950 text-xl font-black shadow-md shadow-amber-500/20">
                🍛
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base md:text-lg font-extrabold font-heading text-slate-100">
                    Today's Daily Curries &amp; South Indian Meals Board
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      dailyBoard.isMealsAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {dailyBoard.isMealsAvailable ? '🟢 MEALS SERVING HOT' : '🔴 MEALS CLOSED'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Daily changing Dal/Pappu, vegetable curries, sweets &amp; active meal slot for POS and customer QR standees.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={() => setIsDailyBoardModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>✏️ Edit Today's Curries</span>
              </button>
              <Link
                to="/pos"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <span>🎫 Tiffin POS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* MEAL SLOT / DAYPARTING SELECTOR */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-bold">Active Meal Slot:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getSlotDisplayMeta(activeSlot).tagColor}`}>
                {getSlotDisplayMeta(activeSlot).shortLabel}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto">
              {(['MORNING_TIFFINS', 'AFTERNOON_MEALS', 'EVENING_TIFFINS', 'ALL_DAY'] as TiffinMealSlot[]).map((slot) => {
                const meta = getSlotDisplayMeta(slot);
                const isActive = activeSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      tiffinMealsStorage.setActiveSlot(slot, restaurant?._id);
                      setActiveSlot(slot);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CURRIES & SPECIALS SHOWCASE GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                🥘 Dal / Pappu
              </div>
              <div className="font-bold text-xs text-slate-100 line-clamp-1">{dailyBoard.dalPappu || 'Daily Dal'}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Freshly cooked with ghee tadka</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                🥦 Veg Curry 1 (Fry)
              </div>
              <div className="font-bold text-xs text-slate-100 line-clamp-1">{dailyBoard.vegCurry1 || 'Veg Fry'}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Crispy dry fry / poriyal</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                🍲 Veg Curry 2 (Kurma)
              </div>
              <div className="font-bold text-xs text-slate-100 line-clamp-1">{dailyBoard.vegCurry2 || 'Veg Kurma'}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Rich gravy accompaniment</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                🍯 Sweet &amp; Pachadi
              </div>
              <div className="font-bold text-xs text-slate-100 line-clamp-1">
                {dailyBoard.specialSweet || 'Daily Sweet'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">{dailyBoard.specialChutney || 'Fresh Chutney'}</div>
            </div>
          </div>
        </div>
      )}

      {/* CURRY POINT ONLY: LIVE HANDI / POT COUNTER WIDGET */}
      {caps.isCurryPoint && (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-slate-950 text-xl font-black shadow-md shadow-amber-500/20">
                🥘
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base md:text-lg font-extrabold font-heading text-slate-100">
                    Live Handi / Pot Counter Status
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {curryPots.filter((p) => p.potStatus !== 'FINISHED').length} OF {curryPots.length} POTS READY
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time stock of heated steel handis on the counter: Full, Low, or Sold Out.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={() => setIsHandiBoardModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>✏️ Manage Handi Pots</span>
              </button>
              <Link
                to="/pos"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <span>🎫 Curry Parcel POS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* POTS STATUS COUNTER CLUSTER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Total Counter Pots</span>
                <span className="font-mono font-bold text-amber-400 text-base">{curryPots.length}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Arranged in heated bay</div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">🟢 Full Pots</span>
                <span className="font-mono font-black text-emerald-300 text-base">
                  {curryPots.filter((p) => p.potStatus === 'FULL_POT').length}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400/70 mt-1">Ready for packing</div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">🟡 Half Low Remaining</span>
                <span className="font-mono font-black text-amber-300 text-base">
                  {curryPots.filter((p) => p.potStatus === 'HALF_POT').length}
                </span>
              </div>
              <div className="text-[10px] text-amber-400/70 mt-1">Refill recommended</div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">🔴 Finished / Empty</span>
                <span className="font-mono font-black text-rose-300 text-base">
                  {curryPots.filter((p) => p.potStatus === 'FINISHED').length}
                </span>
              </div>
              <div className="text-[10px] text-rose-400/70 mt-1">Hidden from billing</div>
            </div>
          </div>

          {/* TOP 6 ACTIVE POTS PREVIEW */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {curryPots.slice(0, 6).map((pot) => (
              <div
                key={pot.id}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-slate-200 truncate">{pot.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    S: ₹{pot.priceSmall} | M: ₹{pot.priceMedium}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase whitespace-nowrap ${
                    pot.potStatus === 'FULL_POT'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : pot.potStatus === 'HALF_POT'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {pot.potStatus === 'FULL_POT' ? 'Full' : pot.potStatus === 'HALF_POT' ? 'Low' : 'Empty'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAST FOOD ONLY: LIVE TOKEN QUEUE & KITCHEN DISPLAY WIDGET */}
      {(!caps.isTiffinsMeals && !caps.isCurryPoint && (caps.isFastFood || caps.canManageTokens)) && (
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-slate-950 text-base font-black shadow-md shadow-amber-500/20">
                ⚡
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base md:text-lg font-extrabold font-heading text-slate-100">
                    Counter Token Queue &amp; Kitchen Status
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tokens.filter((t) => t.status === 'PREPARING' || t.status === 'READY_FOR_PICKUP').length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Live counter order tokens, grill/fryer timers, ready alerts &amp; customer TV display.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <Link
                to="/tokens"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Launch TV Display</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* PREPARING TOKENS PILL CLUSTER */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-400 font-bold flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 animate-pulse" />
                  <span>Now Cooking in Kitchen</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {tokens.filter((t) => t.status === 'PREPARING').length} tokens
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 min-h-[44px] items-center">
                {tokens.filter((t) => t.status === 'PREPARING').length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No orders currently in kitchen.</span>
                ) : (
                  tokens
                    .filter((t) => t.status === 'PREPARING')
                    .slice(0, 8)
                    .map((t) => (
                      <span
                        key={t.id}
                        className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-mono font-black text-sm"
                      >
                        {t.tokenDisplay}
                      </span>
                    ))
                )}
              </div>
            </div>

            {/* READY TOKENS PILL CLUSTER */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  <span>Ready at Counter for Pickup</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {tokens.filter((t) => t.status === 'READY_FOR_PICKUP').length} tokens
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 min-h-[44px] items-center">
                {tokens.filter((t) => t.status === 'READY_FOR_PICKUP').length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No tokens waiting at counter.</span>
                ) : (
                  tokens
                    .filter((t) => t.status === 'READY_FOR_PICKUP')
                    .slice(0, 8)
                    .map((t) => (
                      <span
                        key={t.id}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-mono font-black text-sm animate-pulse"
                      >
                        {t.tokenDisplay}
                      </span>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE ORDERS ALERT SECTION */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            <h2 className="text-lg font-bold font-heading text-slate-100">Incoming Live Orders</h2>
          </div>
          <Link to="/orders/live" className="text-xs text-amber-400 font-bold hover:underline flex items-center space-x-1">
            <span>View Full Screen</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {liveOrders.filter((o) => (o.orderStatus as string) === 'placed' || (o.orderStatus as string) === 'Placed').length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-bold text-slate-200">No New Orders Pending Acceptance</div>
            <p className="text-xs text-slate-400 mt-1">New incoming food orders will sound an alert here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {liveOrders
              .filter((o) => (o.orderStatus as string) === 'placed' || (o.orderStatus as string) === 'Placed')
              .map((order) => {
                const ot = (order.orderType || '').toUpperCase();
                const n = (order.customerNotes || '').toLowerCase();
                const isQr = ot === 'DINE_IN' || ot === 'OFFLINE' || ot === 'QR_CODE' || Boolean(order.tableNumber) || n.includes('table');

                return (
                  <div key={order._id} className="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-amber-400 text-sm font-mono">#{order.orderNumber}</span>
                        {isQr ? (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <QrCode className="w-3 h-3" />
                            <span>OFFLINE QR {order.tableNumber ? `(T-${order.tableNumber})` : ''}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>ONLINE WEBSITE</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold uppercase">NEW ORDER</span>
                        <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="text-xs text-slate-200 font-medium">
                        Customer: <strong>{order.customerId?.name || 'Customer'}</strong> ({order.customerId?.phone || 'N/A'})
                      </div>

                      <div className="text-xs text-slate-300 font-semibold">
                        Items ({order.items?.length || 0}): {order.items?.map((i) => `${i.productName} x${i.quantity}`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right mr-2">
                        <div className="text-sm font-extrabold text-slate-100">₹{order.totalAmount}</div>
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">{order.paymentStatus || 'PAID'}</div>
                      </div>

                    {acceptingOrderId === order._id ? (
                      <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-amber-500/40">
                        <select
                          value={acceptingPrepTime}
                          onChange={(e) => setAcceptingPrepTime(Number(e.target.value))}
                          className="bg-slate-900 text-xs text-amber-300 px-2 py-1.5 rounded-lg border border-slate-800 font-bold"
                        >
                          <option value={15}>15 Mins</option>
                          <option value={20}>20 Mins</option>
                          <option value={25}>25 Mins</option>
                          <option value={30}>30 Mins</option>
                          <option value={45}>45 Mins</option>
                        </select>
                        <button
                          onClick={() => handleAcceptOrder(order._id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition"
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setAcceptingOrderId(order._id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20"
                        >
                          Accept Order
                        </button>
                        <button
                          onClick={() => handleRejectOrder(order._id)}
                          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/20 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TODAY'S DAILY CURRY BOARD MODAL */}
      <DailyCurryBoardModal
        isOpen={isDailyBoardModalOpen}
        onClose={() => {
          setIsDailyBoardModalOpen(false);
          setDailyBoard(tiffinMealsStorage.getDailyBoard(restaurant?._id));
        }}
        restaurantId={restaurant?._id}
        restaurantName={restaurant?.restaurantName}
      />

      {/* CURRY POINT LIVE HANDI BOARD MODAL */}
      <LiveHandiBoardModal
        isOpen={isHandiBoardModalOpen}
        onClose={() => {
          setIsHandiBoardModalOpen(false);
          setCurryPots(curryPointStorage.getPots(restaurant?._id));
        }}
        restaurantId={restaurant?._id}
        restaurantName={restaurant?.restaurantName}
      />
    </div>
  );
};
