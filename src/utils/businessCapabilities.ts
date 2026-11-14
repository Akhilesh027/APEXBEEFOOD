export interface IBusinessCapabilities {
  businessType: string;
  isRestaurant: boolean;
  isFastFood: boolean;
  isStreetFood: boolean;
  isBakery: boolean;
  isSweetsDesserts: boolean;
  isCloudKitchen: boolean;
  isTiffinsMeals: boolean;
  isCurryPoint: boolean;

  // Feature Access
  canManageTables: boolean;
  canManageWaiterRequests: boolean;
  canManageReservations: boolean;
  canManageDiningBookings: boolean;
  canManagePreOrders: boolean;
  canManageCakeInscriptions: boolean;
  canManageWeightVariants: boolean;
  canManageTokens: boolean;
  canManageDailyCurries: boolean;
  canManageMealSlots: boolean;
  canManageHandiPots: boolean;

  // POS Preferences
  defaultOrderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  availableOrderTypes: Array<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>;
  requiresTableSelection: boolean;

  // UI labels & badges
  formatLabel: string;
  formatBadgeIcon: string;
  formatBadgeColor: string;
  brandTitle: string;
  brandSubtitle: string;
  portalHeader: string;
  menuLabel: string;
  ordersLabel: string;
  posLabel: string;
}

export const getBusinessCapabilities = (
  rawBusinessType?: string,
  diningEnabled?: boolean,
  cuisines?: string[]
): IBusinessCapabilities => {
  const bt = String(rawBusinessType || '').toUpperCase().trim();
  const cuisinesStr = Array.isArray(cuisines) ? cuisines.join(' ').toUpperCase() : '';

  const isCurryPoint =
    bt === 'CURRY_POINT' ||
    bt === 'CURRY_CENTER' ||
    bt.includes('CURRY') ||
    bt.includes('ROTI_POINT') ||
    cuisinesStr.includes('CURRY POINT');

  const isTiffinsMeals =
    !isCurryPoint &&
    (bt === 'TIFFINS_MEALS' ||
    bt === 'TIFFINS' ||
    bt === 'MEALS' ||
    bt === 'SOUTH_INDIAN_TIFFINS' ||
    bt === 'MESS' ||
    bt === 'BHOJANALAYA' ||
    bt.includes('TIFFIN') ||
    bt.includes('MEAL') ||
    bt.includes('MESS') ||
    bt.includes('BHOJAN') ||
    bt.includes('UDUPI') ||
    bt.includes('DARSHINI'));

  const isStreetFood =
    !isCurryPoint &&
    !isTiffinsMeals &&
    (bt === 'STREET_FOOD' ||
    bt.includes('STREET') ||
    bt.includes('CHAAT'));

  const isFastFood =
    !isCurryPoint &&
    !isTiffinsMeals &&
    (bt === 'FAST_FOOD' ||
    bt === 'QSR' ||
    bt.includes('FAST') ||
    bt.includes('QSR') ||
    bt.includes('BURGER') ||
    bt.includes('PIZZA') ||
    bt.includes('ROLL') ||
    bt.includes('MOMO') ||
    bt.includes('SANDWICH') ||
    cuisinesStr.includes('FAST') ||
    cuisinesStr.includes('BURGER') ||
    cuisinesStr.includes('PIZZA') ||
    cuisinesStr.includes('MOMO') ||
    cuisinesStr.includes('ROLL') ||
    cuisinesStr.includes('CHINESE') ||
    isStreetFood);

  const isBakery =
    bt === 'BAKERY' ||
    bt === 'CAFE_BAKERY' ||
    bt === 'CAFE_BAKERY_BEVERAGES' ||
    bt.includes('BAKER') ||
    bt.includes('CAKE') ||
    bt.includes('PASTRY') ||
    cuisinesStr.includes('BAKERY') ||
    cuisinesStr.includes('CAKE') ||
    cuisinesStr.includes('PASTRY');

  const isSweetsDesserts =
    bt === 'SWEETS_DESSERTS' ||
    bt === 'SWEETS' ||
    bt === 'DESSERTS' ||
    bt.includes('SWEET') ||
    bt.includes('DESSERT') ||
    bt.includes('MITHAI') ||
    bt.includes('ICE_CREAM');

  const isCloudKitchen =
    bt.includes('CLOUD') ||
    bt.includes('KITCHEN') ||
    bt.includes('DELIVERY_ONLY');

  const isRestaurant = !isCurryPoint && !isTiffinsMeals && !isFastFood && !isStreetFood && !isBakery && !isSweetsDesserts && !isCloudKitchen;

  // Tables are allowed if it is a restaurant (unless explicitly disabled) OR if explicitly enabled
  const canManageTables = isRestaurant
    ? diningEnabled !== false
    : (isBakery || isFastFood || isTiffinsMeals) && diningEnabled === true;

  const canManageWaiterRequests = canManageTables && isRestaurant;
  const canManageReservations = isRestaurant && diningEnabled !== false;
  const canManageDiningBookings = isRestaurant && diningEnabled !== false;

  const canManagePreOrders = isBakery || isSweetsDesserts || isRestaurant;
  const canManageCakeInscriptions = isBakery;
  const canManageWeightVariants = isBakery || isSweetsDesserts;
  const canManageTokens = isFastFood || isStreetFood || isCloudKitchen || isTiffinsMeals || isCurryPoint;
  const canManageDailyCurries = isTiffinsMeals || isCurryPoint;
  const canManageMealSlots = isTiffinsMeals;
  const canManageHandiPots = isCurryPoint;

  // POS defaults
  let defaultOrderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' = 'TAKEAWAY';
  let availableOrderTypes: Array<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'> = ['TAKEAWAY', 'DELIVERY'];

  if (canManageTables) {
    defaultOrderType = 'DINE_IN';
    availableOrderTypes = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];
  }

  // Formatting & Badging
  let formatLabel = 'Full-Service Restaurant';
  let formatBadgeIcon = '🍽️';
  let formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  let brandTitle = 'APEXBEE FOOD';
  let brandSubtitle = 'FOOD PARTNER';
  let portalHeader = 'Restaurant Partner Portal';
  let menuLabel = 'Menu Items';
  let ordersLabel = 'Live Kitchen Orders';
  let posLabel = 'POS Terminal';

  if (isCurryPoint) {
    formatLabel = 'Curry Point & Takeaway Counter';
    formatBadgeIcon = '🥘';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE CURRY POINT';
    brandSubtitle = 'TAKEAWAY CURRIES & PHULKAS OS';
    portalHeader = 'Curry Point Partner Portal';
    ordersLabel = 'Live Counter Parcel Feed';
    posLabel = 'Curry Point Rapid POS';
    menuLabel = 'Curry Pots & Phulka Menu';
  } else if (isTiffinsMeals) {
    formatLabel = 'Tiffins & Meals Center';
    formatBadgeIcon = '🍛';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE TIFFINS';
    brandSubtitle = 'TIFFINS, THALIS & MESS OS';
    portalHeader = 'Tiffins & Meals Partner Portal';
    ordersLabel = 'Live Counter & Parcel Feed';
    posLabel = 'Tiffin Coupon & Parcel POS';
    menuLabel = 'Tiffins, Curries & Meals';
  } else if (isFastFood) {
    formatLabel = 'Fast Food & Quick Service (QSR)';
    formatBadgeIcon = '⚡';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE FAST FOOD';
    brandSubtitle = 'QSR & TOKEN SYSTEM';
    portalHeader = 'Fast Food & QSR Portal';
    ordersLabel = 'Live Tokens & Kitchen Feed';
    posLabel = 'Fast Counter POS & Token Slip';
    menuLabel = 'Fast Food Menu & Combos';
  } else if (isStreetFood) {
    formatLabel = 'Street Food & Chaat';
    formatBadgeIcon = '🍢';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE FOOD';
    brandSubtitle = 'STREET FOOD PARTNER';
    portalHeader = 'Street Food Partner Portal';
    ordersLabel = 'Live Counter Orders';
    posLabel = 'Quick Counter Billing';
  } else if (isBakery) {
    formatLabel = 'Bakery & Confectionery';
    formatBadgeIcon = '🎂';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE BAKERY';
    brandSubtitle = 'CAKES & CONFECTIONERY';
    portalHeader = 'Bakery & Confectionery Portal';
    menuLabel = 'Cakes & Bakery Items';
    ordersLabel = 'Live Counter & Cake Orders';
    posLabel = 'Bakery Counter POS';
  } else if (isSweetsDesserts) {
    formatLabel = 'Sweets & Desserts';
    formatBadgeIcon = '🍬';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE SWEETS';
    brandSubtitle = 'SWEETS & DESSERTS';
    portalHeader = 'Sweets & Desserts Portal';
    menuLabel = 'Sweets & Mithai Items';
    ordersLabel = 'Live Counter Orders';
    posLabel = 'Mithai Counter POS';
  } else if (isCloudKitchen) {
    formatLabel = 'Cloud Kitchen / Takeaway';
    formatBadgeIcon = '🥡';
    formatBadgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    brandTitle = 'APEXBEE KITCHEN';
    brandSubtitle = 'CLOUD KITCHEN PARTNER';
    portalHeader = 'Cloud Kitchen Portal';
    ordersLabel = 'Kitchen Dispatch Feed';
  }

  return {
    businessType: bt,
    isRestaurant,
    isFastFood,
    isStreetFood,
    isBakery,
    isSweetsDesserts,
    isCloudKitchen,
    isTiffinsMeals,
    isCurryPoint,
    canManageTables,
    canManageWaiterRequests,
    canManageReservations,
    canManageDiningBookings,
    canManagePreOrders,
    canManageCakeInscriptions,
    canManageWeightVariants,
    canManageTokens,
    canManageDailyCurries,
    canManageMealSlots,
    canManageHandiPots,
    defaultOrderType,
    availableOrderTypes,
    requiresTableSelection: canManageTables,
    formatLabel,
    formatBadgeIcon,
    formatBadgeColor,
    brandTitle,
    brandSubtitle,
    portalHeader,
    menuLabel,
    ordersLabel,
    posLabel,
  };
};

