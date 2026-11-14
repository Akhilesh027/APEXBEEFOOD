import { qrMenuStorage } from './qrMenuStorage';

export interface ICakeAdvanceOrder {
  id: string;
  restaurantId?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  cakeName: string;
  weight: string; // e.g. "0.5 kg", "1 kg", "1.5 kg", "2 kg", "2-Tier 3 kg"
  flavour: string;
  foodType: 'EGGLESS' | 'CONTAINS_EGG';
  messageOnCake: string;
  specialInstructions?: string;
  referenceImageUrl?: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTimeSlot: string; // e.g. "17:30" or "05:30 PM"
  orderType: 'PICKUP' | 'HOME_DELIVERY';
  deliveryAddress?: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentStatus: 'ADVANCE_PAID' | 'FULLY_PAID' | 'PAY_ON_PICKUP';
  status: 'BOOKED' | 'DESIGN_CONFIRMED' | 'BAKING' | 'READY_IN_CHILLER' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

const getStorageKey = (restId?: string): string => {
  return restId ? `apexbee_cake_orders_${restId}` : 'apexbee_cake_orders_default';
};

export const bakeryOrderStorage = {
  getCakeOrders: (restaurantId?: string): ICakeAdvanceOrder[] => {
    try {
      const key = getStorageKey(restaurantId);
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any previously seeded mock orders
          return parsed.filter((o) => !o.id?.startsWith('cake-ord-'));
        }
      }
      return [];
    } catch {
      return [];
    }
  },

  saveCakeOrder: (order: ICakeAdvanceOrder, restaurantId?: string): ICakeAdvanceOrder[] => {
    const list = bakeryOrderStorage.getCakeOrders(restaurantId);
    const existingIdx = list.findIndex((o) => o.id === order.id);
    let updated: ICakeAdvanceOrder[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = order;
    } else {
      updated = [order, ...list];
    }
    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:cake_order_updated', { detail: order }));
      }
    } catch {}
    return updated;
  },

  updateCakeOrderStatus: (
    id: string,
    status: ICakeAdvanceOrder['status'],
    restaurantId?: string
  ): ICakeAdvanceOrder[] => {
    const list = bakeryOrderStorage.getCakeOrders(restaurantId);
    const updated = list.map((o) => (o.id === id ? { ...o, status } : o));
    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apexbee:cake_order_updated', { detail: { id, status } }));
      }
    } catch {}
    return updated;
  },

  deleteCakeOrder: (id: string, restaurantId?: string): ICakeAdvanceOrder[] => {
    const list = bakeryOrderStorage.getCakeOrders(restaurantId);
    const updated = list.filter((o) => o.id !== id);
    try {
      const key = getStorageKey(restaurantId);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
    return updated;
  },
};

