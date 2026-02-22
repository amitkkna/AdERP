import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import StatsCard from '../components/common/StatsCard';
import {
  MdViewQuilt,
  MdCheckCircle,
  MdBookmarkAdded,
  MdBuild,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdBusiness,
  MdReceipt,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdArrowForward,
  MdPayment,
} from 'react-icons/md';

const statusColors = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10',
  COMPLETED: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/10',
  CANCELLED: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10',
};

const barColors = ['bg-primary-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

const Dashboard = () => {
  const { get, loading } = useApi();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      // handled by useApi
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, assetsByType, assetsByZone, upcomingExpiries, recentBookings, upcomingPaymentDues } = stats;

  const typeLabels = {
    BILLBOARD: 'Billboards',
    UNIPOLE: 'Unipoles',
    HOARDING: 'Hoardings',
    GANTRY: 'Gantries',
    OTHER: 'Others',
  };

  const formatCurrency = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your advertising business</p>
      </div>

      {/* Asset Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatsCard title="Total Assets" value={summary.totalAssets} icon={MdViewQuilt} color="primary" />
        <StatsCard title="Available" value={summary.availableAssets} icon={MdCheckCircle} color="green" />
        <StatsCard title="Booked" value={summary.bookedAssets} icon={MdBookmarkAdded} color="purple" />
        <StatsCard title="Maintenance" value={summary.maintenanceAssets} icon={MdBuild} color="yellow" />
      </div>

      {/* Business Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatsCard
          title="Occupancy"
          value={`${summary.occupancyRate}%`}
          icon={MdTrendingUp}
          color="primary"
          subtitle="Booked / Total"
        />
        <StatsCard title="Total Clients" value={summary.totalClients} icon={MdBusiness} color="primary" />
        <StatsCard title="Active Bookings" value={summary.activeBookings} icon={MdBookmarkAdded} color="green" />
        <StatsCard title="Pending Invoices" value={summary.pendingInvoices} icon={MdReceipt} color="yellow" />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon={MdAccountBalanceWallet}
          color="green"
          subtitle="From paid invoices"
        />
        <StatsCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          icon={MdAccountBalance}
          color="red"
          subtitle="All operational expenses"
        />
        <StatsCard
          title="Net Profit"
          value={formatCurrency(summary.netProfit)}
          icon={summary.netProfit >= 0 ? MdTrendingUp : MdTrendingDown}
          color={summary.netProfit >= 0 ? 'green' : 'red'}
          subtitle="Revenue - Expenses"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Assets by Type */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">Assets by Type</h2>
          <div className="space-y-4">
            {assetsByType.map((item, idx) => (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-600">{typeLabels[item.type] || item.type}</span>
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${barColors[idx % barColors.length]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${(item.count / summary.totalAssets) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets by Zone */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">Assets by Zone</h2>
          <div className="space-y-3">
            {assetsByZone.filter(z => z.assetCount > 0).map((zone) => (
              <div key={zone.id} className="flex items-center justify-between py-1.5">
                <div>
                  <span className="text-sm font-medium text-gray-700">{zone.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{zone.city}</span>
                </div>
                <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg">
                  {zone.assetCount}
                </span>
              </div>
            ))}
            {assetsByZone.filter(z => z.assetCount > 0).length === 0 && (
              <p className="text-sm text-gray-400">No assets assigned to zones yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      {recentBookings && recentBookings.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Recent Bookings</h2>
            <Link to="/bookings" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <MdArrowForward className="text-sm" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Asset</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link to="/bookings" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                        {b.bookingCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.clientName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-gray-700">{b.assetCode}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(b.startDate)} - {formatDate(b.endDate)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatCurrency(b.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[b.status] || ''}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Payment Dues */}
      {upcomingPaymentDues && upcomingPaymentDues.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-50 rounded-xl">
                <MdPayment className="text-red-500 text-lg" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Upcoming Payment Dues</h2>
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">30 days</span>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <MdArrowForward className="text-sm" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Asset</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Frequency</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingPaymentDues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-semibold text-gray-700">{item.assetCode}</span>
                      <span className="text-gray-400 ml-1.5 text-xs">{item.assetName}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.category.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-500">{item.frequency.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.nextDueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        item.status === 'OVERDUE'
                          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                          : item.status === 'DUE_SOON'
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10'
                          : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                      }`}>
                        {item.status === 'OVERDUE' ? `Overdue ${Math.abs(item.daysUntilDue)}d` : item.status === 'DUE_SOON' ? `Due in ${item.daysUntilDue}d` : `In ${item.daysUntilDue}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Permission Expiries */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-amber-50 rounded-xl">
            <MdWarning className="text-amber-500 text-lg" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Upcoming Permission Expiries</h2>
          <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">30 days</span>
        </div>
        {upcomingExpiries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">City</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingExpiries.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/assets/${asset.id}`} className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                        {asset.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{asset.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{asset.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{asset.locationCity}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-red-600 font-semibold">
                        {formatDate(asset.permissionExpiry)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No permissions expiring in the next 30 days.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
