import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerFormPage from './pages/CustomerFormPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import EquipmentPage from './pages/EquipmentPage';
import EquipmentFormPage from './pages/EquipmentFormPage';
import TicketsPage from './pages/TicketsPage';
import TicketFormPage from './pages/TicketFormPage';
import TicketDetailPage from './pages/TicketDetailPage';
import QuotationsPage from './pages/QuotationsPage';
import QuotationFormPage from './pages/QuotationFormPage';
import QuotationDetailPage from './pages/QuotationDetailPage';
import AssetsPage from './pages/AssetsPage';
import AssetFormPage from './pages/AssetFormPage';
import AssetDetailPage from './pages/AssetDetailPage';
import ServiceOrdersPage from './pages/ServiceOrdersPage';
import ServiceOrderFormPage from './pages/ServiceOrderFormPage';
import ServiceOrderDetailPage from './pages/ServiceOrderDetailPage';
import ServiceReportsPage from './pages/ServiceReportsPage';
import ServiceReportFormPage from './pages/ServiceReportFormPage';
import ServiceReportDetailPage from './pages/ServiceReportDetailPage';
import PoliciesPage from './pages/PoliciesPage';
import PolicyFormPage from './pages/PolicyFormPage';
import PolicyDetailPage from './pages/PolicyDetailPage';
import MaintenancePage from './pages/MaintenancePage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';
import RegisterPage from './pages/RegisterPage';
import PaymentPage from './pages/PaymentPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import RefaccionesPage from './pages/RefaccionesPage';
import HvacCalculatorPage from './pages/HvacCalculatorPage';
import SurveysPage from './pages/SurveysPage';
import SurveyFormPage from './pages/SurveyFormPage';
import SurveyDetailPage from './pages/SurveyDetailPage';

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
    return <Navigate to="/tickets" replace />;
  }
  return <DashboardPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
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
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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