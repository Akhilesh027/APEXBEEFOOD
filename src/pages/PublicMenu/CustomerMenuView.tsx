import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Utensils,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Flame,
  ArrowLeft,
  Share2,
  PhoneCall,
  Check,
  Receipt,
  Heart,
} from 'lucide-react';
import {
  qrMenuStorage,
  IQRRecord,
  IQRMenuItem,
  ICustomerPlacedOrder,
} from '../../services/qrMenuStorage';
import { foodService } from '../../services/foodService';

export const CustomerMenuView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const qrIdParam = searchParams.get('qr') || '';
  const tableParam = searchParams.get('table') || 'T-01';

  // State
  const [qrRecord, setQrRecord] = useState<IQRRecord | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<IQRMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Cart: Map of itemId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Call Waiter Modal / Toast
  const [waiterToast, setWaiterToast] = useState<string | null>(null);

  // Order Confirmed State
  const [confirmedOrder, setConfirmedOrder] = useState<ICustomerPlacedOrder | null>(null);

  // Load real QR Record and real dishes from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchScannedData = async () => {
      setLoading(true);
      const targetQuery = qrIdParam || tableParam;
      try {
        const res = await foodService.getScannedMenu(targetQuery);
        if (isMounted && res.data?.success) {
          if (res.data.table) {
            setQrRecord(res.data.table);
          }
          if (res.data.restaurant) {
            setRestaurantProfile(res.data.restaurant);
          }
          if (res.data.items && Array.isArray(res.data.items)) {
            const mapped: IQRMenuItem[] = res.data.items.map((i: any) => ({
              id: i._id || i.id,
              name: i.name,
              category: typeof i.categoryId === 'object' ? i.categoryId?.name || 'Main' : i.category || 'Main',
              price: i.offerPrice && i.offerPrice > 0 ? i.offerPrice : i.basePrice,
              foodType: i.foodType === 'NON_VEG' ? 'NON_VEG' : 'VEG',
              description: i.description || '',
              image: i.imageUrl || i.image || '',
              isBestseller: !!i.isBestseller,
              isRecommended: !!i.isRecommended,
              preparationMinutes: i.preparationTimeMinutes || 15,
            }));
            setMenuItems(mapped);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
      }

      // Local / Offline sync fallback
      if (isMounted) {
        const localTable = qrMenuStorage.getQRById(targetQuery);
        const allDishes = await qrMenuStorage.loadRealMenuItems();
        if (localTable) {
          setQrRecord(localTable);
          const filtered = qrMenuStorage.getMenuItemsForQR(localTable, allDishes);
          setMenuItems(filtered);
        } else {
          setQrRecord({
            id: qrIdParam || `qr-${tableParam.toLowerCase()}`,
            tableNumber: tableParam,
            section: 'Main Dining Hall',
            label: `Table ${tableParam} Digital Menu`,
            menuMode: 'ALL_ITEMS',
            selectedItemIds: allDishes.map((m) => m.id),
            discountPercent: 10,
            specialNote: 'Welcome! Order directly from this live digital menu.',
            createdAt: new Date().toISOString(),
            isActive: true,
            scanCount: 1,
          });
          setMenuItems(allDishes);
        }
        setLoading(false);
      }
    };

    fetchScannedData();
    qrMenuStorage.recordScan(qrIdParam || tableParam);

    return () => {
      isMounted = false;
    };
  }, [qrIdParam, tableParam]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((i) => set.add(i.category));
    return ['All', ...Array.from(set)];
  }, [menuItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchVeg = !vegOnly || item.foodType === 'VEG';
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchVeg && matchSearch;
    });
  }, [menuItems, selectedCategory, vegOnly, searchQuery]);

  // Cart operations
  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  // Calculations
  const cartEntries = Object.entries(cart)
    .map(([id, qty]) => {
      const item = menuItems.find((m) => m.id === id);
      return item ? { item, quantity: qty } : null;
    })
    .filter(Boolean) as Array<{ item: IQRMenuItem; quantity: number }>;

  const totalCartCount = cartEntries.reduce((sum, c) => sum + c.quantity, 0);
  const subtotal = cartEntries.reduce((sum, c) => sum + c.item.price * c.quantity, 0);
  const discountPercent = qrRecord?.discountPercent || 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const gstAmount = Math.round((subtotal - discountAmount) * 0.05);
  const grandTotal = Math.max(0, subtotal - discountAmount + gstAmount);

  // Place Order
  const handlePlaceOrder = () => {
    if (cartEntries.length === 0) return;

    const orderNum = `#TB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: ICustomerPlacedOrder = {
      orderId: `ord-${Date.now()}`,
      qrId: qrRecord?.id || qrIdParam,
      tableNumber: qrRecord?.tableNumber || tableParam,
      customerName: customerName || 'Dine-In Guest',
      customerPhone,
      items: cartEntries.map((c) => ({
        item: c.item,
        quantity: c.quantity,
        notes: orderNotes,
      })),
      subtotal,
      discount: discountAmount,
      gst: gstAmount,
      grandTotal,
      status: 'PLACED',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderNumber: orderNum,
    };

    qrMenuStorage.saveCustomerOrder(newOrder);
    setConfirmedOrder(newOrder);
    setIsCartOpen(false);
    setCart({});
  };

  const handleCallWaiter = (reason: string) => {
    const tableNum = qrRecord?.tableNumber || tableParam;
    let callType: any = 'CALL_WAITER';
    if (reason.toLowerCase().includes('water')) callType = 'WATER';
    else if (reason.toLowerCase().includes('bill') || reason.toLowerCase().includes('cheque')) callType = 'BILL';
    else if (reason.toLowerCase().includes('cutlery')) callType = 'CUTLERY';

    qrMenuStorage.saveWaiterCall({
      id: `call-${Date.now()}`,
      tableNumber: tableNum,
      section: qrRecord?.section || 'Main Dining Hall',
      type: callType,
      reason,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'PENDING',
    });

    setWaiterToast(`Call sent to Waiter for ${reason}. An attendant is coming to Table ${tableNum}!`);
    setTimeout(() => setWaiterToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] pb-24 md:pb-12 selection:bg-amber-500 selection:text-slate-950">
      {/* TOP NOTIFICATION TOAST */}
      {waiterToast && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto bg-amber-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-slate-900 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center space-x-2 text-xs">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>{waiterToast}</span>
          </div>
          <button onClick={() => setWaiterToast(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20 font-heading">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm md:text-base text-slate-100 font-heading leading-tight">
                  ApexBee Food
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                  Table {qrRecord?.tableNumber || tableParam}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                <span className="text-emerald-400 font-semibold">● Kitchen Active</span>
                <span>•</span>
                <span>{qrRecord?.section || 'Main Dining Hall'}</span>
              </div>
            </div>
          </div>

          {/* CALL ATTENDANT BUTTONS */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCallWaiter('Table Assistance')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1 transition border border-slate-700"
              title="Call Attendant"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Call Waiter</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER & RESTAURANT NOTICE */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-4 md:p-6 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wide uppercase border border-amber-500/30">
                  Contactless QR Menu
                </span>
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center space-x-1 border border-emerald-500/30 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    <span>{discountPercent}% Table Discount Included</span>
                  </span>
                )}
              </div>

              <h2 className="text-lg md:text-xl font-black font-heading text-slate-100 mt-2">
                {qrRecord?.label || `Welcome to Table ${qrRecord?.tableNumber || tableParam}!`}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {qrRecord?.specialNote || 'Order directly from this digital menu. Your dishes are cooked fresh and sent straight to the chef!'}
              </p>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-2 pt-1 md:pt-0">
              <button
                onClick={() => handleCallWaiter('Water Refill')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
              >
                💧 Water
              </button>
              <button
                onClick={() => handleCallWaiter('Cheque / Bill Request')}
                className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1"
              >
                <Receipt className="w-3 h-3 text-cyan-400" />
                <span>Ask Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="max-w-4xl mx-auto px-4 mt-4 sticky top-[65px] z-30">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 p-2.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes (Biryani, Paneer, Naan, Desserts)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* VEG ONLY TOGGLE */}
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border ${
              vegOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-3 h-3 rounded-full border border-emerald-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </span>
            <span>Veg Only</span>
          </button>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* DISHES LIST */}
      <main className="max-w-4xl mx-auto px-4 mt-2">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{filteredItems.length}</strong> items for Table {qrRecord?.tableNumber}
          </span>
          {qrRecord?.menuMode === 'CUSTOM_SELECTION' && (
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              Curated QR Menu
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
            <Clock className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
            <p className="text-sm font-semibold">Loading live menu...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
            <Utensils className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-slate-200">No Dishes Available</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All'
                ? 'No items match your selected filter.'
                : 'The restaurant has not added any dishes to this table menu yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => {
            const qty = cart[item.id] || 0;
            const isVeg = item.foodType === 'VEG';

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/40 rounded-3xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 pr-1">
                    {/* FOOD TYPE & CATEGORY */}
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          isVeg ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {item.isBestseller && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-300 font-extrabold flex items-center space-x-0.5">
                          <Flame className="w-2.5 h-2.5 text-amber-400" />
                          <span>Bestseller</span>
                        </span>
                      )}
                    </div>

                    {/* TITLE & DESCRIPTION */}
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition font-heading">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* PREP TIME */}
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-2">
                      <Clock className="w-3 h-3" />
                      <span>{item.preparationMinutes || 15} mins prep</span>
                    </div>
                  </div>

                  {/* DISH IMAGE */}
                  {item.image && (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* PRICE & ADD BUTTON */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-extrabold text-base text-slate-100">₹{item.price}</span>
                    {discountPercent > 0 && (
                      <span className="text-[10px] text-emerald-400 ml-1.5 font-bold">
                        ₹{Math.round(item.price * (1 - discountPercent / 100))} after promo
                      </span>
                    )}
                  </div>

                  {/* ADD TO CART / QUANTITY CONTROLLER */}
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(item.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD</span>
                    </button>
                  ) : (
                    <div className="flex items-center bg-slate-950 border border-amber-500/50 rounded-xl p-0.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-amber-400 hover:text-white transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono font-black text-amber-400 text-xs">{qty}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="p-1.5 text-amber-400 hover:text-white transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>

      {/* FLOATING CART BAR (WHEN ITEMS IN CART) */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-lg mx-auto">
          <div
            onClick={() => setIsCartOpen(true)}
            className="cursor-pointer bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between font-bold text-xs border-2 border-slate-900 animate-in slide-in-from-bottom-4 transition hover:scale-[1.01]"
          >
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-mono font-black text-[11px]">
                {totalCartCount}
              </span>
              <span>
                {totalCartCount} {totalCartCount === 1 ? 'Dish' : 'Dishes'} in Order
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-sm">₹{grandTotal}</span>
              <div className="flex items-center bg-slate-950/20 px-2 py-1 rounded-xl">
                <span>View Bill &amp; Order</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDER SUMMARY CART MODAL / DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            {/* DRAWER HEADER */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-black text-slate-100 font-heading text-sm">Table Order Review</h3>
                  <div className="text-[10px] text-slate-400">
                    Table {qrRecord?.tableNumber || tableParam} • Kitchen Order Ticket
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DRAWER BODY */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* ITEMS LIST */}
              <div className="space-y-2.5 divide-y divide-slate-800/40">
                {cartEntries.map(({ item, quantity }) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">
                        ₹{item.price} × {quantity} = ₹{item.price * quantity}
                      </div>
                    </div>

                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-amber-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono font-bold text-slate-100">{quantity}</span>
                      <button
                        onClick={() => addToCart(item.id)}
                        className="p-1 text-slate-400 hover:text-amber-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SPECIAL INSTRUCTIONS */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kitchen Notes / Special Requests (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, serve biryani first..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* GUEST QUICK CONTACT */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Guest Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">Mobile (For Bill SMS)</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* BILL SUMMARY */}
              <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-200">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>QR Table Promo ({discountPercent}%)</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>GST (5%)</span>
                  <span className="font-mono text-slate-200">₹{gstAmount}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-2 border-t border-slate-800">
                  <span>Grand Total</span>
                  <span className="font-mono text-amber-400 text-base">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* DRAWER FOOTER: SUBMIT */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center space-x-3">
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Back to Menu
              </button>

              <button
                onClick={handlePlaceOrder}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Place Order &amp; Send to Kitchen (₹{grandTotal})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER CONFIRMED SCREEN */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-slate-100 font-heading">Order Placed to Kitchen!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Your ticket <strong className="text-amber-400 font-mono">{confirmedOrder.orderNumber}</strong> has been punched for{' '}
              <strong className="text-slate-200">Table {confirmedOrder.tableNumber}</strong>.
            </p>

            <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items:</span>
                <span className="font-mono text-slate-200">{confirmedOrder.items.length} dishes</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Prep Time:</span>
                <span className="text-amber-400 font-bold">15 - 20 mins</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Bill:</span>
                <span className="font-mono font-extrabold text-slate-100">₹{confirmedOrder.grandTotal}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={() => setConfirmedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition"
              >
                Order More Items
              </button>

              <button
                onClick={() => handleCallWaiter('Order Status Check')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Track with Attendant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
