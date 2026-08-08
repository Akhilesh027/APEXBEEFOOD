import React from 'react';
import { BarChart3, TrendingUp, ShoppingBag, Clock, DollarSign, Award, Users } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const salesData = [
    { day: 'Mon', revenue: 4200, orders: 18 },
    { day: 'Tue', revenue: 5800, orders: 24 },
    { day: 'Wed', revenue: 6400, orders: 28 },
    { day: 'Thu', revenue: 7100, orders: 31 },
    { day: 'Fri', revenue: 9800, orders: 42 },
    { day: 'Sat', revenue: 14200, orders: 58 },
    { day: 'Sun', revenue: 12600, orders: 51 },
  ];

  const topItems = [
    { name: 'Special Chicken Dum Biryani', sales: 142, revenue: '₹42,458' },
    { name: 'Paneer Butter Masala', sales: 86, revenue: '₹21,414' },
    { name: 'Apollo Fish Fry', sales: 64, revenue: '₹17,856' },
    { name: 'Butter Naan (Basket of 3)', sales: 184, revenue: '₹11,040' },
  ];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Kitchen Sales & Demand Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track weekly sales trends, peak ordering hours, top-selling dishes, and customer repeat rates
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer">
            This Week
          </button>
          <button className="px-3 py-1.5 text-slate-400 hover:text-white font-bold rounded-xl cursor-pointer">
            This Month
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>WEEKLY GROSS SALES</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">₹60,100</div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>+18.4% vs last week</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>TOTAL ORDERS</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">244</div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>+12.8% volume increase</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>AVG ORDER VALUE</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">₹246.30</div>
          <div className="text-[11px] text-slate-400">Target: ₹220+</div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>AVG PREP TIME</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">18 Mins</div>
          <div className="text-[11px] text-emerald-400 font-semibold">Superfast Kitchen Dispatch</div>
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
        <h3 className="font-extrabold text-sm text-slate-100 font-heading">Top Performing Dishes This Week</h3>
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
      </div>
    </div>
  );
};
