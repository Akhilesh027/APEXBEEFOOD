import React, { useState } from 'react';
import {
  Calculator,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Utensils,
  X,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { GenerateQRModal } from '../../components/common/GenerateQRModal';
import { qrMenuStorage, IQRRecord } from '../../services/qrMenuStorage';

interface IMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  foodType: 'VEG' | 'NON_VEG';
}

interface ICartItem extends IMenuItem {
  quantity: number;
  notes?: string;
}

export const POSTerminalPage: React.FC = () => {
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [quickQRToast, setQuickQRToast] = useState<string | null>(null);

  // Load real menu dishes and tables from backend
  React.useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      setLoadingMenu(true);
      try {
        const [dishes, tables] = await Promise.all([
          qrMenuStorage.loadRealMenuItems(),
          qrMenuStorage.loadTablesFromBackend(),
        ]);
        if (isMounted) {
          if (dishes && dishes.length > 0) {
            setMenuItems(dishes);
          }
          if (tables && tables.length > 0) {
            setAvailableTables(tables.map((t) => t.tableNumber));
            setSelectedTable(tables[0].tableNumber);
          }
        }
      } catch (e) {
      } finally {
        if (isMounted) setLoadingMenu(false);
      }
    };
    loadRealData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [menuItems]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (item: IMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean) as ICartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const gstAmount = Math.round((subtotal - discountAmount) * 0.05);
  const packagingFee = orderType === 'TAKEAWAY' ? 30 : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + gstAmount + packagingFee);

  const handleCompleteOrder = () => {
    if (cart.length === 0) return;
    const generatedOrderNum = `POS-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderSuccess(generatedOrderNum);
    setTimeout(() => {
      setOrderSuccess(null);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calculator className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              Point of Sale (POS) &amp; Quick Billing
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Fast touch billing terminal, table &amp; takeaway order punch, kitchen tickets, and payment settlement.
          </p>
        </div>

        {/* RIGHT CONTROLS: QR GENERATOR & ORDER TYPE */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate Table QR</span>
          </button>

          {/* ORDER TYPE SELECTOR */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderType === type
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEAWAY' ? 'Takeaway' : 'Direct Delivery'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* POS MAIN SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: MENU SELECTION (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {/* SEARCH & CONTROLS */}
          <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu items (e.g. Biryani, Naan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            {orderType === 'DINE_IN' && (
              <div className="flex items-center space-x-1.5">
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                >
                  {availableTables.map((t) => (
                    <option key={t} value={t}>Table {t}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsQRModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
                  title={`Configure QR Menu for ${selectedTable}`}
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* CATEGORY TABS */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* MENU ITEMS GRID */}
          {loadingMenu ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Clock className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
              <p className="text-sm font-semibold">Loading real menu items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
              <Utensils className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <h4 className="text-base font-bold text-slate-200">No Dishes in Menu</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No items match your filter.'
                  : 'Add dishes under Menu Management to populate them in POS and customer QR menus.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const inCartItem = cart.find((c) => c.id === item.id);
                const isVeg = item.foodType === 'VEG';

                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="cursor-pointer bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-3.5 transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isVeg ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                      </div>
                      <div className="font-bold text-xs text-slate-200 line-clamp-2 group-hover:text-amber-400 transition">
                        {item.name}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-slate-100">₹{item.price}</span>
                      {inCartItem ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                          {inCartItem.quantity} in bill
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: TICKET / BILLING CART (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between min-h-[580px]">
          <div>
            {/* TICKET HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black font-heading text-slate-100 text-base">Current Ticket</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {orderType === 'DINE_IN' ? selectedTable : orderType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{cart.length} distinct items added</div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* CUSTOMER QUICK FIELDS */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <input
                type="text"
                placeholder="Guest Mobile"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Guest Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CART ITEMS LIST */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  Cart is empty. Tap items on the left to add.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-200">{item.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">
                        ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:text-amber-400 text-slate-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:text-amber-400 text-slate-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BILL CALCULATION & PAYMENT */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            {/* DISCOUNT PILLS */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Apply Discount:</span>
              <div className="flex items-center space-x-1">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      discountPercent === d
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d === 0 ? 'None' : `${d}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* BREAKDOWN */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>GST (5%)</span>
                <span className="font-mono text-slate-200">₹{gstAmount}</span>
              </div>
              {packagingFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Packaging Charges</span>
                  <span className="font-mono text-slate-200">₹{packagingFee}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-2 border-t border-slate-800">
                <span>Grand Total</span>
                <span className="font-mono text-amber-400 text-base">₹{grandTotal}</span>
              </div>
            </div>

            {/* PAYMENT MODE SELECTOR */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['UPI', 'CARD', 'CASH'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMode(m)}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                    paymentMode === m
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {m === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                  {m === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                  {m === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                  <span>{m}</span>
                </button>
              ))}
            </div>

            {/* UPI & TABLE QR QUICK BOX */}
            {paymentMode === 'UPI' && (
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>Table {selectedTable} QR Menu &amp; UPI</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Scannable
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Guest can scan with phone camera to view configured dishes &amp; pay ₹{grandTotal} directly.
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/menu/view?table=${encodeURIComponent(selectedTable)}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] transition flex items-center justify-center space-x-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Simulate Scan (View Menu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQRModalOpen(true)}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition"
                  >
                    Customize Menu
                  </button>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => {
                  alert('Kitchen Order Ticket (KOT) sent to kitchen printer!');
                }}
                disabled={cart.length === 0}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-bold text-xs flex items-center space-x-1"
                title="Print KOT Ticket"
              >
                <Printer className="w-4 h-4" />
                <span>KOT</span>
              </button>

              <button
                onClick={handleCompleteOrder}
                disabled={cart.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Settle &amp; Print Bill (₹{grandTotal})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GENERATE QR CODE MODAL WITH MENU SELECTION */}
      <GenerateQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        defaultTable={selectedTable}
        posCartItems={cart.map((c) => ({ id: c.id, name: c.name }))}
        onQRGenerated={(newQR) => {
          setSelectedTable(newQR.tableNumber);
        }}
        onSimulateCustomerScan={(url) => window.open(url, '_blank')}
      />

      {/* SUCCESS POPUP */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100 font-heading">Order Settled Successfully!</h3>
            <p className="text-xs text-slate-400 mt-1">Invoice #{orderSuccess} printed &amp; recorded.</p>
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
              Mode: {paymentMode} • Amount: ₹{grandTotal}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
