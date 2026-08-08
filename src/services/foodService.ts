import { api } from './api';

export const foodService = {
  // --- AUTH ---
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  login: (data: { email?: string; phone?: string; password?: string; otp?: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; phone: string; password?: string; restaurantName?: string; businessType?: string }) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),

  // --- PROFILE & SETTINGS ---
  getProfile: () => api.get('/profile'),
  updateProfile: (data: any) => api.put('/profile', data),
  updateHours: (data: any) => api.put('/hours', data),
  updateSettings: (data: any) => api.put('/settings', data),
  saveOnboardingStep: (step: number, stepData?: any) => api.post('/onboarding/step', { step, stepData }),
  submitOnboarding: () => api.post('/onboarding/submit'),

  // --- MENU ENGINE ---
  getCategories: () => api.get('/menu/categories'),
  createCategory: (data: any) => api.post('/menu/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`),

  getMenuItems: (params?: any) => api.get('/menu/items', { params }),
  createMenuItem: (data: any) => api.post('/menu/items', data),
  updateMenuItem: (id: string, data: any) => api.put(`/menu/items/${id}`, data),
  deleteMenuItem: (id: string) => api.delete(`/menu/items/${id}`),
  toggleSoldOut: (id: string, soldOut: boolean) => api.patch(`/menu/items/${id}/sold-out`, { soldOut }),
  respondToCommissionOffer: (id: string, action: 'ACCEPT' | 'REJECT') => api.post(`/menu/items/${id}/respond-commission`, { action }),

  getVariants: (menuItemId?: string) => api.get('/menu/variants', { params: { menuItemId } }),
  createVariant: (data: any) => api.post('/menu/variants', data),

  getAddons: () => api.get('/menu/addons'),
  createAddonGroup: (data: any) => api.post('/menu/addons', data),
  linkAddonGroupToItems: (groupId: string, menuItemIds: string[]) => api.post(`/menu/addons/${groupId}/items`, { menuItemIds }),
  deleteAddonGroup: (groupId: string) => api.delete(`/menu/addons/${groupId}`),

  getCombos: () => api.get('/menu/combos'),

  // --- AVAILABILITY ---
  getAvailabilityOverview: () => api.get('/availability/overview'),
  toggleAvailabilityItem: (itemId: string, soldOut: boolean) => api.patch(`/availability/items/${itemId}`, { soldOut }),
  bulkToggleAvailability: (itemIds: string[], soldOut: boolean) => api.post('/availability/bulk-toggle', { itemIds, soldOut }),
  updateOperationalStatus: (data: { operationalStatus?: string; acceptingOrders?: boolean; busyMode?: boolean; busyModeExtraMinutes?: number }) =>
    api.put('/availability/operational-status', data),

  // --- LIVE ORDERS ---
  getOrders: (params?: any) => api.get('/orders', { params }),
  getLiveOrdersFeed: () => api.get('/orders/live-feed'),
  acceptOrder: (orderId: string, preparationTimeMinutes: number) => api.post(`/orders/${orderId}/accept`, { preparationTimeMinutes }),
  rejectOrder: (orderId: string, reason?: string) => api.post(`/orders/${orderId}/reject`, { reason }),
  updateOrderStatus: (orderId: string, status: string) => api.patch(`/orders/${orderId}/status`, { status }),

  // --- OFFERS ---
  getOffers: () => api.get('/offers'),
  createOffer: (data: any) => api.post('/offers', data),
  toggleOfferStatus: (id: string, status: string) => api.patch(`/offers/${id}/status`, { status }),

  // --- DINING & TABLE BOOKINGS ---
  getDiningBookings: (params?: any) => api.get('/dining/bookings', { params }),
  createDiningBooking: (data: any) => api.post('/dining/bookings', data),
  updateDiningBookingStatus: (id: string, data: { status?: string; rejectionReason?: string; tableNumber?: string }) =>
    api.patch(`/dining/bookings/${id}/status`, data),
  getDiningInfo: () => api.get('/dining/info'),
  updateDiningInfo: (data: { diningEnabled?: boolean; diningInfo?: any }) => api.put('/dining/info', data),

  // --- FINANCE & ANALYTICS ---
  getEarnings: () => api.get('/finance/earnings'),
  getSettlements: (params?: any) => api.get('/finance/settlements', { params }),
  getAnalytics: () => api.get('/analytics'),

  // --- FILE UPLOAD ---
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Ty