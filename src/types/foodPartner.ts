export type FoodBusinessType = 'RESTAURANT' | 'STREET_FOOD' | 'CAFE_BAKERY_BEVERAGES' | 'SWEETS_DESSERTS';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type OperationalStatus = 'OPEN' | 'CLOSED' | 'TEMPORARILY_CLOSED' | 'BUSY';
export type FoodType = 'VEG' | 'NON_VEG' | 'EGG' | 'VEGAN';
export type ItemStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type FoodStaffRole = 'OWNER' | 'MANAGER' | 'KITCHEN' | 'MENU_MANAGER' | 'ACCOUNTANT';

export interface FoodPartnerCapabilities {
  menu: boolean;
  variants: boolean;
  addons: boolean;
  combos: boolean;
  prepTime: boolean;
  busyMode: boolean;
  scheduledOrders: boolean;
  weightVariants: boolean;
  operatingHours: boolean;
  liveOrders: boolean;
  availability: boolean;
  offers: boolean;
  reviews: boolean;
  analytics: boolean;
  staff: boolean;
}

export interface IRestaurantProfile {
  _id: string;
  userId: string;
  vendorId: string;
  storeId: string;
  restaurantName: string;
  slug: string;
  businessType: FoodBusinessType;
  legalBusinessName: string;
  description: string;
  logo: string;
  coverImage: string;
  cuisines: string[];
  foodPreference: 'VEG' | 'NON_VEG' | 'BOTH' | 'VEGAN';
  phone: string;
  alternatePhone?: string;
  email: string;
  fssaiNumber: string;
  gstNumber?: string;
  panNumber?: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  averagePreparationMinutes: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  diningEnabled?: boolean;
  diningInfo?: {
    totalTables?: number;
    seatingCapacity?: number;
    tableTypes?: Array<{ type: string; count: number; capacity: number }>;
    amenities?: string[];
    openingTime?: string;
    closingTime?: string;
    slotDurationMinutes?: number;
    advanceBookingDays?: number;
    description?: string;
    images?: string[];
    videos?: string[];
    bookingNotice?: string;
  };
  acceptingOrders: boolean;
  busyMode: boolean;
  busyModeExtraMinutes: number;
  operationalStatus: OperationalStatus;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  onboardingStep: number;
  isOnboardingCompleted: boolean;
  minimumOrderValue?: number;
  rating: {
    average: number;
    totalReviews: number;
  };
}

export interface ITableBooking {
  _id: string;
  restaurantId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guestCount: number;
  bookingDate: string;
  bookingTime: string;
  tableType: string;
  occasion?: string;
  specialRequests?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  tableNumber?: string;
  rejectionReason?: string;
  depositAmount?: number;
  depositStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: string;
}

export interface IRestaurantSettings {
  defaultPreparationMinutes: number;
  acceptingOrders: boolean;
  autoAcceptOrders: boolean;
  codEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minimumOrderValue: number;
  packagingChargeMode: 'PER_ITEM' | 'PER_ORDER' | 'NONE';
  defaultPackagingCharge: number;
  busyModeExtraMinutes: number;
  maxConcurrentOrders: number;
  pauseOrdersWhenCapacityReached: boolean;
  scheduledOrdersEnabled: boolean;
  orderNotificationSound: boolean;
}

export interface IFoodMenuCategory {
  _id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IFoodVariant {
  _id: string;
  menuItemId: string;
  name: string;
  price: number;
  offerPrice?: number;
  isDefault: boolean;
  available: boolean;
  isActive: boolean;
}

export interface IFoodAddonItem {
  _id: string;
  addonGroupId: string;
  name: string;
  additionalPrice: number;
  available: boolean;
  isActive: boolean;
}

export interface IFoodAddonGroup {
  _id: string;
  restaurantId: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  isActive: boolean;
  options?: IFoodAddonItem[];
}

export interface IFoodMenuItem {
  _id: string;
  restaurantId: string;
  categoryId: string | IFoodMenuCategory;
  name: string;
  slug: string;
  description?: string;
  foodType: FoodType;
  cuisine?: string;
  image?: string;
  imageUrl?: string;
  basePrice: number;
  offerPrice?: number;
  packagingCharge?: number;
  preparationTimeMinutes: number;
  isBestseller: boolean;
  isRecommended: boolean;
  isSpicy: boolean;
  isCustomisable: boolean;
  status: ItemStatus;
  soldOut: boolean;
  sortOrder: number;
  variants?: IFoodVariant[];
  addonGroups?: IFoodAddonGroup[];
  platformCommissionPercent?: number;
  platformShareAmount?: number;
  vendorPayoutAmount?: number;
  approvalStatus?: 'PENDING_ADMIN_REVIEW' | 'PENDING_RESTAURANT_ACCEPTANCE' | 'PUBLISHED_LIVE' | string;
}

export interface IFoodOrderSnapshotItem {
  menuItemId: string;
  productName: string;
  foodType?: FoodType;
  variantName?: string;
  quantity: number;
  price: number;
  addons?: { name: string; price: number }[];
  customerNotes?: string;
}

export interface IFoodOrder {
  _id: string;
  orderNumber: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  items: IFoodOrderSnapshotItem[];
  totalAmount: number;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: 'placed' | 'Placed' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | string;
  deliveryType?: string;
  customerNotes?: string;
  createdAt: string;
  deliveryAgentId?: any;
  pickupVerification?: { otp?: string; verifiedAt?: string; isVerified?: boolean };
  orderSummary?: {
    preparationTimeMinutes?: number;
    estimatedDeliveryTime?: string;
  };
  timeline?: { status: string; timestamp: string; note?: stri