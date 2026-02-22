import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import {
  MdBookmarkAdded, MdReceipt, MdRequestQuote,
  MdWarning, MdCheckCircle, MdAccessTime,
} from 'react-icons/md';

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const BOOKING_STATUS_COLORS = {
  PENDING:   'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE:    'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
};

const INVOICE_STATUS_COLORS = {
  DRAFT:          'bg-gray-100 text-gray-600',
  SENT:           'bg-blue-100 text-blue-800',
  PAID:           'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  OVERDUE:        'bg-red-100 text-red-800',
  CANCELLED:      'bg-gray-100 text-gray-500',
};

const ClientDashboard = () => {
  const { get, loading } = useApi();
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await get('/portal/dashboard');
      setData(res.data);
    } catch (_) {}
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (data && !data.linked) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MdWarning className="text-5xl text-amber-400 mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">Account Not Linked</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your user account hasn't been linked to a client record yet.
          Please contact the administrator to complete your setup.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-500 text-sm">Here's an overview of your account with us.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <MdBookmarkAdded className="text-2xl text-primary-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-primary-700">{data.bookings.active}</p>
          <p className="text-xs text-gray-500">Active Bookings</p>
          <p className="text-xs text-gray-400 mt-1">{data.bookings.total} total</p>
        </div>
        <div className="card text-center">
          <MdReceipt className="text-2xl text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{data.invoices.pending}</p>
          <p className="text-xs text-gray-500">Pending Invoices</p>
          {data.invoices.overdue > 0 && (
            <p className="text-xs text-red-500 mt-1 font-semibold">{data.invoices.overdue} overdue</p>
          )}
        </div>
        <div className="card text-center">
          <MdCheckCircle className="text-2xl text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700">{fmt(data.invoices.totalPaid)}</p>
          <p className="text-xs text-gray-500">Total Paid</p>
        </div>
        <div className="card text-center">
          <MdRequestQuote className="text-2xl text-indigo-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-indigo-700">{data.quotations.open}</p>
          <p className="text-xs text-gray-500">Open Quotations</p>
          <p className="text-xs text-gray-400 mt-1">{data.quotations.accepted} accepted</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Bookings</h2>
            <Link to="/portal/bookings" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {data.recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 font-mono">{b.bookingCode}</p>
                    <p className="text-xs text-gray-500">
                      {b.bookingAssets.map((ba) => ba.asset.code).join(', ')} •{' '}
                      {fmtDate(b.startDate)} – {fmtDate(b.endDate)}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BOOKING_STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Invoices</h2>
            <Link to="/portal/invoices" className="text-xs text-primary-600 hover:underline">View all</Link>
          </div>
          {data.recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 font-mono">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">
                      {inv.booking?.bookingCode} • Due {fmtDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{fmt(inv.totalAmount)}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${INVOICE_STATUS_COLORS[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
