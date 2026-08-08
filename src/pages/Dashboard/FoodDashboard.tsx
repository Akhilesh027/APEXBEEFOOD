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
} from 'lucide-react';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { IFoodOrder } from '../../types/foodPartner';

export const FoodDashboard: React.FC = () => {
  const { restaurant, setRestaurantData } = useFoodAuthStore();

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [liveOrders, setLiveOrders] = useState<IFoodOrder[]>([]);
  const [counts, setCounts] = useState({ placed: 0, accepted: 0, preparing: 0, readyForPickup: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [acceptingPrepTime, setAcceptingPrepTime] = useState<number>(20);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);

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
      const [feedResult, analyticsResult, earningsResult] = await Promise.allSettled([
        foodService.getLiveOrdersFeed(),
        foodService.getAnalytics(),
        foodService.getEarnings(),
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
    } catch (err) {
      // Gracefully handle network glitches during background polling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 12000);
    return () => clearInterval(interval);
  }, []);

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
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <span>Operational Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live kitchen operations, incoming orders, menu status & real-time sales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ON / OFF TOGGLE SWITCH BUTTON */}
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-md">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Outlet Status</span>
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
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <span>Live Kitchen Feed</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

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

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>New Orders</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold font-heading text-amber-400">
            {counts.placed || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Needs acceptance</div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Preparing</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold font-heading text-slate-100">
            {counts.preparing || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Kitchen preparing</div>
        </div>

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
              .map((order) => (
                <div key={order._id} className="p-4 bg-slate-900 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-amber-400 text-sm font-mono">#{order.orderNumber}</span>
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
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
