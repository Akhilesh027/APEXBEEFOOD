import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Clock, DollarSign, Award, Users, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { foodService } from '../../services/foodService';

export const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [salesData, setSalesData] = useState<{ day: string; revenue: number; orders: number }[]>([
    { day: 'Mon', revenue: 0, orders: 0 },
    { day: 'Tue', revenue: 0, orders: 0 },
    { day: 'Wed', revenue: 0, orders: 0 },
    { day: 'Thu', revenue: 0, orders: 0 },
    { day: 'Fri', revenue: 0, orders: 0 },
    { day: 'Sat', revenue: 0, orders: 0 },
    { day: 'Sun', revenue: 0, orders: 0 },
  ]);
  const [topItems, setTopItems] = useState<{ name: string; sales: number; revenue: string }[]>([]);
  const [metrics, setMetrics] = useState({
    grossSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    avgPrepTime: 20,
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.allSettled([
        foodService.getAnalytics(),
        foodService.getOrders({ limit: 100 }),
      ]);

      const orders = ordersRes.status === 'fulfilled' && ordersRes.value?.data?.orders ? ordersRes.value.data.orders : [];

      let gross = 0;
      const dayMap: Record<string, { revenue: number; orders: number }> = {
        Mon: { revenue: 0, orders: 0 },
        Tue: { revenue: 0, orders: 0 },
        Wed: { revenue: 0, orders: 0 },
        Thu: { revenue: 0, orders: 0 },
        Fri: { revenue: 0, orders: 0 },
        Sat: { revenue: 0, orders: 0 },
        Sun: { revenue: 0, orders: 0 },
      };

      const itemSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();

      orders.forEach((o: any) => {
        const amt = Number(o.pricing?.total || o.totalAmount || o.grandTotal || 0);
        gross += amt;

        if (o.createdAt) {
          const d = new Date(o.createdAt);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          if (dayMap[dayName]) {
            dayMap[dayName].revenue += amt;
            dayMap[dayName].orders += 1;
          }
        }

        // Tally items
        (o.items || []).forEach((it: any) => {
          const name = it.name || it.item?.name || 'Dish';
          const qty = Number(it.quantity || 1);
          const price = Number(it.price || it.item?.price || 0);
          const totalItemRev = price * qty;

          if (!itemSalesMap.has(name)) {
            itemSalesMap.set(name, { name, sales: qty, revenue: totalItemRev });
          } else {
            const ex = itemSalesMap.get(name)!;
            ex.sales += qty;
            ex.revenue += totalItemRev;
          }
        });
      });

      const dayArray = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        day,
        revenue: dayMap[day].revenue,
        orders: dayMap[day].orders,
      }));

      const sortedTop = Array.from(itemSalesMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map((it) => ({
          name: it.name,
          sales: it.sales,
          revenue: `₹${it.revenue.toLocaleString('en-IN')}`,
        }));

      setSalesData(dayArray);
      setTopItems(sortedTop);
      setMetrics({
        grossSales: gross,
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 ? Math.round(gross / orders.length) : 0,
        avgPrepTime: 20,
      });
    } catch (e) {
      console.warn('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Kitchen Sales &amp; Demand Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track weekly sales trends, peak ordering volume, top-selling dishes, and customer order value from live data
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 font-bold rounded-xl shadow-md cursor-pointer transition ${
              timeframe === 'week' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 font-bold rounded-xl cursor-pointer transition ${
              timeframe === 'month' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>GROSS SALES</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">
            ₹{metrics.grossSales.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Live store collections</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>TOTAL ORDERS</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">{metrics.totalOrders}</div>
          <div className="text-[11px] text-slate-400 font-semibold">
            {metrics.totalOrders > 0 ? 'Verified diner orders' : 'Awaiting first order'}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>AVG ORDER VALUE</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">₹{metrics.avgOrderValue}</div>
          <div className="text-[11px] text-slate-400">Per transaction</div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>AVG PREP TIME</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">{metrics.avgPrepTime} Mins</div>
          <div className="text-[11px] text-emerald-400 font-semibold">Kitchen dispatch benchmark</div>
        </div>
      </div>

      {/* REVENUE & ORDER TREND CHART */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-100 font-heading">Weekly Revenue Trajectory (₹)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP SELLING DISHES */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-100 font-heading">Top Performing Dishes</h3>
        {topItems.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No completed customer orders yet. Top selling dishes will appear here as orders are placed.
          </div>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-xl bg-amber-500/10 text-amber-400 font-mono font-bold flex items-center justify-center border border-amber-500/20 text-xs">
                    #{idx + 1}
                  </span>
                  <span className="font-bold text-slate-200">{item.name}</span>
                </div>
                <div className="flex items-center space-x-6">
                  <span className="text-slate-400">{item.sales} Orders</span>
                  <span className="font-mono font-extrabold text-amber-400">{item.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
