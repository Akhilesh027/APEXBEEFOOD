/**
 * Tiffins & Meals Management Service
 * Provides Dayparting / Meal Slot Switching, Today's Daily Curries & Mess Board,
 * and Station-Split Rapid Counter Coupon Printing for South Indian Tiffin & Meal centers.
 */

export type TiffinMealSlot = 'MORNING_TIFFINS' | 'AFTERNOON_MEALS' | 'EVENING_TIFFINS' | 'ALL_DAY';

export interface IDailyCurryBoard {
  restaurantId?: string;
  date: string;
  dalPappu: string;
  vegCurry1: string;
  vegCurry2: string;
  nonVegSpecial?: string;
  specialSweet: string;
  specialChutney: string;
  sambarRasam: string;
  isMealsAvailable: boolean;
  updatedAt: string;
}

export interface ITiffinCouponItem {
  name: string;
  quantity: number;
  price?: number;
  station: 'DOSA' | 'IDLI_VADA' | 'MEALS' | 'BEVERAGES' | 'SNACKS' | 'GENERAL';
}

export interface ITiffinCouponOrder {
  orderNumber: string;
  tokenDisplay: string;
  customerName?: string;
  customerPhone?: string;
  isParcel: boolean;
  parcelCharge: number;
  items: ITiffinCouponItem[];
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
}

const STORAGE_KEY_SLOT = 'apexbee_tiffin_active_slot_';
const STORAGE_KEY_BOARD = 'apexbee_tiffin_daily_board_';

export const getCurrentAutoMealSlot = (): TiffinMealSlot => {
  const hour = new Date().getHours();
  // 06:00 to 11:30 -> Morning Tiffins
  if (hour >= 6 && hour < 12) {
    return 'MORNING_TIFFINS';
  }
  // 12:00 to 16:00 -> Afternoon Meals / Thalis
  if (hour >= 12 && hour < 16) {
    return 'AFTERNOON_MEALS';
  }
  // 16:00 to 23:00 -> Evening Snacks & Tiffins
  if (hour >= 16 && hour < 23) {
    return 'EVENING_TIFFINS';
  }
  return 'ALL_DAY';
};

export const getSlotDisplayMeta = (slot: TiffinMealSlot) => {
  switch (slot) {
    case 'MORNING_TIFFINS':
      return {
        label: 'Morning Tiffins (6:00 AM - 12:00 PM)',
        shortLabel: '🌅 Morning Tiffins',
        icon: '🌅',
        itemsExample: 'Idli, Ghee Dosa, Vada, Poori, Pongal, Filter Coffee',
        tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    case 'AFTERNOON_MEALS':
      return {
        label: 'Afternoon Meals & Thalis (12:00 PM - 4:00 PM)',
        shortLabel: '☀️ Lunch Meals',
        icon: '☀️',
        itemsExample: 'Full Meals, Mini Meals, Sambar Rice, Daily Curries, Curd Rice',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    case 'EVENING_TIFFINS':
      return {
        label: 'Evening Tiffins & Snacks (4:00 PM - 11:00 PM)',
        shortLabel: '🌇 Evening Tiffins',
        icon: '🌇',
        itemsExample: 'Mirchi Bajji, Punugulu, Masala Dosa, Parotta, Tea/Coffee',
        tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      };
    default:
      return {
        label: 'Full Day Menu (All Items)',
        shortLabel: '🍲 All Menu Items',
        icon: '🍲',
        itemsExample: 'Showing complete breakfast, lunch & snacks menu',
        tagColor: 'bg-slate-800 text-slate-300 border-slate-700',
      };
  }
};

export const categorizeTiffinStation = (itemName: string): ITiffinCouponItem['station'] => {
  const n = itemName.toUpperCase();
  if (n.includes('DOSA') || n.includes('UTTHAPPAM') || n.includes('PESARATTU') || n.includes('ROAST')) {
    return 'DOSA';
  }
  if (n.includes('IDLI') || n.includes('VADA') || n.includes('POORI') || n.includes('UPMA') || n.includes('PONGAL') || n.includes('BONDA') || n.includes('KHARABATH')) {
    return 'IDLI_VADA';
  }
  if (n.includes('MEAL') || n.includes('THALI') || n.includes('RICE') || n.includes('PULAO') || n.includes('BIRYANI') || n.includes('BHOJAN') || n.includes('CURRY') || n.includes('SAMBAR')) {
    return 'MEALS';
  }
  if (n.includes('COFFEE') || n.includes('TEA') || n.includes('MILK') || n.includes('BUTTERMILK') || n.includes('CHAI') || n.includes('WATER') || n.includes('DRINK')) {
    return 'BEVERAGES';
  }
  if (n.includes('BAJJI') || n.includes('PUNUGULU') || n.includes('PAKODA') || n.includes('SAMOSA') || n.includes('SNACK')) {
    return 'SNACKS';
  }
  return 'GENERAL';
};

export const tiffinMealsStorage = {
  getActiveSlot: (restaurantId?: string): TiffinMealSlot => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_SLOT}${restaurantId || 'global'}`);
      if (stored && ['MORNING_TIFFINS', 'AFTERNOON_MEALS', 'EVENING_TIFFINS', 'ALL_DAY'].includes(stored)) {
        return stored as TiffinMealSlot;
      }
    } catch (e) {}
    return getCurrentAutoMealSlot();
  },

  setActiveSlot: (slot: TiffinMealSlot, restaurantId?: string) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_SLOT}${restaurantId || 'global'}`, slot);
      window.dispatchEvent(new CustomEvent('apexbee:meal_slot_changed', { detail: { slot, restaurantId } }));
    } catch (e) {}
  },

  getDailyBoard: (restaurantId?: string): IDailyCurryBoard => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultBoard: IDailyCurryBoard = {
      restaurantId,
      date: todayStr,
      dalPappu: 'Tomato Pappu (Dal)',
      vegCurry1: 'Aloo Kurma',
      vegCurry2: 'Bendakaya Fry (Crispy Okra)',
      specialSweet: 'Semiya Payasam',
      specialChutney: 'Allam (Ginger) & Coconut Chutney',
      sambarRasam: 'Udupi Drumstick Sambar & Pepper Rasam',
      isMealsAvailable: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_BOARD}${restaurantId || 'global'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todayStr) {
          return { ...defaultBoard, ...parsed };
        }
      }
    } catch (e) {}

    return defaultBoard;
  },

  saveDailyBoard: (board: Partial<IDailyCurryBoard>, restaurantId?: string): IDailyCurryBoard => {
    const current = tiffinMealsStorage.getDailyBoard(restaurantId);
    const updated: IDailyCurryBoard = {
      ...current,
      ...board,
      restaurantId,
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`${STORAGE_KEY_BOARD}${restaurantId || 'global'}`, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('apexbee:daily_board_updated', { detail: { board: updated, restaurantId } }));
    } catch (e) {}

    return updated;
  },

  printCombinedOrSplitCoupons: (
    order: ITiffinCouponOrder,
    restaurantName: string,
    mode: 'COMBINED' | 'STATION_SPLIT' = 'COMBINED'
  ) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (mode === 'COMBINED') {
      printWin.document.write(`
        <html>
          <head>
            <title>Coupon ${order.tokenDisplay}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace, sans-serif; padding: 12px; max-width: 280px; margin: 0 auto; color: #000; }
              .center { text-align: center; }
              .token-box { border: 2.5px solid #000; border-radius: 8px; padding: 8px; margin: 8px 0; text-align: center; }
              .token-num { font-size: 38px; font-weight: 900; margin: 0; line-height: 1; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              .item-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
              .bold { font-weight: bold; }
              .station-badge { font-size: 10px; background: #000; color: #fff; padding: 1px 4px; border-radius: 3px; }
              .footer { font-size: 10px; text-align: center; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="center">
              <h3 style="margin: 0; text-transform: uppercase;">${restaurantName}</h3>
              <div style="font-size: 11px; font-weight: bold;">TIFFINS & MEALS COUNTER TOKEN</div>
              <div style="font-size: 10px;">${order.orderNumber} • ${timeStr}</div>
            </div>

            <div class="token-box">
              <div style="font-size: 10px; font-weight: bold;">COUNTER TOKEN</div>
              <div class="token-num">${order.tokenDisplay}</div>
              ${order.isParcel ? '<div style="font-size: 11px; font-weight: bold; margin-top: 2px;">*** TAKEAWAY PARCEL ***</div>' : '<div style="font-size: 10px;">SELF-SERVICE COUNTER</div>'}
            </div>

            <div class="divider"></div>

            <div>
              ${order.items
                .map(
                  (item) => `
                <div class="item-row">
                  <span class="bold">${item.quantity}x ${item.name}</span>
                  <span class="station-badge">${item.station}</span>
                </div>
              `
                )
                .join('')}
            </div>

            ${
              order.isParcel
                ? `
              <div class="item-row" style="font-size: 11px; margin-top: 4px;">
                <span>Parcel Packaging Box</span>
                <span>₹${order.parcelCharge}</span>
              </div>
            `
                : ''
            }

            <div class="divider"></div>

            <div class="item-row bold" style="font-size: 14px;">
              <span>TOTAL PAID</span>
              <span>₹${order.totalAmount} (${order.paymentMode})</span>
            </div>

            <div class="footer">
              Please present this coupon at the respective live counters.<br/>
              Hot food served fresh! Thank you!
            </div>
          </body>
        </html>
      `);
    } else {
      // STATION SPLIT: Group by station and print separate mini tickets
      const stationGroups: { [key: string]: ITiffinCouponItem[] } = {};
      order.items.forEach((item) => {
        if (!stationGroups[item.station]) stationGroups[item.station] = [];
        stationGroups[item.station].push(item);
      });

      const slipsHtml = Object.keys(stationGroups)
        .map((station) => {
          const stationItems = stationGroups[station];
          const stationTitle =
            station === 'DOSA'
              ? '🔥 DOSA MASTER COUNTER'
              : station === 'IDLI_VADA'
              ? '♨️ IDLI, VADA & POORI COUNTER'
              : station === 'MEALS'
              ? '🍛 MEALS & RICE COUNTER'
              : station === 'BEVERAGES'
              ? '☕ FILTER COFFEE & TEA'
              : '🍽️ COUNTER SLIP';

          return `
            <div style="page-break-after: always; padding: 10px; max-width: 270px; margin: 0 auto; border-bottom: 2px dashed #000; margin-bottom: 14px;">
              <div style="text-align: center;">
                <div style="font-size: 11px; font-weight: bold;">${restaurantName}</div>
                <div style="font-size: 13px; font-weight: 900; margin: 3px 0; background: #000; color: #fff; padding: 2px;">${stationTitle}</div>
                <div style="font-size: 32px; font-weight: 900; margin: 4px 0;">${order.tokenDisplay}</div>
                <div style="font-size: 10px;">${order.orderNumber} • ${timeStr} ${order.isParcel ? '• PARCEL' : ''}</div>
              </div>
              <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
              <div>
                ${stationItems
                  .map(
                    (it) => `
                  <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin: 3px 0;">
                    <span>${it.quantity}x ${it.name}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div style="font-size: 9px; text-align: center; margin-top: 6px;">Hand to station master upon calling</div>
            </div>
          `;
        })
        .join('');

      printWin.document.write(`
        <html>
          <head>
            <title>Station Slips ${order.tokenDisplay}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace, sans-serif; margin: 0; padding: 10px; }
            </style>
          </head>
          <body>
            ${slipsHtml}
          </body>
        </html>
      `);
    }

    printWin.document.close();
  },
};

