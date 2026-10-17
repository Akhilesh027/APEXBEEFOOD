/**
 * Storage and state manager for QR Code Menus and Table Sessions.
 * Connects directly to backend API and database to fetch real added menu dishes
 * and syncs separate QR codes for each dining table.
 */
import { foodService } from './foodService';

export interface IQRMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  foodType: 'VEG' | 'NON_VEG';
  description: string;
  image?: string;
  isBestseller?: boolean;
  isRecommended?: boolean;
  preparationMinutes?: number;
}

export interface IQRRecord {
  id: string;
  tableNumber: string;
  section: string;
  capacity?: number;
  label: string;
  menuMode: 'ALL_ITEMS' | 'CUSTOM_SELECTION';
  selectedItemIds: string[]; // Items specifically curated/added for this QR
  discountPercent: number;
  specialNote?: string;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'BILLING' | 'RESERVED';
  activeOrder?: {
    orderNumber: string;
    itemsCount: number;
    amount: number;
    seatedAt: string;
    waiter: string;
  };
  createdAt: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt?: string;
}

export interface ICustomerPlacedOrder {
  orderId: string;
  qrId: string;
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    item: IQRMenuItem;
    quantity: number;
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  gst: number;
  grandTotal: number;
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'SERVED';
  placedAt: string;
  orderNumber: string;
}

export interface IWaiterCall {
  id: string;
  tableNumber: string;
  section: string;
  type: 'CALL_WAITER' | 'WATER' | 'BILL' | 'CUTLERY' | 'CLEAN' | 'ORDER_HELP';
  reason?: string;
  requestedAt: string;
  timestamp: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  assignedWaiter?: string;
}

const STORAGE_KEY_QRS = 'apexbee_food_qrs_v2';
const STORAGE_KEY_MENU = 'apexbee_cached_real_menu_v2';
const STORAGE_KEY_CUSTOMER_ORDERS = 'apexbee_customer_orders_v2';
const STORAGE_KEY_WAITER_REQUESTS = 'apexbee_waiter_requests_v2';

export const qrMenuStorage = {
  // --- FETCH REAL ADDED MENU ITEMS FROM BACKEND ---
  loadRealMenuItems: async (): Promise<IQRMenuItem[]> => {
    try {
      const res = await foodService.getMenuItems();
      if (res.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
        const mapped: IQRMenuItem[] = res.data.items.map((i: any) => ({
          id: i._id || i.id,
          name: i.name,
          category: typeof i.categoryId === 'object' ? i.categoryId?.name || 'General' : i.category || 'General',
          price: i.offerPrice && i.offerPrice > 0 ? i.offerPrice : i.basePrice,
          foodType: i.foodType === 'NON_VEG' ? 'NON_VEG' : 'VEG',
          description: i.description || '',
          image: i.imageUrl || i.image || '',
          isBestseller: !!i.isBestseller,
          isRecommended: !!i.isRecommended,
          preparationMinutes: i.preparationTimeMinutes || 15,
        }));
        localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      // Fallback to cached items
    }

    try {
      const cached = localStorage.getItem(STORAGE_KEY_MENU);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [];
  },

  getCachedMenuItems: (): IQRMenuItem[] => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_MENU);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  },

  // --- TABLES & SEPARATE QR CODES ---
  getQRs: (): IQRRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QRS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  },

  loadTablesFromBackend: async (): Promise<IQRRecord[]> => {
    try {
      const res = await foodService.getTablesWithQRs();
      if (res.data?.tables && Array.isArray(res.data.tables)) {
        const mapped: IQRRecord[] = res.data.tables.map((t: any) => ({
          id: t.qrToken || t._id,
          tableNumber: t.tableNumber,
          section: t.section || 'Main Dining Hall',
          capacity: t.capacity || 4,
          label: t.label || `Table ${t.tableNumber} QR Menu`,
          menuMode: t.menuMode || 'ALL_ITEMS',
          selectedItemIds: (t.selectedItemIds || []).map((item: any) => (typeof item === 'object' ? item._id : item)),
          discountPercent: t.discountPercent || 0,
          specialNote: t.specialNote || `Welcome to Table ${t.tableNumber}! Scan to view menu & order directly.`,
          status: t.status || 'AVAILABLE',
          activeOrder: t.activeOrder,
          createdAt: t.createdAt || new Date().toISOString(),
          isActive: t.isActive !== false,
          scanCount: t.scanCount || 0,
          lastScannedAt: t.lastScannedAt ? new Date(t.lastScannedAt).toLocaleTimeString() : undefined,
        }));
        localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {}

    return qrMenuStorage.getQRs();
  },

  getQRById: (id: string): IQRRecord | undefined => {
    const list = qrMenuStorage.getQRs();
    return list.find((q) => q.id.toLowerCase() === id.toLowerCase() || q.tableNumber.toLowerCase() === id.toLowerCase());
  },

  saveQR: (qr: IQRRecord): IQRRecord[] => {
    const list = qrMenuStorage.getQRs();
    const existingIndex = list.findIndex((q) => q.id === qr.id || q.tableNumber.toUpperCase() === qr.tableNumber.toUpperCase());
    let updated: IQRRecord[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = qr;
    } else {
      updated = [qr, ...list];
    }
    try {
      localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(updated));
    } catch (e) {}

    // Async sync to backend
    foodService.createTableWithQR({
      tableNumber: qr.tableNumber,
      section: qr.section,
      capacity: qr.capacity || 4,
      label: qr.label,
      menuMode: qr.menuMode,
      selectedItemIds: qr.selectedItemIds,
      discountPercent: qr.discountPercent,
      specialNote: qr.specialNote,
    }).catch(() => {});

    return updated;
  },

  deleteQR: (id: string): IQRRecord[] => {
    const list = qrMenuStorage.getQRs();
    const updated = list.filter((q) => q.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_QRS, JSON.stringify(updated));
    } catch (e) {}
    foodService.deleteTableQR(id).catch(() => {});
    return updated;
  },

  recordScan: (id: string) => {
    const list = qrMenuStorage.getQRs();
    const item = list.find((q) => q.id.toLowerCase() === id.toLowerCase() || q.tableNumber.toLowerCase() === id.toLowerCase());
    if (item) {
      item.scanCount = (item.scanCount || 0) + 1;
      item.lastScannedAt = 'Just now';
      qrMenuStorage.saveQR(item);
    }
  },

  getMenuItemsForQR: (qr: IQRRecord, allItems?: IQRMenuItem[]): IQRMenuItem[] => {
    const menu = (allItems && allItems.length > 0) ? allItems : qrMenuStorage.getCachedMenuItems();
    if (qr.menuMode === 'CUSTOM_SELECTION' && qr.selectedItemIds && qr.selectedItemIds.length > 0) {
      const selected = menu.filter((item) => qr.selectedItemIds.includes(item.id));
      return selected.length > 0 ? selected : menu;
    }
    return menu;
  },

  saveCustomerOrder: (order: ICustomerPlacedOrder) => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_CUSTOMER_ORDERS);
      const orders: ICustomerPlacedOrder[] = existingStr ? JSON.parse(existingStr) : [];
      orders.unshift(order);
      localStorage.setItem(STORAGE_KEY_CUSTOMER_ORDERS, JSON.stringify(orders));

      // Dispatch event for instant UI announcement
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:new_order', { detail: order }));
      }
    } catch (e) {}

    // Async sync to backend
    foodService.placeCustomerTableOrder({
      qrToken: order.qrId,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items.map((i) => ({
        itemId: i.item.id,
        name: i.item.name,
        price: i.item.price,
        quantity: i.quantity,
        notes: i.notes,
      })),
    }).catch(() => {});
  },

  getCustomerOrders: (): ICustomerPlacedOrder[] => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_CUSTOMER_ORDERS);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch (e) {
      return [];
    }
  },

  // --- LIVE WAITER CALLS & GUEST ASSISTANCE ---
  saveWaiterCall: (call: IWaiterCall) => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_WAITER_REQUESTS);
      const calls: IWaiterCall[] = existingStr ? JSON.parse(existingStr) : [];
      calls.unshift(call);
      localStorage.setItem(STORAGE_KEY_WAITER_REQUESTS, JSON.stringify(calls));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:waiter_call', { detail: call }));
      }
    } catch (e) {}
  },

  getWaiterCalls: (): IWaiterCall[] => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_WAITER_REQUESTS);
      if (existingStr) {
        return JSON.parse(existingStr);
      }
    } catch (e) {}
    return [];
  },

  updateWaiterCallStatus: (id: string, status: IWaiterCall['status'], waiter?: string): IWaiterCall[] => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY_WAITER_REQUESTS);
      const calls: IWaiterCall[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = calls.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            status,
            assignedWaiter: waiter !== undefined ? waiter : c.assignedWaiter || 'Staff Member',
          };
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEY_WAITER_REQUESTS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },
};
