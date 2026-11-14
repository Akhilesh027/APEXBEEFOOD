import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Printer,
  ChevronRight,
  Filter,
  DollarSign,
  ChefHat,
  Snowflake,
  PackageCheck,
  X,
  FileText,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { bakeryOrderStorage, ICakeAdvanceOrder } from '../../services/bakeryOrderStorage';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';

const PIPELINE_STAGES: Array<{
  key: ICakeAdvanceOrder['status'];
  label: string;
  icon: any;
  color: string;
  headerBg: string;
}> = [
  { key: 'BOOKED', label: '1. Booked & Scheduled', icon: Calendar, color: 'text-amber-400', headerBg: 'bg-amber-500/10 border-amber-500/30' },
  { key: 'DESIGN_CONFIRMED', label: '2. Design Confirmed', icon: Sparkles, color: 'text-blue-400', headerBg: 'bg-blue-500/10 border-blue-500/30' },
  { key: 'BAKING', label: '3. Baking & Frosting', icon: ChefHat, color: 'text-purple-400', headerBg: 'bg-purple-500/10 border-purple-500/30' },
  { key: 'READY_IN_CHILLER', label: '4. Ready in Chiller ❄️', icon: Snowflake, color: 'text-cyan-400', headerBg: 'bg-cyan-500/10 border-cyan-500/30' },
  { key: 'DELIVERED', label: '5. Picked Up / Delivered', icon: PackageCheck, color: 'text-emerald-400', headerBg: 'bg-emerald-500/10 border-emerald-500/30' },
];

export const AdvanceCakeOrdersPage: React.FC = () => {
  const restaurant = useFoodAuthStore((state) => state.restaurant);
  const [orders, setOrders] = useState<ICakeAdvanceOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'EGGLESS' | 'CONTAINS_EGG'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'KANBAN' | 'LIST'>('KANBAN');

  // Form State for New Custom Cake Order
  const [newOrder, setNewOrder] = useState<Partial<ICakeAdvanceOrder>>({
    customerName: '',
    customerPhone: '',
    cakeName: '',
    flavour: 'Chocolate Truffle',
    weight: '1 kg',
    foodType: 'EGGLESS',
    messageOnCake: '',
    specialInstructions: '',
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTimeSlot: '18:00',
    orderType: 'PICKUP',
    deliveryAddress: '',
    totalAmount: 1000,
    advancePaid: 500,
  });

  const loadData = () => {
    const list = bakeryOrderStorage.getCakeOrders(restaurant?._id);
    setOrders(list);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('apexbee:cake_order_updated', handleUpdate);
    return () => window.removeEventListener('apexbee:cake_order_updated', handleUpdate);
  }, [restaurant?._id]);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Date filter
      if (dateFilter === 'TODAY' && o.pickupDate !== todayStr) return false;
      if (dateFilter === 'TOMORROW' && o.pickupDate !== tomorrowStr) return false;
      if (dateFilter === 'UPCOMING' && (o.pickupDate < todayStr || o.status === 'DELIVERED')) return false;
      if (dateFilter === 'COMPLETED' && o.status !== 'DELIVERED') return false;

      // Dietary filter
      if (dietaryFilter !== 'ALL' && o.foodType !== dietaryFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.includes(q);
        const matchCake = o.cakeName.toLowerCase().includes(q);
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchMsg = (o.messageOnCake || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCake && !matchNum && !matchMsg) return false;
      }

      return true;
    });
  }, [orders, dateFilter, dietaryFilter, searchQuery, todayStr, tomorrowStr]);

  // Metrics
  const dueTodayCount = orders.filter((o) => o.pickupDate === todayStr && o.status !== 'DELIVERED').length;
  const inBakingCount = orders.filter((o) => o.status === 'BAKING').length;
  const readyInChillerCount = orders.filter((o) => o.status === 'READY_IN_CHILLER').length;
  const balanceToCollectToday = orders
    .filter((o) => o.pickupDate === todayStr && o.status !== 'DELIVERED')
    .reduce((sum, o) => sum + (o.balanceDue || 0), 0);

  // Status transition handlers
  const handleNextStatus = (order: ICakeAdvanceOrder) => {
    const sequence: Array<ICakeAdvanceOrder['status']> = [
      'BOOKED',
      'DESIGN_CONFIRMED',
      'BAKING',
      'READY_IN_CHILLER',
      'DELIVERED',
    ];
    const currentIndex = sequence.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const next = sequence[currentIndex + 1];
      const updated = bakeryOrderStorage.updateCakeOrderStatus(order.id, next, restaurant?._id);
      setOrders(updated);
    }
  };

  const handleUpdateStatus = (id: string, status: ICakeAdvanceOrder['status']) => {
    const updated = bakeryOrderStorage.updateCakeOrderStatus(id, status, restaurant?._id);
    setOrders(updated);
  };

  const handleSaveNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.cakeName) return;

    const total = Number(newOrder.totalAmount) || 0;
    const advance = Number(newOrder.advancePaid) || 0;
    const balance = Math.max(0, total - advance);

    const created: ICakeAdvanceOrder = {
      id: `cake-${Date.now()}`,
      restaurantId: restaurant?._id,
      orderNumber: `CK-${Math.floor(100 + Math.random() * 900)}`,
      customerName: newOrder.customerName || 'Customer',
      customerPhone: newOrder.customerPhone || '',
      cakeName: newOrder.cakeName || 'Custom Cake',
      weight: newOrder.weight || '1 kg',
      flavour: newOrder.flavour || 'Chocolate Truffle',
      foodType: newOrder.foodType || 'EGGLESS',
      messageOnCake: newOrder.messageOnCake || '',
      specialInstructions: newOrder.specialInstructions || '',
      pickupDate: newOrder.pickupDate || todayStr,
      pickupTimeSlot: newOrder.pickupTimeSlot || '18:00',
      orderType: newOrder.orderType || 'PICKUP',
      deliveryAddress: newOrder.deliveryAddress || '',
      totalAmount: total,
      advancePaid: advance,
      balanceDue: balance,
      paymentStatus: balance === 0 ? 'FULLY_PAID' : advance > 0 ? 'ADVANCE_PAID' : 'PAY_ON_PICKUP',
      status: 'BOOKED',
      createdAt: new Date().toISOString(),
    };

    const updated = bakeryOrderStorage.saveCakeOrder(created, restaurant?._id);
    setOrders(updated);
    setIsModalOpen(false);
    setNewOrder({
      customerName: '',
      customerPhone: '',
      cakeName: '',
      flavour: 'Chocolate Truffle',
      weight: '1 kg',
      foodType: 'EGGLESS',
      messageOnCake: '',
      specialInstructions: '',
      pickupDate: todayStr,
      pickupTimeSlot: '18:00',
      orderType: 'PICKUP',
      totalAmount: 1000,
      advancePaid: 500,
    });
  };

  const handlePrintSlip = (order: ICakeAdvanceOrder) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Bakery Decorator Slip - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 24px; color: #111; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 14px; }
            .tag { display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px; margin-top: 6px; }
            .eggless { background: #dcfce7; color: #166534; }
            .egg { background: #fef3c7; color: #92400e; }
            .cake-msg { background: #fdf2f8; border-left: 4px solid #db2777; padding: 10px; font-size: 16px; font-weight: 800; font-style: italic; margin: 14px 0; color: #9d174d; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
            .strong { font-weight: 700; }
            .footer { margin-top: 18px; border-top: 1px solid #ddd; padding-top: 10px; text-align: center; font-size: 11px; color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🎂 APEXBEE BAKERY</h2>
            <p style="margin: 0; font-size: 13px; font-weight: bold;">KITCHEN &amp; DECORATOR WORK SLIP</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: 900;">${order.orderNumber}</p>
            <span class="tag ${order.foodType === 'EGGLESS' ? 'eggless' : 'egg'}">
              ${order.foodType === 'EGGLESS' ? '🌿 100% EGGLESS' : '🥚 CONTAINS EGG'}
            </span>
          </div>

          <div class="info-row">
            <span>Cake:</span>
            <span class="strong">${order.cakeName}</span>
          </div>
          <div class="info-row">
            <span>Weight:</span>
            <span class="strong" style="font-size: 15px;">${order.weight}</span>
          </div>
          <div class="info-row">
            <span>Flavour:</span>
            <span class="strong">${order.flavour}</span>
          </div>

          <div style="margin-top: 12px; font-size: 12px; font-weight: bold; color: #666;">MESSAGE ON CAKE / INSCRIPTION:</div>
          <div class="cake-msg">"${order.messageOnCake || 'No Message'}"</div>

          ${order.specialInstructions ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 8px; font-size: 12px; margin-top: 8px;">
              <strong>Decorator Notes:</strong> ${order.specialInstructions}
            </div>
          ` : ''}

          <div style="margin-top: 14px; border-top: 1px dashed #ccc; padding-top: 10px;">
            <div class="info-row">
              <span>Pickup Date:</span>
              <span class="strong">${order.pickupDate}</span>
            </div>
            <div class="info-row">
              <span>Pickup Time:</span>
              <span class="strong" style="color: #dc2626; font-size: 15px;">${order.pickupTimeSlot}</span>
            </div>
            <div class="info-row">
              <span>Customer:</span>
              <span>${order.customerName} (${order.customerPhone})</span>
            </div>
            <div class="info-row">
              <span>Balance on Pickup:</span>
              <span class="strong" style="color: ${order.balanceDue > 0 ? '#b91c1c' : '#15803d'}">₹${order.balanceDue}</span>
            </div>
          </div>

          <div class="footer">
            Printed: ${new Date().toLocaleString()} • Keep chilled until pickup
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 text-lg">
              🎂
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-100 font-heading">
                Advance Cake Orders &amp; Custom Inscriptions
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Track custom celebration cakes, frosting stages, messages on cake, and scheduled pickup slots.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* VIEW SWITCHER */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('KANBAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'KANBAN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pipeline Board
            </button>
            <button
              onClick={() => setActiveView('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'LIST' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              List View
            </button>
          </div>

          {/* NEW CAKE BOOKING BUTTON */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Book Custom Cake</span>
          </button>
        </div>
      </div>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="text-[11px] font-medium text-slate-400">Total Bookings</div>
          <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{orders.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All scheduled cakes</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-slate-900 border border-amber-500/40 shadow-lg shadow-amber-500/5">
          <div className="text-[11px] font-bold text-amber-400">Due Today</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{dueTodayCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Need pickup / delivery</div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30">
          <div className="text-[11px] font-bold text-purple-400">Baking / Decorating</div>
          <div className="text-2xl font-black text-purple-300 mt-1 font-mono">{inBakingCount}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">In kitchen production</div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
          <div className="text-[11px] font-bold text-cyan-400">Ready in Chiller ❄️</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 font-mono">{readyInChillerCount}</div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Ready for hand-over</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="text-[11px] font-bold text-emerald-400">Today's Due Balance</div>
          <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">₹{balanceToCollectToday}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">To collect on pickup</div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, cake flavor, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* DATE FILTER TABS */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['ALL', 'TODAY', 'TOMORROW', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDateFilter(tab)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  dateFilter === tab ? 'bg-pink-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Dates' : tab === 'TODAY' ? 'Due Today' : tab === 'TOMORROW' ? 'Tomorrow' : tab === 'UPCOMING' ? 'Upcoming' : 'Delivered'}
              </button>
            ))}
          </div>

          {/* DIETARY FILTER */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                dietaryFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter('EGGLESS')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center space-x-1 ${
                dietaryFilter === 'EGGLESS' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Eggless</span>
            </button>
            <button
              onClick={() => setDietaryFilter('CONTAINS_EGG')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center space-x-1 ${
                dietaryFilter === 'CONTAINS_EGG' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Egg</span>
            </button>
          </div>
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {activeView === 'KANBAN' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {PIPELINE_STAGES.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.key);
            const Icon = col.icon;

            return (
              <div key={col.key} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-3 space-y-3 min-h-[500px]">
                {/* COLUMN HEADER */}
                <div className={`p-3 rounded-2xl border flex items-center justify-between ${col.headerBg}`}>
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${col.color}`} />
                    <span className="font-extrabold text-xs text-slate-200">{col.label}</span>
                  </div>
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-full bg-slate-950/60 text-slate-300">
                    {colOrders.length}
                  </span>
                </div>

                {/* COLUMN CARDS */}
                <div className="space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-600 text-xs italic">
                      No cakes in this stage
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const isDueToday = order.pickupDate === todayStr;

                      return (
                        <div
                          key={order.id}
                          className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 space-y-2.5 transition shadow-lg group"
                        >
                          {/* TOP CARD BAR */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-amber-400">
                              #{order.orderNumber}
                            </span>
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                  order.foodType === 'EGGLESS'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {order.foodType === 'EGGLESS' ? '🌿 Eggless' : '🥚 Egg'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                                {order.weight}
                              </span>
                            </div>
                          </div>

                          {/* CAKE TITLE */}
                          <div>
                            <h4 className="text-xs font-black text-slate-100 group-hover:text-amber-300 transition line-clamp-1">
                              {order.cakeName}
                            </h4>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate">{order.flavour}</div>
                          </div>

                          {/* MESSAGE ON CAKE RIBBON */}
                          {order.messageOnCake && (
                            <div className="p-2 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-l-2 border-amber-500 rounded-r-lg text-xs font-bold text-amber-200 italic">
                              "{order.messageOnCake}"
                            </div>
                          )}

                          {/* SPECIAL NOTES */}
                          {order.specialInstructions && (
                            <div className="text-[10px] text-slate-400 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 line-clamp-2">
                              <strong className="text-slate-300">Note:</strong> {order.specialInstructions}
                            </div>
                          )}

                          {/* SCHEDULED PICKUP TIME */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                            <div className="flex items-center space-x-1 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className={`font-semibold ${isDueToday ? 'text-amber-300 font-bold' : ''}`}>
                                {isDueToday ? 'Today' : order.pickupDate} @ {order.pickupTimeSlot}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold">
                              {order.orderType === 'PICKUP' ? 'Counter' : 'Delivery'}
                            </span>
                          </div>

                          {/* PAYMENT & CUSTOMER INFO */}
                          <div className="flex items-center justify-between text-[11px] bg-slate-900/80 p-2 rounded-xl">
                            <div>
                              <div className="font-bold text-slate-200 text-xs truncate max-w-[110px]">
                                {order.customerName}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">{order.customerPhone}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-200 text-xs">₹{order.totalAmount}</div>
                              <div
                                className={`text-[10px] font-bold ${
                                  order.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {order.balanceDue > 0 ? `₹${order.balanceDue} Due` : 'Fully Paid'}
                              </div>
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <div className="flex items-center space-x-1">
                              {order.customerPhone && (
                                <a
                                  href={`https://wa.me/91${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Hello ${order.customerName}! Your custom cake order (#${order.orderNumber}: "${order.cakeName}") status update from ApexBee Bakery: it is now ${order.status.replace(/_/g, ' ')}. Scheduled pickup: ${order.pickupDate} at ${order.pickupTimeSlot}. Thank you!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition"
                                  title="Send WhatsApp Update to Customer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {order.customerPhone && (
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                  title="Call Customer"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                onClick={() => handlePrintSlip(order)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                title="Print Kitchen & Decorator Work Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* MOVE TO NEXT STAGE */}
                            {col.key !== 'DELIVERED' && (
                              <button
                                onClick={() => handleNextStatus(order)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition flex items-center space-x-1"
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-extrabold">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Cake Details</th>
                <th className="p-4">Message on Cake</th>
                <th className="p-4">Pickup Date &amp; Time</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 italic">
                    No custom cake orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/80 transition">
                    <td className="p-4 font-mono font-black text-amber-400">#{order.orderNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{order.cakeName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                        <span>{order.weight}</span>
                        <span>•</span>
                        <span className={order.foodType === 'EGGLESS' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                          {order.foodType === 'EGGLESS' ? '🌿 Eggless' : '🥚 Egg'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 max-w-[220px]">
                      {order.messageOnCake ? (
                        <span className="italic text-amber-300 font-semibold line-clamp-2">
                          "{order.messageOnCake}"
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      <div className={order.pickupDate === todayStr ? 'text-amber-400 font-bold' : ''}>
                        {order.pickupDate}
                      </div>
                      <div className="text-[11px] text-slate-400">{order.pickupTimeSlot}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-100">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 text-xs text-slate-200 px-2.5 py-1 rounded-xl font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="BOOKED">Booked</option>
                        <option value="DESIGN_CONFIRMED">Design Confirmed</option>
                        <option value="BAKING">Baking &amp; Decorating</option>
                        <option value="READY_IN_CHILLER">Ready in Chiller</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="font-mono font-bold">₹{order.totalAmount}</div>
                      <div className={`text-[10px] font-bold ${order.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {order.balanceDue > 0 ? `₹${order.balanceDue} Due` : 'Paid'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handlePrintSlip(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                          title="Print Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW CUSTOM CAKE ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-base">🎂</span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 font-heading">
                    Book Advance Custom Cake Order
                  </h3>
                  <p className="text-xs text-slate-400">Record celebration cake flavor, inscription message &amp; pickup slot.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewOrder} className="space-y-4">
              {/* CUSTOMER DETAILS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Mehta"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* CAKE SELECTION */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cake Name / Flavour *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Belgian Dark Chocolate Truffle"
                    value={newOrder.cakeName}
                    onChange={(e) => setNewOrder({ ...newOrder, cakeName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Weight *</label>
                  <select
                    value={newOrder.weight}
                    onChange={(e) => setNewOrder({ ...newOrder, weight: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="0.5 kg">0.5 kg</option>
                    <option value="1 kg">1 kg</option>
                    <option value="1.5 kg">1.5 kg</option>
                    <option value="2 kg">2 kg</option>
                    <option value="2.5 kg">2.5 kg</option>
                    <option value="3 kg (2-Tier)">3 kg (2-Tier)</option>
                    <option value="5 kg+ (3-Tier)">5 kg+ (3-Tier)</option>
                  </select>
                </div>
              </div>

              {/* DIETARY TAG */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Dietary Tag *</label>
                  <select
                    value={newOrder.foodType}
                    onChange={(e) => setNewOrder({ ...newOrder, foodType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="EGGLESS">🌿 100% Eggless</option>
                    <option value="CONTAINS_EGG">🥚 Contains Egg</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Order Channel</label>
                  <select
                    value={newOrder.orderType}
                    onChange={(e) => setNewOrder({ ...newOrder, orderType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="PICKUP">Counter Pickup</option>
                    <option value="HOME_DELIVERY">Home Delivery</option>
                  </select>
                </div>
              </div>

              {/* MESSAGE ON CAKE - PROMINENT */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1">
                <label className="text-xs font-extrabold text-amber-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Message on Cake (Custom Inscription)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Happy 5th Birthday Kian! 🎈"
                  value={newOrder.messageOnCake}
                  onChange={(e) => setNewOrder({ ...newOrder, messageOnCake: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-100 font-semibold placeholder-amber-300/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* SPECIAL INSTRUCTIONS */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Special Decorating Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Golden pearls border, soft pastel blue frosting, less cream, sparkler candle."
                  value={newOrder.specialInstructions}
                  onChange={(e) => setNewOrder({ ...newOrder, specialInstructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* PICKUP SCHEDULE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Pickup / Delivery Date *</label>
                  <input
                    type="date"
                    required
                    value={newOrder.pickupDate}
                    onChange={(e) => setNewOrder({ ...newOrder, pickupDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Pickup Time Slot *</label>
                  <input
                    type="time"
                    required
                    value={newOrder.pickupTimeSlot}
                    onChange={(e) => setNewOrder({ ...newOrder, pickupTimeSlot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {newOrder.orderType === 'HOME_DELIVERY' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full street address &amp; landmark"
                    value={newOrder.deliveryAddress}
                    onChange={(e) => setNewOrder({ ...newOrder, deliveryAddress: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* PRICING & DEPOSIT */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newOrder.totalAmount}
                    onChange={(e) => setNewOrder({ ...newOrder, totalAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Advance Deposit (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newOrder.advancePaid}
                    onChange={(e) => setNewOrder({ ...newOrder, advancePaid: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Balance Due (₹)</label>
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold">
                    ₹{Math.max(0, (Number(newOrder.totalAmount) || 0) - (Number(newOrder.advancePaid) || 0))}
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Confirm &amp; Schedule Cake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvanceCakeOrdersPage;

