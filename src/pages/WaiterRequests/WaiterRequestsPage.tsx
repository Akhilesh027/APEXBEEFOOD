import React, { useState, useEffect, useRef } from 'react';
import {
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  UtensilsCrossed,
  GlassWater,
  Receipt,
  Sparkles,
  HelpCircle,
  UserCheck,
  ShoppingBag,
  Mic,
  ChefHat,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  qrMenuStorage,
  IWaiterCall,
  ICustomerPlacedOrder,
} from '../../services/qrMenuStorage';
import { foodService } from '../../services/foodService';
import {
  announceOrderVoice,
  announceWaiterCallVoice,
  playKitchenChime,
} from '../../utils/orderSpeechAnnouncer';

const WAITERS = ['Rahul S. (Floor Lead)', 'Priya M.', 'Kiran K.', 'Arjun V.'];

export const WaiterRequestsPage: React.FC = () => {
  // Tabs: 'ALL' | 'ORDERS' | 'CALLS'
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDERS' | 'CALLS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');

  // Voice Announcement & Sound Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnnouncedId, setLastAnnouncedId] = useState<string>('');

  // Live Data
  const [waiterCalls, setWaiterCalls] = useState<IWaiterCall[]>([]);
  const [customerOrders, setCustomerOrders] = useState<ICustomerPlacedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real data from storage & backend
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Waiter calls
      const calls = qrMenuStorage.getWaiterCalls();
      setWaiterCalls(calls);

      // 2. Customer table orders
      const localOrders = qrMenuStorage.getCustomerOrders();
      setCustomerOrders(localOrders);

      // Also try to sync from backend live feed if available
      try {
        const feedRes = await foodService.getLiveOrdersFeed();
        if (feedRes.data?.orders && Array.isArray(feedRes.data.orders)) {
          // If backend has new orders, merge them
        }
      } catch (e) {}
    } catch (e) {
      console.warn('Error loading waiter & order requests:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load and periodic 5s polling
  useEffect(() => {
    // Purge any lingering mock sample calls from localStorage
    try {
      const stored = localStorage.getItem('apexbee_waiter_requests_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((c: any) => c.id !== 'sample-call-1');
          localStorage.setItem('apexbee_waiter_requests_v2', JSON.stringify(cleaned));
        }
      }
    } catch (e) {}

    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Listen for real-time events dispatched from customer menu ordering in other tabs
  useEffect(() => {
    const handleNewOrder = (e: any) => {
      const order: ICustomerPlacedOrder = e.detail;
      if (!order) return;

      loadData(true);

      if (voiceEnabled && order.orderId !== lastAnnouncedId) {
        setLastAnnouncedId(order.orderId);
        const itemsDesc = order.items.map((i) => `${i.quantity} ${i.item.name}`).join(', ');
        announceOrderVoice(order.tableNumber, itemsDesc, order.grandTotal);
      }
    };

    const handleWaiterCall = (e: any) => {
      const call: IWaiterCall = e.detail;
      if (!call) return;

      loadData(true);

      if (voiceEnabled) {
        announceWaiterCallVoice(call.tableNumber, call.reason || 'assistance');
      }
    };

    window.addEventListener('apexbee:new_order', handleNewOrder);
    window.addEventListener('apexbee:waiter_call', handleWaiterCall);
    window.addEventListener('storage', () => loadData(true));

    return () => {
      window.removeEventListener('apexbee:new_order', handleNewOrder);
      window.removeEventListener('apexbee:waiter_call', handleWaiterCall);
    };
  }, [voiceEnabled, lastAnnouncedId]);

  // Handle Waiter Call Status Update
  const handleUpdateCallStatus = (id: string, newStatus: IWaiterCall['status'], waiter?: string) => {
    const updated = qrMenuStorage.updateWaiterCallStatus(id, newStatus, waiter);
    setWaiterCalls(updated);
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = (orderId: string, newStatus: ICustomerPlacedOrder['status']) => {
    const current = qrMenuStorage.getCustomerOrders();
    const updated = current.map((ord) => {
      if (ord.orderId === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    try {
      localStorage.setItem('apexbee_customer_orders_v2', JSON.stringify(updated));
      setCustomerOrders(updated);
    } catch (e) {}
  };

  // Test Buttons for User to hear speech
  const handleTestOrderVoice = () => {
    announceOrderVoice('T-01', '2 Butter Chicken, 3 Garlic Naan, 1 Sweet Lassi', 650);
  };

  const handleTestWaiterCallVoice = () => {
    announceWaiterCallVoice('T-02', 'Water Refill & Cutlery');
  };

  // Filtered lists
  const pendingCallsCount = waiterCalls.filter((c) => c.status === 'PENDING').length;
  const pendingOrdersCount = customerOrders.filter((o) => o.status === 'PLACED').length;
  const totalPending = pendingCallsCount + pendingOrdersCount;

  const getRequestTypeMeta = (type: IWaiterCall['type']) => {
    switch (type) {
      case 'CALL_WAITER':
        return { label: 'Call Attendant', icon: BellRing, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'WATER':
        return { label: 'Water Refill', icon: GlassWater, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
      case 'BILL':
        return { label: 'Cheque / Bill', icon: Receipt, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      case 'CUTLERY':
        return { label: 'Extra Cutlery', icon: UtensilsCrossed, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
      case 'CLEAN':
        return { label: 'Clean Table', icon: Sparkles, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' };
      case 'ORDER_HELP':
      default:
        return { label: 'Order Help', icon: HelpCircle, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH VOICE ANNOUNCER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <BellRing className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 font-heading">
                Live Table Orders &amp; Waiter Calls
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time voice announcements, guest calling bells, and kitchen orders placed from QR tables.
              </p>
            </div>
          </div>
        </div>

        {/* VOICE CONTROLLER BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MUTE / UNMUTE VOICE */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
              voiceEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle audible voice announcements"
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            <span>{voiceEnabled ? 'Voice Alerts ON' : 'Voice Muted'}</span>
          </button>

          {/* TEST VOICE ANNOUNCEMENTS */}
          <button
            onClick={handleTestOrderVoice}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Listen to how a live table order is announced aloud"
          >
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Order Voice</span>
          </button>

          <button
            onClick={handleTestWaiterCallVoice}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Listen to a waiter request voice alert"
          >
            <GlassWater className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Waiter Voice</span>
          </button>

          {/* MANUAL REFRESH */}
          <button
            onClick={() => loadData(false)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="Refresh Live Data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* METRIC HIGHLIGHT STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeTab === 'ALL' ? 'bg-slate-900 border-amber-500/60 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-400">Total Pending Attention</div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{totalPending}</div>
          <div className="text-[10px] text-slate-500 mt-1">Orders &amp; Calling Bells</div>
        </div>

        <div
          onClick={() => setActiveTab('ORDERS')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeTab === 'ORDERS' ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-400">Table QR Orders</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">{customerOrders.length}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">{pendingOrdersCount} Placed to Kitchen</div>
        </div>

        <div
          onClick={() => setActiveTab('CALLS')}
          className={`cursor-pointer p-4 rounded-2xl border transition ${
            activeTab === 'CALLS' ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-[11px] font-medium text-cyan-400">Waiter Calling Bells</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{waiterCalls.length}</div>
          <div className="text-[10px] text-cyan-500/80 mt-1">{pendingCallsCount} Waiting for Attendant</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
          <div className="text-[11px] font-medium text-purple-400">Speech Announcer</div>
          <div className="text-sm font-black text-purple-200 mt-1 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{voiceEnabled ? 'Active & Ready' : 'Muted'}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Voice speaks dishes &amp; table #</div>
        </div>
      </div>

      {/* TABS SWITCHER */}
      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>All Activity</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/30 font-mono">
            {customerOrders.length + waiterCalls.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'ORDERS' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Table Orders ({customerOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CALLS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'CALLS' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Guest Calling Bells ({waiterCalls.length})</span>
        </button>
      </div>

      {/* SECTION 1: LIVE TABLE ORDERS (IF ACTIVE TAB IS ALL OR ORDERS) */}
      {(activeTab === 'ALL' || activeTab === 'ORDERS') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ChefHat className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-slate-100 font-heading text-sm md:text-base">
                Guest Orders Placed From Tables
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{customerOrders.length} orders recorded</span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="p-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
              <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-xs text-slate-400 font-medium">No live table orders currently</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                When a diner scans a table QR and places an order, it speaks the table and dish names aloud here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customerOrders.map((ord) => {
                const itemsSummary = ord.items.map((i) => `${i.quantity}x ${i.item.name}`).join(', ');

                return (
                  <div
                    key={ord.orderId}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex flex-col items-center justify-center font-mono font-black shadow-lg">
                          <span className="text-[9px] uppercase tracking-wider text-amber-400/80">Table</span>
                          <span className="text-sm font-extrabold">{ord.tableNumber}</span>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-amber-400 text-sm">{ord.orderNumber}</span>
                            <span className="text-[10px] text-slate-500">• {ord.placedAt}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-200">
                            {ord.customerName || 'Dine-In Guest'}
                            {ord.customerPhone && <span className="text-slate-400 font-normal"> ({ord.customerPhone})</span>}
                          </div>
                        </div>
                      </div>

                      {/* STATUS PILL */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          ord.status === 'PLACED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                            : ord.status === 'ACCEPTED'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : ord.status === 'PREPARING'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ordered Dishes:</div>
                      {ord.items.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-200 py-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-mono font-bold flex items-center justify-center text-[10px]">
                              {entry.quantity}
                            </span>
                            <span className="font-medium">{entry.item.name}</span>
                            {entry.notes && (
                              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Note: {entry.notes}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-slate-300">₹{entry.item.price * entry.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* TOTAL & QUICK ACTIONS */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400">Total Bill</div>
                        <div className="text-base font-black font-mono text-slate-100">₹{ord.grandTotal}</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* SPEAK AGAIN BUTTON */}
                        <button
                          onClick={() => announceOrderVoice(ord.tableNumber, itemsSummary, ord.grandTotal)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
                          title="Re-play voice announcement"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {ord.status === 'PLACED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.orderId, 'ACCEPTED')}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                          >
                            Accept to Kitchen
                          </button>
                        )}

                        {ord.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.orderId, 'PREPARING')}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                          >
                            Cooking in Kitchen
                          </button>
                        )}

                        {ord.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.orderId, 'SERVED')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Served</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: GUEST CALLING BELLS (IF ACTIVE TAB IS ALL OR CALLS) */}
      {(activeTab === 'ALL' || activeTab === 'CALLS') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <BellRing className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-slate-100 font-heading text-sm md:text-base">
                Guest Calling Bells &amp; Waiter Requests
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{waiterCalls.length} requests logged</span>
          </div>

          <div className="space-y-3">
            {waiterCalls.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs text-slate-300 font-medium">All Table Calls Attended</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When a customer taps 'Call Waiter', 'Water', or 'Bill' on their mobile menu, it alerts and announces here immediately.
                </p>
              </div>
            ) : (
              waiterCalls.map((req) => {
                const meta = getRequestTypeMeta(req.type);
                const Icon = meta.icon;
                const minutesAgo = Math.max(0, Math.round((Date.now() - req.timestamp) / 60000));
                const isUrgent = req.status === 'PENDING' && minutesAgo >= 3;

                return (
                  <div
                    key={req.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                      req.status === 'PENDING'
                        ? isUrgent
                          ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/20'
                          : 'bg-slate-900/90 border-amber-500/40 shadow-md'
                        : req.status === 'IN_PROGRESS'
                        ? 'bg-slate-900/70 border-slate-700'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-start sm:items-center space-x-4">
                      {/* TABLE IDENTIFIER */}
                      <div className="text-center min-w-[75px] py-2 px-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                        <div className="text-xs font-mono font-bold text-amber-400">TABLE</div>
                        <div className="text-base font-black font-mono text-slate-100">{req.tableNumber}</div>
                        <div className="text-[9px] text-slate-500 truncate max-w-[65px]">{req.section}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${meta.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{req.reason || meta.label}</span>
                          </span>

                          {isUrgent && (
                            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Waiting &gt; 3m</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Requested at {req.requestedAt} ({minutesAgo}m ago)</span>
                          </span>

                          {req.assignedWaiter && (
                            <span className="flex items-center space-x-1 text-slate-300 font-semibold">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>Assigned: {req.assignedWaiter}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-3 sm:mt-0 flex items-center space-x-2 justify-end">
                      {/* VOICE RE-ANNOUNCE */}
                      <button
                        onClick={() => announceWaiterCallVoice(req.tableNumber, req.reason || meta.label)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        title="Re-play voice announcement"
                      >
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      </button>

                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleUpdateCallStatus(req.id, 'IN_PROGRESS', WAITERS[0])}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
                          >
                            Attend Now
                          </button>
                          <button
                            onClick={() => handleUpdateCallStatus(req.id, 'RESOLVED')}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : req.status === 'IN_PROGRESS' ? (
                        <button
                          onClick={() => handleUpdateCallStatus(req.id, 'RESOLVED')}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Attended</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
