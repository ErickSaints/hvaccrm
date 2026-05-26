import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
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
const InvoiceFormPage = lazy(() => import('./pages/InvoiceFormPage'));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/payment" element={
                <ProtectedRoute>
                  <PaymentPage />
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
                <Route index element={<ClientDashboardRedirect />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/new" element={<CustomerFormPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="equipment" element={<EquipmentPage />} />
                <Route path="equipment/new" element={<EquipmentFormPage />} />
                <Route path="assets" element={<AssetsPage />} />
                <Route path="assets/new" element={<AssetFormPage />} />
                <Route path="assets/:id" element={<AssetDetailPage />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="tickets/new" element={<TicketFormPage />} />
                <Route path="tickets/:id" element={<TicketDetailPage />} />
                <Route path="quotations" element={<QuotationsPage />} />
                <Route path="quotations/new" element={<QuotationFormPage />} />
                <Route path="quotations/:id" element={<QuotationDetailPage />} />
                <Route path="service-orders" element={<ServiceOrdersPage />} />
                <Route path="service-orders/new" element={<ServiceOrderFormPage />} />
                <Route path="service-orders/:id" element={<ServiceOrderDetailPage />} />
                <Route path="dispatch" element={<DispatchPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="invoices/new" element={<InvoiceFormPage />} />
                <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="service-reports" element={<ServiceReportsPage />} />
                <Route path="service-reports/new" element={<ServiceReportFormPage />} />
                <Route path="service-reports/:id" element={<ServiceReportDetailPage />} />
                <Route path="policies" element={<PoliciesPage />} />
                <Route path="policies/new" element={<PolicyFormPage />} />
                <Route path="policies/:id" element={<PolicyDetailPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/new" element={<UserFormPage />} />
                <Route path="users/:id/edit" element={<UserFormPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="refacciones" element={<RefaccionesPage />} />
                <Route path="calculos-hvac" element={<HvacCalculatorPage />} />
                <Route path="surveys" element={<SurveysPage />} />
                <Route path="surveys/new" element={<SurveyFormPage />} />
                <Route path="surveys/:id" element={<SurveyDetailPage />} />
                <Route path="surveys/:id/edit" element={<SurveyFormPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="permissions" element={<PermissionsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}