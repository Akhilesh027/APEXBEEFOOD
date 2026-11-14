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
  restaurantId?: string;
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
  restaurantId?: string;
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
  restaurantId?: string;
  tableNumber: string;
  section: string;
  type: 'CALL_WAITER' | 'WATER' | 'BILL' | 'CUTLERY' | 'CLEAN' | 'ORDER_HELP';
  reason?: string;
  requestedAt: string;
  timestamp: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  assignedWaiter?: string;
}

const getRestaurantScopeId = (): string => {
  try {
    const raw = localStorage.getItem('food_partner_restaurant');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?._id) return parsed._id;
    }
  } catch {}
  return 'default';
};

const getMenuKey = () => `apexbee_cached_real_menu_${getRestaurantScopeId()}`;
const getQRsKey = () => `apexbee_food_qrs_${getRestaurantScopeId()}`;
const getCustomerOrdersKey = (restId?: string) => `apexbee_customer_orders_${restId || getRestaurantScopeId()}`;
const getWaiterRequestsKey = (restId?: string) => `apexbee_waiter_requests_${restId || getRestaurantScopeId()}`;

export const qrMenuStorage = {
  clearAllCaches: () => {
    try {
      localStorage.removeItem('apexbee_customer_orders_v2');
      localStorage.removeItem('apexbee_waiter_requests_v2');
      localStorage.removeItem('apexbee_food_qrs_v2');
      localStorage.removeItem('apexbee_cached_real_menu_v2');

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('apexbee_cached_real_menu') ||
            key.startsWith('apexbee_food_qrs') ||
            key.startsWith('apexbee_customer_orders') ||
            key.startsWith('apexbee_waiter_requests'))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },

  // --- FETCH REAL ADDED MENU ITEMS FROM BACKEND ---
  loadRealMenuItems: async (): Promise<IQRMenuItem[]> => {
    try {
      const res = await foodService.getMenuItems();
      if (res.data && Array.isArray(res.data.items)) {
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
        localStorage.setItem(getMenuKey(), JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      // Fallback to this specific restaurant's cached items if network fails
      try {
        const cached = localStorage.getItem(getMenuKey());
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (err) {}
    }

    return [];
  },

  getCachedMenuItems: (): IQRMenuItem[] => {
    try {
      const cached = localStorage.getItem(getMenuKey());
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  },

  // --- TABLES & SEPARATE QR CODES ---
  getQRs: (): IQRRecord[] => {
    try {
      const stored = localStorage.getItem(getQRsKey());
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
          restaurantId: t.restaurantId ? (typeof t.restaurantId === 'object' ? t.restaurantId._id : t.restaurantId) : undefined,
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
        localStorage.setItem(getQRsKey(), JSON.stringify(mapped));
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
      localStorage.setItem(getQRsKey(), JSON.stringify(updated));
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
      localStorage.setItem(getQRsKey(), JSON.stringify(updated));
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
      const restId = order.restaurantId || getRestaurantScopeId();
      const storageKey = getCustomerOrdersKey(restId);
      const existingStr = localStorage.getItem(storageKey);
      const orders: ICustomerPlacedOrder[] = existingStr ? JSON.parse(existingStr) : [];
      const orderWithRest: ICustomerPlacedOrder = { ...order, restaurantId: restId };
      orders.unshift(orderWithRest);
      localStorage.setItem(storageKey, JSON.stringify(orders));

      // Dispatch event for instant UI announcement (scoped with restaurantId)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:new_order', { detail: orderWithRest }));
      }
    } catch (e) {}

    // Async sync to backend
    foodService.placeCustomerTableOrder({
      qrToken: order.qrId,
      restaurantId: order.restaurantId,
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

  getCustomerOrders: (targetRestId?: string): ICustomerPlacedOrder[] => {
    try {
      const restId = targetRestId || getRestaurantScopeId();
      const storageKey = getCustomerOrdersKey(restId);
      const existingStr = localStorage.getItem(storageKey);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch (e) {
      return [];
    }
  },

  updateCustomerOrderStatus: (orderId: string, status: ICustomerPlacedOrder['status'], targetRestId?: string): ICustomerPlacedOrder[] => {
    try {
      const restId = targetRestId || getRestaurantScopeId();
      const storageKey = getCustomerOrdersKey(restId);
      const existingStr = localStorage.getItem(storageKey);
      const orders: ICustomerPlacedOrder[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = orders.map((o) => (o.orderId === orderId ? { ...o, status } : o));
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  // --- LIVE WAITER CALLS & GUEST ASSISTANCE ---
  saveWaiterCall: (call: IWaiterCall) => {
    try {
      const restId = call.restaurantId || getRestaurantScopeId();
      const storageKey = getWaiterRequestsKey(restId);
      const existingStr = localStorage.getItem(storageKey);
      const calls: IWaiterCall[] = existingStr ? JSON.parse(existingStr) : [];
      const callWithRest: IWaiterCall = { ...call, restaurantId: restId };
      calls.unshift(callWithRest);
      localStorage.setItem(storageKey, JSON.stringify(calls));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:waiter_call', { detail: callWithRest }));
      }
    } catch (e) {}
  },

  getWaiterCalls: (targetRestId?: string): IWaiterCall[] => {
    try {
      const restId = targetRestId || getRestaurantScopeId();
      const storageKey = getWaiterRequestsKey(restId);
      const existingStr = localStorage.getItem(storageKey);
      if (existingStr) {
        return JSON.parse(existingStr);
      }
    } catch (e) {}
    return [];
  },

  updateWaiterCallStatus: (id: string, status: IWaiterCall['status'], waiter?: string, targetRestId?: string): IWaiterCall[] => {
    try {
      const restId = targetRestId || getRestaurantScopeId();
      const storageKey = getWaiterRequestsKey(restId);
      const existingStr = localStorage.getItem(storageKey);
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
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },
};
