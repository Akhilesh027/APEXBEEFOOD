import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFoodAuthStore } from './store/useFoodAuthStore';
import FoodPartnerLayout from './components/layout/FoodPartnerLayout';
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
import { TablesManagement } from './pages/Tables/TablesManagement';
import { WaiterRequestsPage } from './pages/WaiterRequests/WaiterRequestsPage';
import { ReservationsPage } from './pages/Reservations/ReservationsPage';
import { POSTerminalPage } from './pages/POS/POSTerminalPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { DeliveryExecutivesPage } from './pages/Delivery/DeliveryExecutivesPage';
import { ExpensesPage } from './pages/Expenses/ExpensesPage';
import { PaymentsPage } from './pages/Payments/PaymentsPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { CashRegisterPage } from './pages/CashRegister/CashRegisterPage';
import { InventorySuppliersPage } from './pages/InventorySuppliers/InventorySuppliersPage';
import { CustomerMenuView } from './pages/PublicMenu/CustomerMenuView';
import { QRManagementPage } from './pages/QRManagement/QRManagementPage';
import { AdvanceCakeOrdersPage } from './pages/Bakery/AdvanceCakeOrdersPage';
import { TokenKitchenDisplayPage } from './pages/FastFood/TokenKitchenDisplayPage';
import { getBusinessCapabilities } from './utils/businessCapabilities';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useFoodAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const CapabilityRoute: React.FC<{
  children: React.ReactNode;
  check: (caps: ReturnType<typeof getBusinessCapabilities>) => boolean;
}> = ({ children, check }) => {
  const restaurant = useFoodAuthStore((state) => state.restaurant);
  const caps = getBusinessCapabilities(
    restaurant?.businessType,
    restaurant?.diningEnabled,
    restaurant?.cuisines
  );
  if (!check(caps)) {
    return <Navigate to="/dashboard" replace />;
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

        {/* PUBLIC CUSTOMER MENU SCAN ROUTES (WHEN USER SCANS QR CODE) */}
        <Route path="/menu/view" element={<CustomerMenuView />} />
        <Route path="/customer-menu" element={<CustomerMenuView />} />
        <Route path="/m/:qrId" element={<CustomerMenuView />} />

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
          <Route
            path="dining"
            element={
              <CapabilityRoute check={(c) => c.canManageDiningBookings}>
                <DiningManagement />
              </CapabilityRoute>
            }
          />

          <Route path="offers" element={<OffersManagement />} />
          <Route path="reviews" element={<ReviewsManagement />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="subscription" element={<SubscriptionManagement />} />
          <Route path="settings" element={<RestaurantSettingsPage />} />

          {/* NEW MODULE ROUTES */}
          <Route
            path="tables"
            element={
              <CapabilityRoute check={(c) => c.canManageTables}>
                <TablesManagement />
              </CapabilityRoute>
            }
          />
          <Route path="qr-codes" element={<QRManagementPage />} />
          <Route
            path="waiter-requests"
            element={
              <CapabilityRoute check={(c) => c.canManageWaiterRequests}>
                <WaiterRequestsPage />
              </CapabilityRoute>
            }
          />
          <Route
            path="reservations"
            element={
              <CapabilityRoute check={(c) => c.canManageReservations}>
                <ReservationsPage />
              </CapabilityRoute>
            }
          />
          <Route path="pos" element={<POSTerminalPage />} />
          <Route path="tokens" element={<TokenKitchenDisplayPage />} />
          <Route
            path="advance-orders"
            element={
              <CapabilityRoute check={(c) => c.canManageCakeInscriptions}>
                <AdvanceCakeOrdersPage />
              </CapabilityRoute>
            }
          />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="delivery-executives" element={<DeliveryExecutivesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="cash-register" element={<CashRegisterPage />} />
          <Route path="inventory-suppliers" element={<InventorySuppliersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
