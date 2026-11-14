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
import { bakeryOrderStorage } from '../../services/bakeryOrderStorage';
import { fastFoodTokenStorage, IFastFoodToken } from '../../services/fastFoodTokenStorage';
import {
  tiffinMealsStorage,
  TiffinMealSlot,
  IDailyCurryBoard,
  getSlotDisplayMeta,
  categorizeTiffinStation,
} from '../../services/tiffinMealsStorage';
import { DailyCurryBoardModal } from '../../components/common/DailyCurryBoardModal';
import {
  curryPointStorage,
  IHandiPotItem,
  CurryPortionSize,
} from '../../services/curryPointStorage';
import { LiveHandiBoardModal } from '../../components/common/LiveHandiBoardModal';
import { foodService } from '../../services/foodService';
import { useFoodAuthStore } from '../../store/useFoodAuthStore';
import { getBusinessCapabilities } from '../../utils/businessCapabilities';

interface IMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  foodType: 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
}

interface ICartItem extends IMenuItem {
  quantity: number;
  notes?: string;
}

export const POSTerminalPage: React.FC = () => {
  const restaurant = useFoodAuthStore((state) => state.restaurant);
  const caps = React.useMemo(
    () => getBusinessCapabilities(restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines),
    [restaurant?.businessType, restaurant?.diningEnabled, restaurant?.cuisines]
  );

  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>(
    caps.defaultOrderType
  );

  // Sync order type when format changes or loads
  React.useEffect(() => {
    setOrderType(caps.defaultOrderType);
  }, [caps.defaultOrderType]);

  const [selectedTable, setSelectedTable] = useState('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'EGG' | 'NON_VEG'>('ALL');
  const [cakeMessage, setCakeMessage] = useState('');
  const [advanceDate, setAdvanceDate] = useState('');
  const [advanceTime, setAdvanceTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<ICartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [lastGeneratedToken, setLastGeneratedToken] = useState<IFastFoodToken | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [quickQRToast, setQuickQRToast] = useState<string | null>(null);

  // Tiffins & Meals Specific State
  const [tiffinSlot, setTiffinSlot] = useState<TiffinMealSlot>(() =>
    tiffinMealsStorage.getActiveSlot(restaurant?._id)
  );
  const [dailyBoard, setDailyBoard] = useState<IDailyCurryBoard>(() =>
    tiffinMealsStorage.getDailyBoard(restaurant?._id)
  );
  const [isParcelBox, setIsParcelBox] = useState<boolean>(false);
  const [parcelChargeAmount] = useState<number>(10);
  const [isDailyBoardModalOpen, setIsDailyBoardModalOpen] = useState<boolean>(false);
  const [couponPrintMode, setCouponPrintMode] = useState<'COMBINED' | 'STATION_SPLIT'>('COMBINED');

  // Curry Point Specific State
  const [selectedPortionSize, setSelectedPortionSize] = useState<CurryPortionSize>('SMALL');
  const [hasOwnDabba, setHasOwnDabba] = useState<boolean>(false);
  const [containerChargeAmount] = useState<number>(5);
  const [isHandiModalOpen, setIsHandiModalOpen] = useState<boolean>(false);
  const [curryPots, setCurryPots] = useState<IHandiPotItem[]>(() =>
    curryPointStorage.getPots(restaurant?._id)
  );

  // Load real menu dishes and tables for this specific restaurant
  React.useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      setLoadingMenu(true);
      try {
        const [itemRes, tables] = await Promise.all([
          foodService.getMenuItems().catch(() => ({ data: { items: [] } })),
          caps.canManageTables ? qrMenuStorage.loadTablesFromBackend().catch(() => []) : Promise.resolve([]),
        ]);
        if (isMounted) {
          const rawItems = itemRes.data?.items;
          if (Array.isArray(rawItems)) {
            const mapped: IMenuItem[] = rawItems.map((i: any) => ({
              id: i._id || i.id,
              name: i.name,
              category: typeof i.categoryId === 'object' ? i.categoryId?.name || 'General' : i.category || 'General',
              price: i.offerPrice && i.offerPrice > 0 ? i.offerPrice : i.basePrice,
              foodType: (i.foodType === 'EGG' || i.foodType === 'NON_VEG' || i.foodType === 'VEGAN') ? i.foodType : 'VEG',
            }));
            setMenuItems(mapped);
          } else {
            setMenuItems([]);
          }

          if (tables && tables.length > 0) {
            setAvailableTables(tables.map((t: any) => t.tableNumber));
            setSelectedTable(tables[0].tableNumber);
          } else {
            setAvailableTables([]);
            setSelectedTable('');
          }
        }
      } catch (e) {
        if (isMounted) setMenuItems([]);
      } finally {
        if (isMounted) setLoadingMenu(false);
      }
    };
    loadRealData();
    return () => {
      isMounted = false;
    };
  }, [restaurant?._id, caps.canManageTables]);

  const effectiveMenuItems = React.useMemo(() => {
    if (caps.isCurryPoint && curryPots.length > 0) {
      return curryPots
        .filter((p) => p.potStatus !== 'FINISHED')
        .map((p) => {
          const price =
            selectedPortionSize === 'LARGE'
              ? p.priceLarge
              : selectedPortionSize === 'MEDIUM'
              ? p.priceMedium
              : p.priceSmall;
          const portionText =
            p.category === 'STAPLES'
              ? (p.name.includes('Phulka') ? 'Per Pc' : selectedPortionSize === 'LARGE' ? 'Full Pack' : 'Single Pack')
              : selectedPortionSize === 'LARGE'
              ? '1000ml (Full)'
              : selectedPortionSize === 'MEDIUM'
              ? '500ml (Half)'
              : '250ml (Small)';
          return {
            id: `${p.id}-${selectedPortionSize}`,
            name: `${p.name} [${portionText}]`,
            category: p.category.replace(/_/g, ' '),
            price,
            foodType: p.foodType,
          };
        });
    }
    return menuItems;
  }, [caps.isCurryPoint, curryPots, selectedPortionSize, menuItems]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    effectiveMenuItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [effectiveMenuItems]);

  const filteredItems = effectiveMenuItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiet =
      dietaryFilter === 'ALL' ||
      (dietaryFilter === 'VEG' && (item.foodType === 'VEG' || item.foodType === 'VEGAN')) ||
      (dietaryFilter === 'EGG' && item.foodType === 'EGG') ||
      (dietaryFilter === 'NON_VEG' && item.foodType === 'NON_VEG');
    return matchesCat && matchesSearch && matchesDiet;
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
  const packagingFee = caps.isCurryPoint
    ? (!hasOwnDabba ? containerChargeAmount : 0)
    : caps.isTiffinsMeals
    ? (isParcelBox || orderType === 'TAKEAWAY' ? parcelChargeAmount : 0)
    : (orderType === 'TAKEAWAY' ? 30 : 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + gstAmount + packagingFee);

  const handlePrintCurrySlip = () => {
    curryPointStorage.printCurryParcelSlip(
      {
        orderNumber: lastGeneratedToken?.orderNumber || `POS-${Math.floor(1000 + Math.random() * 9000)}`,
        tokenDisplay: lastGeneratedToken?.tokenDisplay || `#${Math.floor(10 + Math.random() * 89)}`,
        customerName,
        customerPhone,
        hasOwnDabba,
        containerCharge: !hasOwnDabba ? containerChargeAmount : 0,
        items: cart.map((c) => ({
          name: c.name,
          quantity: c.quantity,
          price: c.price * c.quantity,
          portionLabel: c.notes,
        })),
        totalAmount: grandTotal,
        paymentMode,
        createdAt: new Date().toISOString(),
      },
      restaurant?.restaurantName || 'APEXBEE CURRY POINT'
    );
  };

  const handleAddPhulkas = (count: number) => {
    const phulkaPrice = 10;
    const phulkaItem: ICartItem = {
      id: `staple-phulka-${Date.now()}-${count}`,
      name: `Hot Phulkas (${count} Pcs)`,
      category: 'STAPLES',
      price: phulkaPrice * count,
      quantity: 1,
      foodType: 'VEG',
      notes: `${count} Hot Phulkas`,
    };
    setCart((prev) => [...prev, phulkaItem]);
  };

  const handlePrintTiffinCoupons = (mode: 'COMBINED' | 'STATION_SPLIT') => {
    tiffinMealsStorage.printCombinedOrSplitCoupons(
      {
        orderNumber: lastGeneratedToken?.orderNumber || `POS-${Math.floor(1000 + Math.random() * 9000)}`,
        tokenDisplay: lastGeneratedToken?.tokenDisplay || `#${Math.floor(10 + Math.random() * 89)}`,
        customerName,
        customerPhone,
        isParcel: orderType === 'TAKEAWAY' || isParcelBox,
        parcelCharge: isParcelBox || orderType === 'TAKEAWAY' ? parcelChargeAmount : 0,
        items: cart.map((c) => ({
          name: c.name,
          quantity: c.quantity,
          price: c.price,
          station: categorizeTiffinStation(c.name),
        })),
        totalAmount: grandTotal,
        paymentMode,
        createdAt: new Date().toISOString(),
      },
      restaurant?.restaurantName || 'APEXBEE TIFFINS & MEALS',
      mode
    );
  };

  const handlePrintTokenSlip = (tok: IFastFoodToken) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    printWin.document.write(`
      <html>
        <head>
          <title>Token Slip ${tok.tokenDisplay}</title>
          <style>
            body { font-family: monospace, sans-serif; padding: 14px; max-width: 280px; margin: 0 auto; color: #000; }
            .center { text-align: center; }
            .token-box { border: 3px solid #000; border-radius: 12px; padding: 8px; margin: 8px 0; text-align: center; }
            .token-num { font-size: 38px; font-weight: 900; margin: 0; line-height: 1; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3 style="margin: 0;">${restaurant?.restaurantName || 'APEXBEE FAST FOOD'}</h3>
            <p style="margin: 2px 0; font-size: 10px;">QUICK SERVICE TOKEN RECEIPT</p>
          </div>
          <div class="token-box">
            <div style="font-size: 10px; font-weight: bold;">COUNTER TOKEN</div>
            <div class="token-num">${tok.tokenDisplay}</div>
            <div style="font-size: 10px; margin-top: 2px;">${tok.orderNumber} • ${new Date(tok.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="divider"></div>
          <div>
            ${tok.items.map((item) => `<div class="row"><span class="bold">${item.quantity}x ${item.name}</span><span>${item.price ? '₹' + item.price * item.quantity : ''}</span></div>`).join('')}
          </div>
          <div class="divider"></div>
          <div class="row bold" style="font-size: 14px;">
            <span>TOTAL PAID</span>
            <span>₹${tok.totalAmount} (${tok.paymentMode})</span>
          </div>
          <div class="center" style="font-size: 10px; margin-top: 10px;">
            Please watch the Counter Screen for your Token!
          </div>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleCompleteOrder = () => {
    if (cart.length === 0) return;
    const generatedOrderNum = `POS-${Math.floor(1000 + Math.random() * 9000)}`;

    if (caps.canManageTokens || caps.isFastFood) {
      const tok = fastFoodTokenStorage.createToken(
        {
          orderNumber: generatedOrderNum,
          orderType: orderType === 'DELIVERY' ? 'DELIVERY' : 'COUNTER',
          customerName: customerName.trim() || 'Counter Customer',
          customerPhone: customerPhone.trim() || '',
          items: cart.map((c) => ({
            name: c.name,
            quantity: c.quantity,
            price: c.price,
            notes: c.notes,
          })),
          totalAmount: grandTotal,
          paymentMode,
        },
        restaurant?._id
      );
      setLastGeneratedToken(tok);
    }

    if (caps.isBakery && (cakeMessage.trim() || advanceDate)) {
      const firstItem = cart[0];
      const todayIso = new Date().toISOString().split('T')[0];
      bakeryOrderStorage.saveCakeOrder(
        {
          id: `cake-${Date.now()}`,
          restaurantId: restaurant?._id,
          orderNumber: `CK-${Math.floor(100 + Math.random() * 900)}`,
          customerName: customerName.trim() || 'Counter Walk-in',
          customerPhone: customerPhone.trim() || '9876543210',
          cakeName: cart.map((c) => `${c.name} (${c.quantity}x)`).join(', ') || 'Custom Cake Order',
          weight: '1 kg',
          flavour: firstItem?.name || 'Custom Flavour',
          foodType: firstItem?.foodType === 'EGG' ? 'CONTAINS_EGG' : 'EGGLESS',
          messageOnCake: cakeMessage.trim() || 'Happy Celebration!',
          specialInstructions: `Billed at POS (${generatedOrderNum}). Payment: ${paymentMode}`,
          pickupDate: advanceDate || todayIso,
          pickupTimeSlot: advanceTime || '18:00',
          orderType: orderType === 'DELIVERY' ? 'HOME_DELIVERY' : 'PICKUP',
          totalAmount: grandTotal,
          advancePaid: grandTotal,
          balanceDue: 0,
          paymentStatus: 'FULLY_PAID',
          status: 'BOOKED',
          createdAt: new Date().toISOString(),
        },
        restaurant?._id
      );
    }

    setOrderSuccess(generatedOrderNum);
    setTimeout(() => {
      setOrderSuccess(null);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCakeMessage('');
      setAdvanceDate('');
      setAdvanceTime('');
    }, 4000);
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl text-base bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {caps.formatBadgeIcon}
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 font-heading">
              {caps.isBakery
                ? 'Bakery Counter POS & Cake Billing'
                : caps.isCurryPoint
                ? 'Curry Point Rapid POS & Parcel Billing'
                : caps.isTiffinsMeals
                ? 'Tiffin Coupon POS & Rapid Billing'
                : 'Point of Sale (POS) & Quick Billing'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {caps.isBakery
              ? 'Fast counter billing, advance cake pre-orders, custom inscriptions & takeaway receipts.'
              : caps.isCurryPoint
              ? '1-tap handi pot portion volumes (Small/Medium/Large), quick phulka counters, and dabba packaging.'
              : caps.isTiffinsMeals
              ? 'Rapid counter coupon generation, morning/lunch/evening meal slot switching, and takeaway parcel packaging.'
              : 'Fast touch billing terminal, table & takeaway order punch, kitchen tickets, and payment settlement.'}
          </p>
        </div>

        {/* RIGHT CONTROLS: QR GENERATOR & ORDER TYPE */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-slate-950 font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/20"
          >
            <QrCode className="w-4 h-4" />
            <span>{caps.canManageTables ? 'Generate Table QR' : 'Counter Standee QR'}</span>
          </button>

          {/* ORDER TYPE SELECTOR */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
            {caps.availableOrderTypes.map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${orderType === type
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {type === 'DINE_IN' ? 'Dine In' : type === 'TAKEAWAY' ? (caps.isBakery ? 'Counter Pickup' : caps.isCurryPoint ? 'Curry Parcel Box' : caps.isTiffinsMeals ? 'Parcel Box / Takeaway' : caps.isFastFood ? 'Token / Takeaway' : 'Takeaway / Counter') : 'Direct Delivery'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CURRY POINT: LIVE HANDI POTS BAR & PORTION SIZE SELECTOR */}
      {caps.isCurryPoint && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-base">
              🥘
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-200">Handi Pots:</span>
                <span className="text-amber-300 font-medium">
                  {curryPots.filter((p) => p.potStatus !== 'FINISHED').length} Pots Active on Counter
                </span>
                <button
                  type="button"
                  onClick={() => setIsHandiModalOpen(true)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                >
                  ✏️ Edit Pots
                </button>
              </div>
            </div>
          </div>

          {/* PORTION VOLUME SELECTOR (Small / Medium / Large) */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold text-[11px]">Select Portion Volume:</span>
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(
                [
                  { id: 'SMALL', label: 'Small (250ml)', sub: 'Single' },
                  { id: 'MEDIUM', label: 'Medium (500ml)', sub: 'Half' },
                  { id: 'LARGE', label: 'Large (1000ml)', sub: 'Full' },
                ] as const
              ).map((portion) => (
                <button
                  key={portion.id}
                  type="button"
                  onClick={() => setSelectedPortionSize(portion.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedPortionSize === portion.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{portion.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TIFFINS & MEALS: TODAY'S CURRY BOARD BAR & MEAL SLOT */}
      {caps.isTiffinsMeals && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-base">
              🍛
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-200">Today's Meals:</span>
                <span className="text-amber-300 font-medium">
                  Dal: {dailyBoard.dalPappu} • Fry: {dailyBoard.vegCurry1} • Sweet: {dailyBoard.specialSweet}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${dailyBoard.isMealsAvailable
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                >
                  {dailyBoard.isMealsAvailable ? '🟢 SERVING MEALS' : '🔴 MEALS CLOSED'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDailyBoardModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              ✏️ Edit Curries
            </button>
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['MORNING_TIFFINS', 'AFTERNOON_MEALS', 'EVENING_TIFFINS', 'ALL_DAY'] as TiffinMealSlot[]).map((slot) => {
                const meta = getSlotDisplayMeta(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      tiffinMealsStorage.setActiveSlot(slot, restaurant?._id);
                      setTiffinSlot(slot);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${tiffinSlot === slot ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                placeholder={caps.isBakery ? "Search cakes, pastries, breads..." : caps.isCurryPoint ? "Search curries, dals, phulkas, fry..." : caps.isTiffinsMeals ? "Search dosa, idli, vada, meals, curries, coffee..." : caps.isFastFood ? "Search burgers, fries, wraps, combos..." : "Search menu items (e.g. Biryani, Naan)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            {orderType === 'DINE_IN' && caps.canManageTables && availableTables.length > 0 && (
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

          {/* QUICK PHULKAS & CHAPATIS MULTIPLIER (Curry Point & Tiffins) */}
          {(caps.isCurryPoint || caps.isTiffinsMeals) && (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-base">🫓</span>
                <span className="font-bold text-slate-200">Hot Phulkas &amp; Chapatis Quick Punch:</span>
              </div>
              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {[2, 4, 5, 10].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleAddPhulkas(cnt)}
                    className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 font-bold text-xs text-amber-300 transition whitespace-nowrap"
                  >
                    + {cnt} Phulkas (₹{cnt * 10})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DIETARY FILTER PILLS */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3 py-1 rounded-xl font-bold transition text-xs ${dietaryFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                }`}
            >
              {caps.isBakery ? 'All Bakes' : 'All Items'}
            </button>
            <button
              onClick={() => setDietaryFilter('VEG')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 text-xs ${dietaryFilter === 'VEG'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{caps.isBakery ? '🌿 100% Eggless' : 'Pure Veg'}</span>
            </button>
            <button
              onClick={() => setDietaryFilter('EGG')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 text-xs ${dietaryFilter === 'EGG'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>🥚 Contains Egg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('NON_VEG')}
              className={`px-3 py-1 rounded-xl font-bold transition flex items-center space-x-1 text-xs ${dietaryFilter === 'NON_VEG'
                  ? 'bg-rose-500 text-slate-950 shadow-sm'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>🍗 Non-Veg</span>
            </button>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${selectedCategory === cat
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
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${item.foodType === 'VEG'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : item.foodType === 'EGG'
                                  ? 'border-amber-500 bg-amber-500/10'
                                  : 'border-rose-500 bg-rose-500/10'
                              }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'VEG'
                                  ? 'bg-emerald-500'
                                  : item.foodType === 'EGG'
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                            />
                          </span>
                          {caps.isBakery && (
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${item.foodType === 'VEG'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : item.foodType === 'EGG'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                }`}
                            >
                              {item.foodType === 'VEG' ? 'Eggless' : item.foodType === 'EGG' ? 'Egg' : 'Non-Veg'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">{item.category}</span>
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
                    {orderType === 'DINE_IN' ? (selectedTable ? `Table ${selectedTable}` : 'Dine In') : orderType === 'TAKEAWAY' ? (caps.isStreetFood ? 'Token / Takeaway' : 'Takeaway / Counter') : 'Direct Delivery'}
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
                placeholder={caps.isBakery ? "Customer Mobile" : "Guest Mobile"}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder={caps.isBakery ? "Customer Name" : "Guest Name (Optional)"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* BAKERY SPECIAL: CAKE MESSAGE & ADVANCE PICKUP TIME */}
            {caps.isBakery && (
              <div className="space-y-2 p-2.5 bg-slate-950/70 border border-amber-500/30 rounded-2xl mb-3">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bakery Customization &amp; Pickup</span>
                </div>
                <input
                  type="text"
                  placeholder="Message on Cake (e.g. Happy Birthday Priya!)"
                  value={cakeMessage}
                  onChange={(e) => setCakeMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Pickup / Delivery Date</label>
                    <input
                      type="date"
                      value={advanceDate}
                      onChange={(e) => setAdvanceDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5 font-medium">Pickup Time Slot</label>
                    <input
                      type="time"
                      value={advanceTime}
                      onChange={(e) => setAdvanceTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FAST FOOD TOKEN BADGE */}
            {caps.canManageTokens && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs mb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">⚡</span>
                  <div>
                    <span className="font-bold text-amber-400 block leading-tight">Next Counter Token:</span>
                    <span className="text-[10px] text-slate-400">Auto-sent to Kitchen Display</span>
                  </div>
                </div>
                <span className="font-mono text-lg font-black text-amber-300 px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                  #{String(fastFoodTokenStorage.peekNextTokenNumber(restaurant?._id)).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* TIFFINS PARCEL PACKAGING TOGGLE */}
            {caps.isTiffinsMeals && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-3">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isParcelBox || orderType === 'TAKEAWAY'}
                    onChange={(e) => setIsParcelBox(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <span className="font-bold text-slate-200">Takeaway Parcel Box / Sambar Pouches</span>
                </label>
                <span className="font-mono font-bold text-amber-400">+₹{parcelChargeAmount}</span>
              </div>
            )}

            {/* CURRY POINT DABBA / CONTAINER PACKAGING TOGGLE */}
            {caps.isCurryPoint && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-3">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasOwnDabba}
                    onChange={(e) => setHasOwnDabba(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">Customer Brought Own Tiffin Dabba</span>
                    <span className="text-[10px] text-slate-400">Zero plastic pouch fee</span>
                  </div>
                </label>
                <span className={`font-mono font-bold ${hasOwnDabba ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {hasOwnDabba ? '₹0 (Free)' : `+₹${containerChargeAmount} Pouches`}
                </span>
              </div>
            )}

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
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${discountPercent === d
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
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${paymentMode === m
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

            {/* UPI & QR QUICK BOX */}
            {paymentMode === 'UPI' && (
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>
                      {caps.canManageTables && selectedTable
                        ? `Table ${selectedTable} QR Menu & UPI`
                        : `${caps.formatLabel} Counter QR & UPI`}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Scannable
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Guest can scan with phone camera to view dishes &amp; pay ₹{grandTotal} directly.
                </p>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const targetParam = caps.canManageTables && selectedTable ? selectedTable : 'Counter';
                      const url = `${window.location.origin}/menu/view?table=${encodeURIComponent(targetParam)}`;
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
            <p className="text-xs text-slate-400 mt-1">Invoice #{orderSuccess} recorded &amp; sent to kitchen.</p>

            {lastGeneratedToken && (
              <div className="my-3.5 p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-center">
                <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">COUNTER TOKEN NUMBER</div>
                <div className="text-4xl font-black font-mono text-amber-400 my-1">{lastGeneratedToken.tokenDisplay}</div>
                <div className="text-[11px] text-slate-300">Dispatched to Kitchen Display Screen</div>
                {caps.isCurryPoint ? (
                  <div className="space-y-1.5 mt-2.5">
                    <button
                      type="button"
                      onClick={handlePrintCurrySlip}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Curry Parcel Slip ({lastGeneratedToken.tokenDisplay})</span>
                    </button>
                  </div>
                ) : caps.isTiffinsMeals ? (
                  <div className="space-y-1.5 mt-2.5">
                    <button
                      type="button"
                      onClick={() => handlePrintTiffinCoupons('COMBINED')}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Counter Token Slip ({lastGeneratedToken.tokenDisplay})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintTiffinCoupons('STATION_SPLIT')}
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer border border-amber-500/30"
                    >
                      <span>✂️ Print Station Split Coupons (Dosa / Idli / Coffee)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePrintTokenSlip(lastGeneratedToken)}
                    className="mt-2.5 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Token Slip ({lastGeneratedToken.tokenDisplay})</span>
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono">
              Mode: {paymentMode} • Amount: ₹{grandTotal}
            </div>
          </div>
        </div>
      )}

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
        isOpen={isHandiModalOpen}
        onClose={() => {
          setIsHandiModalOpen(false);
          setCurryPots(curryPointStorage.getPots(restaurant?._id));
        }}
        restaurantId={restaurant?._id}
        restaurantName={restaurant?.restaurantName}
      />
    </div>
  );
};
