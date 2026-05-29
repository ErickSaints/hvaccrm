import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerFormPage = lazy(() => import('./pages/CustomerFormPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const EquipmentPage = lazy(() => import('./pages/EquipmentPage'));
const EquipmentFormPage = lazy(() => import('./pages/EquipmentFormPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const TicketFormPage = lazy(() => import('./pages/TicketFormPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage'));
const QuotationFormPage = lazy(() => import('./pages/QuotationFormPage'));
const QuotationDetailPage = lazy(() => import('./pages/QuotationDetailPage'));
const AssetsPage = lazy(() => import('./pages/AssetsPage'));
const AssetFormPage = lazy(() => import('./pages/AssetFormPage'));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
const ServiceOrdersPage = lazy(() => import('./pages/ServiceOrdersPage'));
const ServiceOrderFormPage = lazy(() => import('./pages/ServiceOrderFormPage'));
const ServiceOrderDetailPage = lazy(() => import('./pages/ServiceOrderDetailPage'));
const ServiceReportsPage = lazy(() => import('./pages/ServiceReportsPage'));
const ServiceReportFormPage = lazy(() => import('./pages/ServiceReportFormPage'));
const ServiceReportDetailPage = lazy(() => import('./pages/ServiceReportDetailPage'));
const PoliciesPage = lazy(() => import('./pages/PoliciesPage'));
const PolicyFormPage = lazy(() => import('./pages/PolicyFormPage'));
const PolicyDetailPage = lazy(() => import('./pages/PolicyDetailPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const MaintenanceFormPage = lazy(() => import('./pages/MaintenanceFormPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const UserFormPage = lazy(() => import('./pages/UserFormPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const RefaccionesPage = lazy(() => import('./pages/RefaccionesPage'));
const HvacCalculatorPage = lazy(() => import('./pages/HvacCalculatorPage'));
const SurveysPage = lazy(() => import('./pages/SurveysPage'));
const SurveyFormPage = lazy(() => import('./pages/SurveyFormPage'));
const SurveyDetailPage = lazy(() => import('./pages/SurveyDetailPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PermissionsPage = lazy(() => import('./pages/PermissionsPage'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const DispatchPage = lazy(() => import('./pages/DispatchPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const InventoryFormPage = lazy(() => import('./pages/InventoryFormPage'));
const InventoryDetailPage = lazy(() => import('./pages/InventoryDetailPage'));
const InvoiceFormPage = lazy(() => import('./pages/InvoiceFormPage'));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage'));
const MLPredictionsPage = lazy(() => import('./pages/MLPredictionsPage'));
const ClientSettingsPage = lazy(() => import('./pages/ClientSettings'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const FleetTrackingPage = lazy(() => import('./pages/FleetTrackingPage'));
const MarketingCampaignsPage = lazy(() => import('./pages/MarketingCampaignsPage'));
const PricebookPage = lazy(() => import('./pages/PricebookPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0b1120]">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin dark:border-primary-800 dark:border-t-primary-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ClientDashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'CLIENT') {
    return <ClientDashboard />;
  }
  return <DashboardPage />;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0b1120]">
          <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin dark:border-primary-800 dark:border-t-primary-400" />
        </div>
      }>
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
          <Route path="/payment" element={
            <ProtectedRoute>
              <PageTransition><PaymentPage /></PageTransition>
            </ProtectedRoute>
          } />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PageTransition><ClientDashboardRedirect /></PageTransition>} />
            <Route path="customers" element={<PageTransition><CustomersPage /></PageTransition>} />
            <Route path="customers/new" element={<PageTransition><CustomerFormPage /></PageTransition>} />
            <Route path="customers/:id/edit" element={<PageTransition><CustomerFormPage /></PageTransition>} />
            <Route path="customers/:id" element={<PageTransition><CustomerDetailPage /></PageTransition>} />
            <Route path="equipment" element={<PageTransition><EquipmentPage /></PageTransition>} />
            <Route path="equipment/new" element={<PageTransition><EquipmentFormPage /></PageTransition>} />
            <Route path="equipment/:id" element={<PageTransition><EquipmentFormPage /></PageTransition>} />
            <Route path="assets" element={<PageTransition><AssetsPage /></PageTransition>} />
            <Route path="assets/new" element={<PageTransition><AssetFormPage /></PageTransition>} />
            <Route path="assets/:id" element={<PageTransition><AssetDetailPage /></PageTransition>} />
            <Route path="tickets" element={<PageTransition><TicketsPage /></PageTransition>} />
            <Route path="tickets/new" element={<PageTransition><TicketFormPage /></PageTransition>} />
            <Route path="tickets/:id" element={<PageTransition><TicketDetailPage /></PageTransition>} />
            <Route path="quotations" element={<PageTransition><QuotationsPage /></PageTransition>} />
            <Route path="quotations/new" element={<PageTransition><QuotationFormPage /></PageTransition>} />
            <Route path="quotations/:id" element={<PageTransition><QuotationDetailPage /></PageTransition>} />
            <Route path="service-orders" element={<PageTransition><ServiceOrdersPage /></PageTransition>} />
            <Route path="service-orders/new" element={<PageTransition><ServiceOrderFormPage /></PageTransition>} />
            <Route path="service-orders/:id" element={<PageTransition><ServiceOrderDetailPage /></PageTransition>} />
            <Route path="dispatch" element={<PageTransition><DispatchPage /></PageTransition>} />
            <Route path="invoices" element={<PageTransition><InvoicesPage /></PageTransition>} />
            <Route path="invoices/new" element={<PageTransition><InvoiceFormPage /></PageTransition>} />
            <Route path="invoices/:id" element={<PageTransition><InvoiceDetailPage /></PageTransition>} />
            <Route path="service-reports" element={<PageTransition><ServiceReportsPage /></PageTransition>} />
            <Route path="service-reports/new" element={<PageTransition><ServiceReportFormPage /></PageTransition>} />
            <Route path="service-reports/:id" element={<PageTransition><ServiceReportDetailPage /></PageTransition>} />
            <Route path="policies" element={<PageTransition><PoliciesPage /></PageTransition>} />
            <Route path="policies/new" element={<PageTransition><PolicyFormPage /></PageTransition>} />
            <Route path="policies/:id" element={<PageTransition><PolicyDetailPage /></PageTransition>} />
            <Route path="maintenance" element={<PageTransition><MaintenancePage /></PageTransition>} />
            <Route path="maintenance/new" element={<PageTransition><MaintenanceFormPage /></PageTransition>} />
            <Route path="maintenance/:id/edit" element={<PageTransition><MaintenanceFormPage /></PageTransition>} />
            <Route path="profile" element={<PageTransition><ProfilePage /></PageTransition>} />
            <Route path="users" element={<PageTransition><UsersPage /></PageTransition>} />
            <Route path="users/new" element={<PageTransition><UserFormPage /></PageTransition>} />
            <Route path="users/:id/edit" element={<PageTransition><UserFormPage /></PageTransition>} />
            <Route path="subscriptions" element={<PageTransition><SubscriptionsPage /></PageTransition>} />
            <Route path="refacciones" element={<PageTransition><RefaccionesPage /></PageTransition>} />
            <Route path="calculos-hvac" element={<PageTransition><HvacCalculatorPage /></PageTransition>} />
            <Route path="ml-predictions" element={<PageTransition><MLPredictionsPage /></PageTransition>} />
            <Route path="surveys" element={<PageTransition><SurveysPage /></PageTransition>} />
            <Route path="surveys/new" element={<PageTransition><SurveyFormPage /></PageTransition>} />
            <Route path="surveys/:id" element={<PageTransition><SurveyDetailPage /></PageTransition>} />
            <Route path="surveys/:id/edit" element={<PageTransition><SurveyFormPage /></PageTransition>} />
            <Route path="admin" element={<PageTransition><AdminPage /></PageTransition>} />
            <Route path="permissions" element={<PageTransition><PermissionsPage /></PageTransition>} />
            <Route path="inventory" element={<PageTransition><InventoryPage /></PageTransition>} />
            <Route path="inventory/new" element={<PageTransition><InventoryFormPage /></PageTransition>} />
            <Route path="inventory/:id" element={<PageTransition><InventoryDetailPage /></PageTransition>} />
            <Route path="inventory/:id/edit" element={<PageTransition><InventoryFormPage /></PageTransition>} />
            <Route path="client/settings" element={<PageTransition><ClientSettingsPage /></PageTransition>} />
            <Route path="reports" element={<PageTransition><ReportsPage /></PageTransition>} />
            <Route path="fleet" element={<PageTransition><FleetTrackingPage /></PageTransition>} />
            <Route path="pricebook" element={<PageTransition><PricebookPage /></PageTransition>} />
            <Route path="campaigns" element={<PageTransition><MarketingCampaignsPage /></PageTransition>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
