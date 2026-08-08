import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  CheckCircle2,
  FileText,
  Building2,
  ShieldCheck,
  RefreshCw,
  PieChart,
  Utensils,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Percent,
  Receipt,
} from 'lucide-react';
import { foodService } from '../../services/foodService';

export const FinanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<any>(null);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'orders'>('overview');

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [earnRes, setRes] = await Promise.all([
        foodService.getEarnings(),
        foodService.getSettlements(),
      ]);

      if (earnRes.data) {
        setEarnings(earnRes.data);
      }

      if (setRes.data?.settlements) {
        setSettlements(setRes.data.settlements);
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const itemBreakdown = earnings?.itemCommissionBreakdown || [];
  const orderBreakdown = earnings?.orderCommissionBreakdown || [];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TITLE BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Finance & Commission Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform commissions, per-item splits, order-level breakdowns & settlement payouts
          </p>
        </div>

        <button
          onClick={fetchFinanceData}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Financials</span>
        </button>
      </div>

      {/* FINANCE SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400 mb-1">Available Wallet Balance</div>
          <div className="text-2xl font-extrabold font-heading text-emerald-400">
            ₹{earnings?.walletBalance?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">Ready for direct bank transfer</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Sales Volume</div>
          <div className="text-2xl font-extrabold font-heading text-slate-100">
            ₹{earnings?.totalSalesVolume?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gross order revenue</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400 mb-1">Total Payouts Settled</div>
          <div className="text-2xl font-extrabold font-heading text-amber-400">
            ₹{earnings?.totalSettledAmount?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Processed to bank</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-medium text-slate-400 mb-1">Pending Settlements</div>
          <div className="text-2xl font-extrabold font-heading text-slate-200">
            ₹{earnings?.pendingSettlementAmount?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Next payout cycle</div>
        </div>
      </div>

      {/* COMMISSION OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-emerald-900/50 bg-gradient-to-br from-emerald-950/40 to-slate-950">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xs font-medium text-slate-400">Your Net Payout (Per Item Total)</div>
          </div>
          <div className="text-2xl font-extrabold font-heading text-emerald-400">
            ₹{earnings?.totalVendorPayout?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-emerald-400/70 mt-1">
            Across {earnings?.totalMenuItems || 0} menu items ({earnings?.liveMenuItems || 0} live)
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-900/50 bg-gradient-to-br from-amber-950/40 to-slate-950">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs font-medium text-slate-400">Platform Commission (Total)</div>
          </div>
          <div className="text-2xl font-extrabold font-heading text-amber-400">
            ₹{earnings?.totalPlatformCommission?.toLocaleString('en-IN') || 0}
          </div>
          <div className="text-[11px] text-amber-400/70 mt-1">
            ApexBee platform share deducted from item prices
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-violet-900/50 bg-gradient-to-br from-violet-950/40 to-slate-950">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Utensils className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xs font-medium text-slate-400">Menu Items Status</div>
          </div>
          <div className="text-2xl font-extrabold font-heading text-violet-400">
            {earnings?.liveMenuItems || 0} / {earnings?.totalMenuItems || 0}
          </div>
          <div className="text-[11px] text-violet-400/70 mt-1">
            Live items with approved commission
          </div>
        </div>
      </div>

      {/* AUTHORITATIVE ENGINE STATEMENT NOTICE */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center space-x-3 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <span>
          Financial payouts, platform commission calculations, TDS/TCS and bank settlements are processed by the authoritative central ApexBee Commission Engine.
        </span>
      </div>

      {/* TABS */}
      <div className="flex space-x-1 bg-slate-900/60 rounded-xl p-1 border border-slate-800 w-fit">
        {[
          { key: 'overview', label: 'Settlement Ledger', icon: FileText },
          { key: 'items', label: 'Item Commission Split', icon: PieChart },
          { key: 'orders', label: 'Order Earnings', icon: Receipt },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === key
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB: SETTLEMENT LEDGER */}
      {activeTab === 'overview' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm font-heading text-slate-100">Settlement Ledger & Transactions</h2>
            <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-xl flex items-center space-x-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Export Statement</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Settlement ID / Order</th>
                <th className="p-4">Date</th>
                <th className="p-4">Settlement Type</th>
                <th className="p-4 font-right">Net Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No settlement records found yet.
                  </td>
                </tr>
              ) : (
                settlements.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-mono font-bold text-slate-200">
                      {item.orderId?.orderNumber ? `#${item.orderId.orderNumber}` : item._id.substring(0, 12)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-300 capitalize">{item.settlementType || 'Vendor Payout'}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">₹{item.amount}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          item.status === 'released'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status || 'RELEASED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: ITEM COMMISSION SPLIT */}
      {activeTab === 'items' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-bold text-sm font-heading text-slate-100">Per-Item Commission Breakdown</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Platform commission & your net payout for each menu item</p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Menu Item</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Base Price</th>
                <th className="p-4 text-right">Commission %</th>
                <th className="p-4 text-right">Platform Share</th>
                <th className="p-4 text-right">Your Payout</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {itemBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No menu items found. Add items in Menu Management to see commission splits.
                  </td>
                </tr>
              ) : (
                itemBreakdown.map((item: any) => (
                  <tr key={item._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{item.name}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        item.foodType === 'VEG'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : item.foodType === 'NON_VEG'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.foodType}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-200">₹{item.basePrice}</td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-[11px]">
                        {item.platformCommissionPercent}%
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-amber-400">
                      <div className="flex items-center justify-end space-x-1">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>₹{item.platformShareAmount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">
                      <div className="flex items-center justify-end space-x-1">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>₹{item.vendorPayoutAmount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        item.approvalStatus === 'PUBLISHED_LIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : item.approvalStatus === 'PENDING_RESTAURANT_ACCEPTANCE'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : item.approvalStatus === 'PENDING_ADMIN_REVIEW'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {item.approvalStatus === 'PUBLISHED_LIVE' ? 'LIVE'
                          : item.approvalStatus === 'PENDING_RESTAURANT_ACCEPTANCE' ? 'AWAITING YOUR CONSENT'
                          : item.approvalStatus === 'PENDING_ADMIN_REVIEW' ? 'UNDER REVIEW'
                          : 'REJECTED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* TOTALS ROW */}
          {itemBreakdown.length > 0 && (
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="font-bold text-slate-300">{itemBreakdown.length} items total</div>
              <div className="flex items-center space-x-8">
                <div>
                  <span className="text-slate-400 mr-2">Platform Total:</span>
                  <span className="font-mono font-extrabold text-amber-400">
                    ₹{earnings?.totalPlatformCommission?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">Your Total:</span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    ₹{earnings?.totalVendorPayout?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: ORDER EARNINGS */}
      {activeTab === 'orders' && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h2 className="font-bold text-sm font-heading text-slate-100">Order-Level Earnings Breakdown</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Commission split per completed order (last 50 orders)</p>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Order Total</th>
                <th className="p-4 text-right">Platform Fee</th>
                <th className="p-4 text-right">Your Earning</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orderBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No completed orders found yet.
                  </td>
                </tr>
              ) : (
                orderBreakdown.map((order: any) => (
                  <tr key={order._id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 font-mono font-bold text-slate-200">
                      #{order.orderNumber || order._id.substring(0, 10)}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-100">
                      ₹{order.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-amber-400">
                      <div className="flex items-center justify-end space-x-1">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>₹{order.platformFee?.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">
                      <div className="flex items-center justify-end space-x-1">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>₹{order.vendorEarning?.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* TOTALS ROW */}
          {orderBreakdown.length > 0 && (
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="font-bold text-slate-300">{orderBreakdown.length} orders shown</div>
              <div className="flex items-center space-x-8">
                <div>
                  <span className="text-slate-400 mr-2">Total Revenue:</span>
                  <span className="font-mono font-extrabold text-slate-100">
                    ₹{orderBreakdown.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">Total Platform Fee:</span>
                  <span className="font-mono font-extrabold text-amber-400">
                    ₹{orderBreakdown.reduce((s: number, o: any) => s + (o.platformFee || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 mr-2">Your Net Earnings:</span>
                  <span className="font-mono font-extrabold text-emerald-400">
                    ₹{orderBreakdown.reduce((s: number, o: any) => s + (o.vendorEarning || 0), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
