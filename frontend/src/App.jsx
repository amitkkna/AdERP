import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import PortalLayout from './components/layout/PortalLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import AssetCreate from './pages/AssetCreate';
import AssetEdit from './pages/AssetEdit';
import Zones from './pages/Zones';
import Users from './pages/Users';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Enquiries from './pages/Enquiries';
import EnquiryDetail from './pages/EnquiryDetail';
import PDC from './pages/PDC';
import Availability from './pages/Availability';
import Quotations from './pages/Quotations';
import QuotationDetail from './pages/QuotationDetail';
import WorkOrders from './pages/WorkOrders';
import ClientDashboard from './pages/portal/ClientDashboard';
import PortalBookings from './pages/portal/PortalBookings';
import PortalInvoices from './pages/portal/PortalInvoices';
import PortalQuotations from './pages/portal/PortalQuotations';

// Root redirect based on role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'CLIENT') return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root → redirect by role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Staff routes (ADMIN / MANAGER / ACCOUNTANT) */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/assets/create" element={<AssetCreate />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/assets/:id/edit" element={<AssetEdit />} />
        <Route path="/zones" element={<Zones />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/enquiries" element={<Enquiries />} />
        <Route path="/enquiries/:id" element={<EnquiryDetail />} />
        <Route path="/pdc" element={<PDC />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/quotations/:id" element={<QuotationDetail />} />
        <Route path="/work-orders" element={<WorkOrders />} />
        <Route path="/users" element={<Users />} />
      </Route>

      {/* Client Portal routes */}
      <Route element={<PortalLayout />}>
        <Route path="/portal" element={<ClientDashboard />} />
        <Route path="/portal/bookings" element={<PortalBookings />} />
        <Route path="/portal/invoices" element={<PortalInvoices />} />
        <Route path="/portal/quotations" element={<PortalQuotations />} />
        <Route path="/portal/quotations/:id" element={<QuotationDetail />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
