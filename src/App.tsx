import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFoodAuthStore } from './store/useFoodAuthStore';
import { FoodPartnerLayout } from './components/layout/FoodPartnerLayout';
import { FoodPartnerLogin } from './pages/Auth/FoodPartnerLogin';
import { OnboardingWizard } from './pages/Onboarding/OnboardingWizard';
import { FoodDashboard } from './pages/Dashboard/FoodDashboard';
import { LiveOrders } from './pages/Orders/LiveOrders';
import { MenuManagement } from './pages/Menu/MenuManagement';
import { AddonManagement } from './pages/Menu/AddonManagement';
import { FastAvailability } from './pages/Availability/FastAvailability';
import { FinanceDashboard } from './pages/Finance/FinanceDashboard';
import { OperatingHoursManagement } from './pages/Restaurant/OperatingHoursManagement';
import { RestaurantProfilePage } from './pages/Restaurant/RestaurantProfilePage';
import { OffersManagement } from './pages/Promotions/OffersManagement';
import { ReviewsManagement } from './pages/Reviews/ReviewsManagement';
import { AnalyticsDashboard } from './pages/Analytics/AnalyticsDashboard';
import { StaffManagement } from './pages/Staff/StaffManagement';
import { SubscriptionManagement } from './pages/Subscription/SubscriptionManagement';
import { RestaurantSettingsPage } from './pages/Settings/RestaurantSettingsPage';
import { DiningManagement } from './pages/Dining/DiningManagement';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useFoodAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<FoodPartnerLogin />} />
        <Route path="/verify-otp" element={<FoodPartnerLogin />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />

        {/* PROTECTED FOOD PORTAL ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <FoodPartnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<FoodDashboard />} />
          <Route path="orders/live" element={<LiveOrders />} />
          <Route path="orders" element={<LiveOrders />} />

          <Route path="menu/items" element={<MenuManagement />} />
          <Route path="menu/categories" element={<MenuManagement />} />
          <Route path="menu/addons" element={<AddonManagement />} />
          <Route path="availability" element={<FastAvailability />} />

          <Route path="restaurant/profile" element={<RestaurantProfilePage />} />
          <Route path="restaurant/hours" element={<OperatingHoursManagement />} />
          <Route path="dining" element={<DiningManagement />} />

          <Route path="offers" element={<OffersManagement />} />
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="subscription" element={<SubscriptionManagement />} />
          <Route path="settings" element={<RestaurantSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
