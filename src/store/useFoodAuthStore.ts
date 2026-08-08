import { create } from 'zustand';
import { IRestaurantProfile, IRestaurantSettings, FoodPartnerCapabilities, FoodStaffRole } from '../types/foodPartner';

interface FoodAuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: any | null;
  partnerContext: any | null;
  restaurant: IRestaurantProfile | null;
  settings: IRestaurantSettings | null;
  operatingHours: any | null;
  capabilities: FoodPartnerCapabilities;
  staffRole: FoodStaffRole;
  setAuth: (token: string, user: any, partnerContext: any, restaurant?: IRestaurantProfile) => void;
  setRestaurantData: (restaurant: IRestaurantProfile, settings?: IRestaurantSettings, operatingHours?: any) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const DEFAULT_CAPABILITIES: FoodPartnerCapabilities = {
  menu: true,
  variants: true,
  addons: true,
  combos: true,
  prepTime: true,
  busyMode: true,
  scheduledOrders: true,
  weightVariants: true,
  operatingHours: true,
  liveOrders: true,
  availability: true,
  offers: true,
  reviews: true,
  analytics: true,
  staff: true,
};

const getInitialRestaurant = (): IRestaurantProfile | null => {
  try {
    const raw = localStorage.getItem('food_partner_restaurant');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialUser = (): any | null => {
  try {
    const raw = localStorage.getItem('food_partner_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useFoodAuthStore = create<FoodAuthState>((set, get) => ({
  token: localStorage.getItem('food_partner_token'),
  isAuthenticated: Boolean(localStorage.getItem('food_partner_token')),
  user: getInitialUser(),
  partnerContext: null,
  restaurant: getInitialRestaurant(),
  settings: null,
  operatingHours: null,
  capabilities: DEFAULT_CAPABILITIES,
  staffRole: 'OWNER',

  setAuth: (token, user, partnerContext, restaurant) => {
    localStorage.setItem('food_partner_token', token);
    if (user) localStorage.setItem('food_partner_user', JSON.stringify(user));
    if (restaurant) localStorage.setItem('food_partner_restaurant', JSON.stringify(restaurant));

    set({
      token,
      isAuthenticated: true,
      user,
      partnerContext,
      restaurant: restaurant || null,
    });
  },

  setRestaurantData: (restaurant, settings, operatingHours) => {
    if (restaurant) {
      localStorage.setItem('food_partner_restaurant', JSON.stringify(restaurant));
    }

    set({
      restaurant,
      settings: settings || get().settings,
      operatingHours: operatingHours || get().operatingHours,
    });
  },

  logout: () => {
    localStorage.removeItem('food_partner_token');
    localStorage.removeItem('food_partner_restaurant');
    localStorage.removeItem('food_partner_user');

    set({
      token: null,
      isAuthenticated: false,
      user: null,
      partnerContext: null,
      restaurant: null,
      settings: null,
      operatingHours: null,
    });
  },

  hasPermission: (permission) => {
    const role = get().staffRole;
    if (role === 'OWNER') return true;
    if (permission === 'orders' && (role === 'MANAGER' || role === 'KITCHEN')) return true;
    if (permission === 'menu' && (role === 'MANAGER' || role === 'MENU_MANAGER')) return true;
    if (permission === 'availability' && (role === 'MANAGER' || role === 'KITCHEN' || role === 'MENU_MANAGER')) return true;
    if (permission === 'finance' && (role === 'MANAGER' || role === 'ACCOUNTANT')) return true;
    if (permission === 'reports' && (role === 'MANAGER' || role === 'ACCOUNTANT')) return true;
    return false;
  },
}));
