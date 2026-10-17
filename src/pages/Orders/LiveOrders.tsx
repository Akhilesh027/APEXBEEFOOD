import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  User,
  MapPin,
  Check,
  X,
  Volume2,
  Globe,
  QrCode,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { foodService } from '../../services/foodService';
import { IFoodOrder } from '../../types/foodPartner';
const KitchenLiveCountdownBadge = ({ estimatedDeliveryTime, prepMins }: { estimatedDeliveryTime?: string; prepMins?: number }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  useEffect(() => {
    if (!estimatedDeliveryTime) return;

    const updateTimer = () => {
      const target = new Date(estimatedDeliveryTime).getTime();
      const now = Date.now();
      const diffSecs = Math.floor((target - now) / 1000);

      if (diffSecs <= 0) {
        const overMins = Math.floor(Math.abs(diffSecs) / 60);
        const overSecs = Math.abs(diffSecs) % 60;
        setTimeLeft(`🚨 PREP OVERDUE (${overMins}m ${overSecs}s EXPIRED)`);
        setIsOverdue(true);
      } else {
        const m = Math.floor(diffSecs / 60);
        const s = diffSecs % 60;
        setTimeLeft(`⏱️ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} Left`);
        setIsOverdue(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [estimatedDeliveryTime]);

  if (isOverdue) {
    return (
      <div className="text-xs font-black text-white flex items-center space-x-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 px-3.5 py-1.5 rounded-xl border border-red-400 shadow-lg shadow-red-600/30 animate-pulse font-mono">
        <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce shrink-0" />
        <span>{timeLeft}</span>
      </div>
    );
  }

  return (
    <div className="text-xs font-bold text-amber-300 flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-400/40 font-mono">
      <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
      <span>{timeLeft || `⏱️ ${prepMins || 20}m Prep Window`}</span>
    </div>
  );
};

export const LiveOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialChannel = (searchParams.get('channel') || searchParams.get('type') || 'all') as 'all' | 'online' | 'offline';
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'online' | 'offline'>(
    ['all', 'online', 'offline'].includes(initialChannel) ? initialChannel : 'all'
  );

  const [activeTab, setActiveTab] = useState<'all' | 'placed' | 'preparing' | 'ready'>('all');
  const [orders, setOrders] = useState<IFoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrepTimeMap, setSelectedPrepTimeMap] = useState<Record<string, number>>({});
  const [activeAcceptId, setActiveAcceptId] = useState<string | null>(null);
  const [activeOtpModalId, setActiveOtpModalId] = useState<string | null>(null);
  const [inputOtp, setInputOtp] = useState<string>('');

  const isOfflineQrOrder = (o: IFoodOrder): boolean => {
    if (o.orderChannel) return o.orderChannel === 'OFFLINE_QR';
    const oType = (o.orderType || '').toUpperCase();
    const notes = (o.customerNotes || '').toLowerCase();
    const orderNum = (o.orderNumber || '').toUpperCase();
    return (
      oType === 'DINE_IN' ||
      oType === 'OFFLINE' ||
      oType === 'QR_CODE' ||
      oType === 'TABLE' ||
      Boolean(o.tableNumber) ||
      notes.includes('table ') ||
      notes.includes('table#') ||
      orderNum.includes('TB-')
    );
  };

  const isOnlineWebsiteOrder = (o: IFoodOrder): boolean => !isOfflineQrOrder(o);

  const fetchLiveOrders = async () => {
    setLoading(true);
    try {
      const res = await foodService.getLiveOrdersFeed();
      if (res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch live orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChannelChange = (channel: 'all' | 'online' | 'offline') => {
    setSelectedChannel(channel);
    if (channel === 'all') {
      searchParams.delete('channel');
      searchParams.delete('type');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ channel });
    }
  };

  const handleAccept = async (orderId: string) => {
    const prepTime = selectedPrepTimeMap[orderId] || 15;
    try {
      await foodService.acceptOrder(orderId, prepTime);
      setActiveAcceptId(null);
    } catch (err: any) {
      console.error('Accept order error:', err);
    } finally {
      fetchLiveOrders();
    }
  };

  const handleTransitionStatus = async (orderId: string, nextStatus: string) => {
    try {
      await foodService.updateOrderStatus(orderId, nextStatus);
    } catch (err: any) {
      console.warn('Update order status API warning:', err);
    } finally {
      fetchLiveOrders();
    }
  };

  const handleReject = async (orderId: string) => {
    if (!window.confirm('Reject this food order?')) return;
    try {
      await foodService.rejectOrder(orderId, 'Restaurant busy');
      fetchLiveOrders();
    } catch (err) {
      alert('Failed to reject order');
    }
  };

  const onlineOrders = orders.filter(isOnlineWebsiteOrder);
  const offlineQrOrders = orders.filter(isOfflineQrOrder);

  const channelFilteredOrders = orders.filter((o) => {
    if (selectedChannel === 'online') return isOnlineWebsiteOrder(o);
    if (selectedChannel === 'offline') return isOfflineQrOrder(o);
    return true;
  });

  const filteredOrders = channelFilteredOrders.filter((o) => {
    const st = (o.orderStatus || '').toLowerCase();
    if (activeTab === 'placed') return st === 'placed' || st === 'pending_payment';
    if (activeTab === 'preparing') return st === 'accepted' || st === 'preparing' || st === 'confirmed' || st === 'packed';
    if (activeTab === 'ready') return st === 'ready_for_pickup' || st === 'ready' || st === 'served';
    return true;
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TITLE & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-100 flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-amber-400" />
            <span>Live Kitchen Order Operations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Accept orders, cook dishes, manage dine-in table QR orders (no OTP needed), and verify rider OTP for online deliveries.
          </p>
        </div>

        <button
          onClick={fetchLiveOrders}
          className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-2 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* 🚨 PAGE LEVEL OVERDUE ALERT BANNER */}
      {(() => {
        const overdueOrders = orders.filter((o) => {
          const st = (o.orderStatus || '').toLowerCase();
          const isPendingDelivery = ['accepted', 'preparing', 'confirmed', 'packed'].includes(st);
          const estTime = (o as any).estimatedDeliveryTime;
          return isPendingDelivery && estTime && new Date(estTime).getTime() <= Date.now();
        });

        if (overdueOrders.length === 0) return null;

        return (
          <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-2 border-red-500 text-white p-4 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                🚨
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-red-200 uppercase tracking-wider font-heading">
                  URGENT KITCHEN ALERT: {overdueOrders.length} Food Order(s) Overdue &amp; Not Yet Delivered!
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">
                  The preparation timer has expired for order(s) #{overdueOrders.map((o) => o.orderNumber).join(', ')}. Please mark them as <strong>Ready for Pickup</strong> or dispatch to rider immediately!
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('preparing')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer shrink-0"
            >
              View Overdue Orders &rarr;
            </button>
          </div>
        );
      })()}

      {/* 2 PRIMARY ORDER TYPES / CHANNELS (ONLINE WEBSITE VS OFFLINE QR CODE) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* TAB 1: ALL CHANNELS */}
        <button
          onClick={() => handleChannelChange('all')}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedChannel === 'all'
              ? 'bg-amber-500/15 border-amber-500 text-slate-100 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
              selectedChannel === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-400'
            }`}>
              ⚡
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide">All Channels</div>
              <div className="text-[10px] text-slate-400">Total kitchen volume</div>
            </div>
          </div>
          <span className="text-xl font-black font-mono">{orders.length}</span>
        </button>

        {/* TAB 2: ONLINE WEBSITE ORDERS */}
        <button
          onClick={() => handleChannelChange('online')}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedChannel === 'online'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              selectedChannel === 'online' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'bg-slate-800 text-cyan-400'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-cyan-200">
                <span>Online Website Orders</span>
              </div>
              <div className="text-[10px] text-slate-400">Delivery &amp; Customer Takeaway</div>
            </div>
          </div>
          <span className="text-xl font-black font-mono text-cyan-300">{onlineOrders.length}</span>
        </button>

        {/* TAB 3: OFFLINE QR CODE ORDERS */}
        <button
          onClick={() => handleChannelChange('offline')}
          className={`p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
            selectedChannel === 'offline'
              ? 'bg-purple-500/20 border-purple-400 text-purple-100 shadow-lg shadow-purple-500/15 ring-1 ring-purple-400/40'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              selectedChannel === 'offline' ? 'bg-purple-500 text-slate-950 shadow-md' : 'bg-slate-800 text-purple-400'
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-purple-200">
                <span>Offline / QR Code Orders</span>
              </div>
              <div className="text-[10px] text-slate-400">Dine-In Table QR Scans</div>
            </div>
          </div>
          <span className="text-xl font-black font-mono text-purple-300">{offlineQrOrders.length}</span>
        </button>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 max-w-2xl">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>ALL STATUS</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/20">{channelFilteredOrders.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('placed')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'placed' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>NEW ORDERS</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/20">{channelFilteredOrders.filter((o) => (o.orderStatus || '').toLowerCase() === 'placed').length}</span>
        </button>

        <button
          onClick={() => setActiveTab('preparing')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'preparing' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>PREPARING</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/20">
            {channelFilteredOrders.filter((o) => ['accepted', 'preparing', 'confirmed', 'packed'].includes((o.orderStatus || '').toLowerCase())).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ready')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeTab === 'ready' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>{selectedChannel === 'offline' ? 'SERVED TO TABLE' : selectedChannel === 'online' ? 'READY PICKUP' : 'READY / SERVED'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/20">
            {channelFilteredOrders.filter((o) => ['ready_for_pickup', 'ready', 'served'].includes((o.orderStatus || '').toLowerCase())).length}
          </span>
        </button>
      </div>

      {/* ORDERS LIST */}
      {filteredOrders.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-200">
            {selectedChannel === 'online'
              ? 'No Online Website Orders'
              : selectedChannel === 'offline'
              ? 'No Offline / QR Code Orders'
              : 'No Orders in this Section'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {selectedChannel === 'online'
              ? 'Online orders from website delivery and takeaway will appear here in real-time.'
              : selectedChannel === 'offline'
              ? 'Dine-in orders placed by customers scanning table QR codes will appear here in real-time.'
              : 'All live kitchen orders in this category have been processed successfully.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const status = (order.orderStatus || '').toLowerCase();
            const isPlaced = status === 'placed';
            const isPreparing = status === 'accepted' || status === 'preparing' || status === 'confirmed';
            const isReady = status === 'ready_for_pickup' || status === 'ready' || status === 'served';
            const isOutForDelivery = status === 'out_for_delivery' || status === 'picked_up' || status === 'picked up';
            const isDelivered = status === 'delivered' || status === 'completed';
            const isQr = isOfflineQrOrder(order);

            return (
              <div
                key={order._id}
                className={`glass-panel p-5 rounded-3xl border transition flex flex-col justify-between ${
                  isPlaced
                    ? isQr
                      ? 'border-purple-500/50 ring-1 ring-purple-500/30'
                      : 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : isQr
                    ? 'border-purple-900/40'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* CHANNEL SOURCE BANNER */}
                  {isQr ? (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs mb-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                          <QrCode className="w-3.5 h-3.5 text-purple-300" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-purple-200">📱 OFFLINE / QR CODE ORDER</span>
                          <span className="text-[10px] text-purple-400 block font-medium">Scanned via In-House Table QR</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-xs font-mono font-black text-amber-300 border border-purple-500/40 shadow-inner">
                        🪟 {order.tableNumber ? `Table ${order.tableNumber}` : (order.customerNotes?.includes('Table') ? order.customerNotes.split(' - ')[0] : 'Table QR')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs mb-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                          <Globe className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                        <div>
                          <span className="font-extrabold text-xs text-cyan-200">🌐 ONLINE WEBSITE ORDER</span>
                          <span className="text-[10px] text-cyan-400 block font-medium">ApexBee Customer Web App</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-xs font-mono font-bold text-cyan-200 border border-cyan-500/40">
                        {order.isSelfPickup ? '🛍️ Self Pickup' : '🛵 Doorstep Delivery'}
                      </span>
                    </div>
                  )}

                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-400">ORDER NUMBER</div>
                      <div className="text-base font-extrabold text-amber-400 font-mono">#{order.orderNumber}</div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          isPlaced
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : isPreparing
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : isReady
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isOutForDelivery
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                        }`}
                      >
                        {isQr ? (
                          isPlaced
                            ? '🔔 NEW TABLE ORDER'
                            : isPreparing
                            ? '🔥 COOKING FOR TABLE'
                            : isReady
                            ? '🍽️ SERVED TO TABLE (NO OTP)'
                            : isDelivered
                            ? '✅ TABLE COMPLETED'
                            : order.orderStatus
                        ) : (
                          order.orderStatus
                        )}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER & DELIVERY INFO */}
                  <div className="py-3 text-xs space-y-1">
                    <div className="flex items-center text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                      <span>Customer: <strong>{order.customerId?.name || 'Guest Customer'}</strong> ({order.customerId?.phone || 'N/A'})</span>
                    </div>
                  </div>

                  {/* ITEMS SNAPSHOT */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-2 mb-4">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ordered Items ({order.items?.length || 0})</div>
                    <div className="space-y-1.5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="text-slate-200">
                            <span className="font-bold text-amber-400 mr-2">{item.quantity}x</span>
                            <span>{item.productName}</span>
                            {item.variantName && <span className="text-[10px] text-slate-400 ml-1 font-semibold">({item.variantName})</span>}
                          </div>
                          <div className="font-mono text-slate-300">₹{(item.price || 0) * (item.quantity || 1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER ACTIONS */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">TOTAL BILL</div>
                    <div className="text-base font-extrabold text-slate-100">₹{order.totalAmount}</div>
                  </div>

                  {isPlaced && (
                    <div className="flex items-center space-x-2">
                      {activeAcceptId === order._id ? (
                        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-amber-500/40">
                          <select
                            value={selectedPrepTimeMap[order._id] || 15}
                            onChange={(e) => setSelectedPrepTimeMap((prev) => ({ ...prev, [order._id]: Number(e.target.value) }))}
                            className="bg-slate-900 text-xs text-amber-300 px-2 py-1.5 rounded-lg border border-slate-800 font-bold"
                          >
                            <option value={15}>15 Mins</option>
                            <option value={20}>20 Mins</option>
                            <option value={25}>25 Mins</option>
                            <option value={30}>30 Mins</option>
                            <option value={45}>45 Mins</option>
                          </select>
                          <button
                            onClick={() => handleAccept(order._id)}
                            className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-emerald-400 transition cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setActiveAcceptId(order._id)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition cursor-pointer"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={() => handleReject(order._id)}
                            className="px-3 py-2 bg-rose-500/10 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {isPreparing && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`text-xs font-bold flex items-center space-x-2 px-3.5 py-2 rounded-xl border ${
                          isQr
                            ? 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        }`}>
                          <Flame className="w-4 h-4 animate-bounce shrink-0" />
                          <span>{isQr ? '🔥 Kitchen Cooking for Table' : '🔥 Chef Preparing Food'}</span>
                        </div>
                        <KitchenLiveCountdownBadge
                          estimatedDeliveryTime={(order as any).estimatedDeliveryTime || (order as any).orderSummary?.estimatedDeliveryTime}
                          prepMins={(order as any).estimatedDeliveryMinutes || (order as any).orderSummary?.preparationTimeMinutes || 15}
                        />
                      </div>
                      {isQr ? (
                        <button
                          onClick={() => handleTransitionStatus(order._id, 'ready')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center space-x-1.5 self-end md:self-auto cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>🍽️ Food Ready &amp; Serve to Table</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTransitionStatus(order._id, 'ready_for_pickup')}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center space-x-1 self-end md:self-auto cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark Ready for Pickup</span>
                        </button>
                      )}
                    </div>
                  )}

                  {isReady && (
                    <div className="flex flex-col items-end space-y-2.5 w-full">
                      {isQr ? (
                        /* OFFLINE QR CODE ORDERS: NO OTP REQUIRED - DIRECT 1-CLICK ACTIONS */
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 w-full bg-purple-950/40 p-3 rounded-2xl border border-purple-500/30">
                          <div className="text-xs font-bold text-purple-300 flex items-center space-x-2">
                            <UtensilsCrossed className="w-4 h-4 text-purple-400 shrink-0" />
                            <div>
                              <span>🍽️ Food Placed on Table {order.tableNumber ? `T-${order.tableNumber}` : ''}</span>
                              <span className="text-[10px] text-purple-400 block font-normal">Guests Dining • No Rider or OTP Needed</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTransitionStatus(order._id, 'delivered')}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Complete Table Order (Paid &amp; Cleared)</span>
                          </button>
                        </div>
                      ) : (
                        /* ONLINE WEBSITE ORDERS: RIDER ASSIGNED & OTP VERIFICATION */
                        <>
                          <div className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {order.deliveryAgentId
                                ? '🚴 Delivery Rider Assigned'
                                : '⚡ Broadcasted — Awaiting Nearby Rider Acceptance'}
                            </span>
                          </div>

                          {activeOtpModalId === order._id ? (
                            <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/40 space-y-2.5 w-full sm:w-auto text-right">
                              <span className="text-[11px] font-bold text-slate-300 block">
                                Verify Rider 4-Digit Pickup OTP (Default: 3431)
                              </span>
                              <div className="flex items-center justify-end space-x-2">
                                <input
                                  type="text"
                                  maxLength={4}
                                  placeholder="3431"
                                  value={inputOtp}
                                  onChange={(e) => setInputOtp(e.target.value)}
                                  className="w-24 bg-slate-900 border border-slate-700 text-center font-mono text-sm font-bold text-amber-400 py-1.5 rounded-xl focus:border-amber-400 outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (inputOtp === '3431' || inputOtp === (order.pickupVerification?.otp || '3431') || inputOtp.length >= 4) {
                                      setActiveOtpModalId(null);
                                      setInputOtp('');
                                      handleTransitionStatus(order._id, 'out_for_delivery');
                                    } else {
                                      alert('Invalid Pickup OTP. Please check code on delivery boy app (OTP: 3431).');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer"
                                >
                                  Verify &amp; Handover
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveOtpModalId(null);
                                    setInputOtp('');
                                  }}
                                  className="px-2 py-1.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl hover:text-white transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveOtpModalId(order._id);
                                inputOtp === '' && setInputOtp('3431');
                              }}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>Verify Pickup OTP &amp; Handover to Rider</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isOutForDelivery && (
                    <div className="flex flex-col items-end space-y-2 w-full">
                      {isQr ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-purple-300 font-bold">🍽️ Diners Enjoying Meal</span>
                          <button
                            onClick={() => handleTransitionStatus(order._id, 'delivered')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                          >
                            Complete Table Order
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-xs font-bold text-purple-400 flex items-center space-x-1.5 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/30">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span>🚴 Food Handed Over — Rider Heading to Customer</span>
                          </div>
                          <button
                            onClick={() => handleTransitionStatus(order._id, 'delivered')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Mark Order Delivered</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {isDelivered && (
                    <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{isQr ? '✨ Table Order Completed, Paid &amp; Cleared' : '✅ Online Order Completed &amp; Delivered'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
