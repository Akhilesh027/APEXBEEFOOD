/**
 * Curry Point Management Service
 * Provides Handi / Pot Counter Management, Portion Volume Sizing (Small/Medium/Large),
 * and Rapid Takeaway Packaging Billing for Curry Points & Takeaway Counters.
 */

export interface IHandiPotItem {
  id: string;
  name: string;
  category: 'DAL_PAPPU' | 'VEG_FRY' | 'VEG_GRAVY' | 'NON_VEG' | 'STAPLES';
  potStatus: 'FULL_POT' | 'HALF_POT' | 'FINISHED';
  priceSmall: number; // 250 ml or base
  priceMedium: number; // 500 ml
  priceLarge: number; // 1000 ml
  foodType: 'VEG' | 'NON_VEG' | 'EGG';
  isAvailable: boolean;
  updatedAt: string;
}

export type CurryPortionSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface ICurryParcelSlipItem {
  name: string;
  portionLabel?: string; // 'Small (250ml)', 'Medium (500ml)', 'Large (1000ml)', '5 Pcs'
  quantity: number;
  price: number;
}

export interface ICurryParcelOrder {
  orderNumber: string;
  tokenDisplay: string;
  customerName?: string;
  customerPhone?: string;
  hasOwnDabba: boolean;
  containerCharge: number;
  items: ICurryParcelSlipItem[];
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  createdAt: string;
}

const STORAGE_KEY_POTS = 'apexbee_curry_pots_';

const DEFAULT_CURRY_POTS: Omit<IHandiPotItem, 'id' | 'updatedAt'>[] = [
  {
    name: 'Tomato Pappu (Dal)',
    category: 'DAL_PAPPU',
    potStatus: 'FULL_POT',
    priceSmall: 30,
    priceMedium: 55,
    priceLarge: 100,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Palak Pappu (Spinach Dal)',
    category: 'DAL_PAPPU',
    potStatus: 'FULL_POT',
    priceSmall: 30,
    priceMedium: 55,
    priceLarge: 100,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Bendakaya Fry (Crispy Okra)',
    category: 'VEG_FRY',
    potStatus: 'FULL_POT',
    priceSmall: 35,
    priceMedium: 65,
    priceLarge: 120,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Dondakaya Fry (Ivy Gourd)',
    category: 'VEG_FRY',
    potStatus: 'FULL_POT',
    priceSmall: 35,
    priceMedium: 65,
    priceLarge: 120,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Aloo Fry (Potato Roast)',
    category: 'VEG_FRY',
    potStatus: 'FULL_POT',
    priceSmall: 30,
    priceMedium: 55,
    priceLarge: 100,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Gutti Vankaya (Stuffed Brinjal)',
    category: 'VEG_GRAVY',
    potStatus: 'FULL_POT',
    priceSmall: 40,
    priceMedium: 75,
    priceLarge: 140,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Aloo Kurma (Rich Gravy)',
    category: 'VEG_GRAVY',
    potStatus: 'FULL_POT',
    priceSmall: 35,
    priceMedium: 65,
    priceLarge: 120,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Paneer Butter Masala',
    category: 'VEG_GRAVY',
    potStatus: 'FULL_POT',
    priceSmall: 50,
    priceMedium: 95,
    priceLarge: 180,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Andhra Chicken Curry',
    category: 'NON_VEG',
    potStatus: 'FULL_POT',
    priceSmall: 60,
    priceMedium: 110,
    priceLarge: 200,
    foodType: 'NON_VEG',
    isAvailable: true,
  },
  {
    name: 'Chicken Roast Fry',
    category: 'NON_VEG',
    potStatus: 'FULL_POT',
    priceSmall: 70,
    priceMedium: 130,
    priceLarge: 240,
    foodType: 'NON_VEG',
    isAvailable: true,
  },
  {
    name: 'Egg Curry (2 Boiled Eggs in Gravy)',
    category: 'NON_VEG',
    potStatus: 'FULL_POT',
    priceSmall: 50,
    priceMedium: 90,
    priceLarge: 160,
    foodType: 'EGG',
    isAvailable: true,
  },
  {
    name: 'Hot Phulkas / Chapatis (Per Pc)',
    category: 'STAPLES',
    potStatus: 'FULL_POT',
    priceSmall: 10,
    priceMedium: 10,
    priceLarge: 10,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'White Sona Masoori Rice',
    category: 'STAPLES',
    potStatus: 'FULL_POT',
    priceSmall: 30,
    priceMedium: 50,
    priceLarge: 90,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Bagara Rice',
    category: 'STAPLES',
    potStatus: 'FULL_POT',
    priceSmall: 40,
    priceMedium: 70,
    priceLarge: 130,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Drumstick Sambar (Hot)',
    category: 'STAPLES',
    potStatus: 'FULL_POT',
    priceSmall: 20,
    priceMedium: 35,
    priceLarge: 60,
    foodType: 'VEG',
    isAvailable: true,
  },
  {
    name: 'Fresh Curd / Perugu',
    category: 'STAPLES',
    potStatus: 'FULL_POT',
    priceSmall: 20,
    priceMedium: 35,
    priceLarge: 60,
    foodType: 'VEG',
    isAvailable: true,
  },
];

export const curryPointStorage = {
  getPots: (restaurantId?: string): IHandiPotItem[] => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_POTS}${restaurantId || 'global'}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    const initial = DEFAULT_CURRY_POTS.map((p, idx) => ({
      ...p,
      id: `pot-${Date.now()}-${idx}`,
      updatedAt: new Date().toISOString(),
    }));

    curryPointStorage.savePots(initial, restaurantId);
    return initial;
  },

  savePots: (pots: IHandiPotItem[], restaurantId?: string) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_POTS}${restaurantId || 'global'}`, JSON.stringify(pots));
      window.dispatchEvent(new CustomEvent('apexbee:curry_pots_updated', { detail: { pots, restaurantId } }));
    } catch (e) {}
  },

  updatePotStatus: (
    id: string,
    potStatus: 'FULL_POT' | 'HALF_POT' | 'FINISHED',
    restaurantId?: string
  ) => {
    const pots = curryPointStorage.getPots(restaurantId);
    const updated = pots.map((p) =>
      p.id === id
        ? {
            ...p,
            potStatus,
            isAvailable: potStatus !== 'FINISHED',
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    curryPointStorage.savePots(updated, restaurantId);
    return updated;
  },

  addCustomPot: (
    pot: Omit<IHandiPotItem, 'id' | 'updatedAt'>,
    restaurantId?: string
  ): IHandiPotItem => {
    const pots = curryPointStorage.getPots(restaurantId);
    const newItem: IHandiPotItem = {
      ...pot,
      id: `pot-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...pots];
    curryPointStorage.savePots(updated, restaurantId);
    return newItem;
  },

  deletePot: (id: string, restaurantId?: string) => {
    const pots = curryPointStorage.getPots(restaurantId);
    const updated = pots.filter((p) => p.id !== id);
    curryPointStorage.savePots(updated, restaurantId);
    return updated;
  },

  printCurryParcelSlip: (order: ICurryParcelOrder, restaurantName: string) => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    printWin.document.write(`
      <html>
        <head>
          <title>Curry Parcel Slip ${order.tokenDisplay}</title>
          <style>
            body { font-family: monospace, sans-serif; padding: 12px; max-width: 280px; margin: 0 auto; color: #000; }
            .center { text-align: center; }
            .token-box { border: 2.5px solid #000; border-radius: 8px; padding: 6px; margin: 6px 0; text-align: center; }
            .token-num { font-size: 38px; font-weight: 900; margin: 0; line-height: 1; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .item-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
            .bold { font-weight: bold; }
            .portion { font-size: 10px; background: #000; color: #fff; padding: 1px 4px; border-radius: 3px; font-weight: bold; }
            .footer { font-size: 10px; text-align: center; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="center">
            <h3 style="margin: 0; text-transform: uppercase;">${restaurantName}</h3>
            <div style="font-size: 11px; font-weight: bold;">CURRY POINT &amp; TAKEAWAY SLIP</div>
            <div style="font-size: 10px;">${order.orderNumber} • ${timeStr}</div>
          </div>

          <div class="token-box">
            <div style="font-size: 10px; font-weight: bold;">PARCEL TOKEN</div>
            <div class="token-num">${order.tokenDisplay}</div>
            ${order.hasOwnDabba ? '<div style="font-size: 10px; font-weight: bold;">[CUSTOMER OWN DABBA PACKED]</div>' : '<div style="font-size: 10px;">[STORE POUCH / CONTAINER PACK]</div>'}
          </div>

          <div class="divider"></div>

          <div>
            ${order.items
              .map(
                (item) => `
              <div class="item-row">
                <span class="bold">${item.quantity}x ${item.name}</span>
                <span>₹${item.price}</span>
              </div>
              ${item.portionLabel ? `<div style="margin-left: 18px; margin-bottom: 2px;"><span class="portion">${item.portionLabel}</span></div>` : ''}
            `
              )
              .join('')}
          </div>

          ${
            !order.hasOwnDabba && order.containerCharge > 0
              ? `
            <div class="item-row" style="font-size: 11px; margin-top: 4px;">
              <span>Plastic Container / Pouches</span>
              <span>₹${order.containerCharge}</span>
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
            Hot &amp; Fresh Curries packed with care.<br/>
            Consume within 4 hours. Thank you!
          </div>
        </body>
      </html>
    `);

    printWin.document.close();
  },
};

