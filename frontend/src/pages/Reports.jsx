import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import {
  MdAssessment,
  MdTrendingUp,
  MdTrendingDown,
  MdPeople,
  MdEventAvailable,
  MdReceiptLong,
  MdPayment,
  MdNotifications,
  MdWarning,
  MdError,
  MdBookmarkAdded,
  MdElectricBolt,
  MdAccountBalance,
  MdHome,
  MdGavel,
  MdVerifiedUser,
  MdCreditCard,
} from 'react-icons/md';

const TABS = [
  { key: 'profitability', label: 'Asset Profitability', icon: MdAssessment },
  { key: 'monthly', label: 'Monthly Revenue', icon: MdTrendingUp },
  { key: 'clients', label: 'Client Revenue', icon: MdPeople },
  { key: 'occupancy', label: 'Occupancy', icon: MdEventAvailable },
  { key: 'ageing', label: 'Invoice Ageing', icon: MdReceiptLong },
  { key: 'paymentDues', label: 'Payment Dues', icon: MdPayment },
  { key: 'alerts', label: 'Alerts', icon: MdNotifications },
];

const statusColors = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700',
  BOOKED: 'bg-purple-50 text-purple-700',
  UNDER_MAINTENANCE: 'bg-amber-50 text-amber-700',
  BLOCKED: 'bg-red-50 text-red-700',
};

const formatCurrency = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Reports = () => {
  const { get, post, loading } = useApi();
  const [activeTab, setActiveTab] = useState('profitability');
  const [data, setData] = useState({});
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, year]);

  const fetchReport = async (tab) => {
    // Skip if already loaded (except monthly which depends on year, and paymentDues which can change)
    if (tab !== 'monthly' && tab !== 'paymentDues' && tab !== 'alerts' && data[tab]) return;
    if (tab === 'monthly' && data[`monthly_${year}`]) {
      setData((prev) => ({ ...prev, monthly: prev[`monthly_${year}`] }));
      return;
    }

    try {
      let res;
      switch (tab) {
        case 'profitability':
          res = await get('/reports/asset-profitability');
          break;
        case 'monthly':
          res = await get(`/reports/monthly-revenue?year=${year}`);
          break;
        case 'clients':
          res = await get('/reports/client-revenue');
          break;
        case 'occupancy':
          res = await get('/reports/occupancy');
          break;
        case 'ageing':
          res = await get('/reports/invoice-ageing');
          break;
        case 'paymentDues':
          res = await get('/recurring-expenses/upcoming');
          break;
        case 'alerts':
          res = await get('/reports/alerts');
          break;
      }
      if (res?.data) {
        if (tab === 'monthly') {
          setData((prev) => ({ ...prev, monthly: res.data, [`monthly_${year}`]: res.data }));
        } else {
          setData((prev) => ({ ...prev, [tab]: res.data }));
        }
      }
    } catch (error) {
      // handled by useApi
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    // Clear monthly cache for this year to force refetch
    setData((prev) => {
      const next = { ...prev };
      delete next.monthly;
      delete next[`monthly_${newYear}`];
      return next;
    });
  };

  const handleMarkPaid = async (id) => {
    try {
      await post(`/recurring-expenses/${id}/mark-paid`);
      // Clear cache and refetch
      setData((prev) => {
        const next = { ...prev };
        delete next.paymentDues;
        return next;
      });
      fetchReport('paymentDues');
    } catch (error) {
      // handled by useApi
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">MIS reports and analytics</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="text-base" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading report...</p>
        </div>
      )}

      {/* Tab Content */}
      {!loading && activeTab === 'profitability' && <ProfitabilityTable data={data.profitability} />}
      {!loading && activeTab === 'monthly' && (
        <MonthlyTable data={data.monthly} year={year} yearOptions={yearOptions} onYearChange={handleYearChange} />
      )}
      {!loading && activeTab === 'clients' && <ClientRevenueTable data={data.clients} />}
      {!loading && activeTab === 'occupancy' && <OccupancyTable data={data.occupancy} />}
      {!loading && activeTab === 'ageing' && <InvoiceAgeingTable data={data.ageing} />}
      {!loading && activeTab === 'paymentDues' && <PaymentDuesTable data={data.paymentDues} onMarkPaid={handleMarkPaid} />}
      {!loading && activeTab === 'alerts' && <AlertsTable data={data.alerts} />}
    </div>
  );
};

/* ─── Tab 1: Asset Profitability ─── */
const ProfitabilityTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState message="No asset data available." />;
  }

  const totals = data.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      totalExpenses: acc.totalExpenses + row.totalExpenses,
      netProfit: acc.netProfit + row.netProfit,
      totalBookings: acc.totalBookings + row.totalBookings,
    }),
    { revenue: 0, totalExpenses: 0, netProfit: 0, totalBookings: 0 }
  );
  const totalRoi = totals.totalExpenses > 0
    ? parseFloat(((totals.netProfit / totals.totalExpenses) * 100).toFixed(1))
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>City</Th>
              <Th>Zone</Th>
              <Th align="right">Revenue</Th>
              <Th align="right">Expenses</Th>
              <Th align="right">Net Profit</Th>
              <Th align="right">ROI %</Th>
              <Th align="center">Bookings</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => (
              <tr key={row.assetId} className="hover:bg-slate-50/60 transition-colors">
                <Td className="font-semibold text-primary-600">{row.code}</Td>
                <Td className="max-w-[180px] truncate">{row.name}</Td>
                <Td>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{row.type}</span>
                </Td>
                <Td>{row.city}</Td>
                <Td>{row.zone}</Td>
                <Td align="right" className="font-medium">{formatCurrency(row.revenue)}</Td>
                <Td align="right">{formatCurrency(row.totalExpenses)}</Td>
                <Td align="right" className={`font-semibold ${row.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(row.netProfit)}
                </Td>
                <Td align="right" className={`font-semibold ${row.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {row.roi}%
                </Td>
                <Td align="center">{row.totalBookings}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
              <td colSpan={5} className="px-4 py-3 text-sm text-gray-700">Total ({data.length} assets)</td>
              <Td align="right">{formatCurrency(totals.revenue)}</Td>
              <Td align="right">{formatCurrency(totals.totalExpenses)}</Td>
              <Td align="right" className={totals.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {formatCurrency(totals.netProfit)}
              </Td>
              <Td align="right" className={totalRoi >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                {totalRoi}%
              </Td>
              <Td align="center">{totals.totalBookings}</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ─── Tab 2: Monthly Revenue & Expenses ─── */
const MonthlyTable = ({ data, year, yearOptions, onYearChange }) => {
  const totals = data
    ? data.reduce(
        (acc, row) => ({
          revenue: acc.revenue + row.revenue,
          expenses: acc.expenses + row.expenses,
          net: acc.net + row.net,
        }),
        { revenue: 0, expenses: 0, net: 0 }
      )
    : { revenue: 0, expenses: 0, net: 0 };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-700">Revenue & Expenses — {year}</h3>
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {!data || data.length === 0 ? (
        <EmptyState message="No data for this year." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <Th>Month</Th>
                <Th align="right">Revenue</Th>
                <Th align="right">Expenses</Th>
                <Th align="right">Net Profit</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/60 transition-colors">
                  <Td className="font-medium">{row.monthName}</Td>
                  <Td align="right" className="font-medium text-emerald-600">
                    {row.revenue > 0 ? formatCurrency(row.revenue) : '-'}
                  </Td>
                  <Td align="right" className="font-medium text-red-600">
                    {row.expenses > 0 ? formatCurrency(row.expenses) : '-'}
                  </Td>
                  <Td align="right" className={`font-semibold ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {row.revenue === 0 && row.expenses === 0 ? '-' : formatCurrency(row.net)}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
                <td className="px-4 py-3 text-sm text-gray-700">Year Total</td>
                <Td align="right" className="text-emerald-600">{formatCurrency(totals.revenue)}</Td>
                <Td align="right" className="text-red-600">{formatCurrency(totals.expenses)}</Td>
                <Td align="right" className={totals.net >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {formatCurrency(totals.net)}
                </Td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─── Tab 3: Client Revenue ─── */
const ClientRevenueTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState message="No client data available." />;
  }

  const totals = data.reduce(
    (acc, row) => ({
      totalBookings: acc.totalBookings + row.totalBookings,
      totalBookingValue: acc.totalBookingValue + row.totalBookingValue,
      totalInvoiced: acc.totalInvoiced + row.totalInvoiced,
      totalPaid: acc.totalPaid + row.totalPaid,
      outstanding: acc.outstanding + row.outstanding,
    }),
    { totalBookings: 0, totalBookingValue: 0, totalInvoiced: 0, totalPaid: 0, outstanding: 0 }
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Client Name</Th>
              <Th>Contact Person</Th>
              <Th align="center">Bookings</Th>
              <Th align="right">Booking Value</Th>
              <Th align="right">Invoiced</Th>
              <Th align="right">Paid</Th>
              <Th align="right">Outstanding</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => (
              <tr key={row.clientId} className="hover:bg-slate-50/60 transition-colors">
                <Td className="font-semibold text-gray-800">{row.companyName}</Td>
                <Td>{row.contactPerson}</Td>
                <Td align="center">{row.totalBookings}</Td>
                <Td align="right">{formatCurrency(row.totalBookingValue)}</Td>
                <Td align="right">{formatCurrency(row.totalInvoiced)}</Td>
                <Td align="right" className="font-medium text-emerald-600">{formatCurrency(row.totalPaid)}</Td>
                <Td align="right" className={`font-semibold ${row.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {row.outstanding > 0 ? formatCurrency(row.outstanding) : '-'}
                </Td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
              <td colSpan={2} className="px-4 py-3 text-sm text-gray-700">Total ({data.length} clients)</td>
              <Td align="center">{totals.totalBookings}</Td>
              <Td align="right">{formatCurrency(totals.totalBookingValue)}</Td>
              <Td align="right">{formatCurrency(totals.totalInvoiced)}</Td>
              <Td align="right" className="text-emerald-600">{formatCurrency(totals.totalPaid)}</Td>
              <Td align="right" className={totals.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}>
                {totals.outstanding > 0 ? formatCurrency(totals.outstanding) : '-'}
              </Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

/* ─── Tab 4: Occupancy Report ─── */
const OccupancyTable = ({ data }) => {
  if (!data || data.length === 0) {
    return <EmptyState message="No asset data available." />;
  }

  const utilizationColor = (pct) => {
    if (pct >= 70) return 'text-emerald-600';
    if (pct >= 30) return 'text-amber-600';
    return 'text-red-600';
  };

  const utilizationBg = (pct) => {
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 30) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>City</Th>
              <Th>Zone</Th>
              <Th align="center">Status</Th>
              <Th align="right">Booked Days</Th>
              <Th align="center">Utilization</Th>
              <Th align="center">Active</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row) => (
              <tr key={row.assetId} className="hover:bg-slate-50/60 transition-colors">
                <Td className="font-semibold text-primary-600">{row.code}</Td>
                <Td className="max-w-[180px] truncate">{row.name}</Td>
                <Td>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{row.type}</span>
                </Td>
                <Td>{row.city}</Td>
                <Td>{row.zone}</Td>
                <Td align="center">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[row.status] || 'bg-gray-100 text-gray-600'}`}>
                    {row.status.replace('_', ' ')}
                  </span>
                </Td>
                <Td align="right">{row.totalBookedDays}</Td>
                <Td align="center">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`${utilizationBg(row.utilization)} h-1.5 rounded-full`}
                        style={{ width: `${Math.min(100, row.utilization)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${utilizationColor(row.utilization)}`}>
                      {row.utilization}%
                    </span>
                  </div>
                </Td>
                <Td align="center">{row.activeBookings}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── Tab 5: Invoice Ageing ─── */
const InvoiceAgeingTable = ({ data }) => {
  if (!data) {
    return <EmptyState message="No invoice ageing data available." />;
  }

  const { summary, invoices } = data;

  const bucketCards = [
    { label: 'Current', value: summary.current, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: '1-30 Days', value: summary.days1to30, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: '31-60 Days', value: summary.days31to60, color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { label: '61-90 Days', value: summary.days61to90, color: 'bg-red-50 text-red-700 border-red-200' },
    { label: '90+ Days', value: summary.days90plus, color: 'bg-red-100 text-red-800 border-red-300' },
  ];

  const bucketColor = (bucket) => {
    switch (bucket) {
      case 'Current': return 'bg-emerald-50 text-emerald-700';
      case '1-30 Days': return 'bg-amber-50 text-amber-700';
      case '31-60 Days': return 'bg-orange-50 text-orange-700';
      case '61-90 Days': return 'bg-red-50 text-red-700';
      case '90+ Days': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {bucketCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-xs font-semibold opacity-70">{card.label}</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>

      {/* Total Outstanding */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3 mb-5">
        <span className="text-sm font-semibold text-gray-600">Total Outstanding</span>
        <span className="text-lg font-bold text-red-600">{formatCurrency(summary.total)}</span>
      </div>

      {/* Invoice Table */}
      {invoices.length === 0 ? (
        <EmptyState message="No outstanding invoices." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <Th>Invoice #</Th>
                  <Th>Client</Th>
                  <Th>Booking</Th>
                  <Th>Due Date</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Balance</Th>
                  <Th align="center">Days Overdue</Th>
                  <Th align="center">Bucket</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/60 transition-colors">
                    <Td className="font-semibold text-primary-600">{inv.invoiceNumber}</Td>
                    <Td>{inv.clientName}</Td>
                    <Td className="font-medium">{inv.bookingCode}</Td>
                    <Td>{formatDate(inv.dueDate)}</Td>
                    <Td align="right">{formatCurrency(inv.totalAmount)}</Td>
                    <Td align="right" className="text-emerald-600">{formatCurrency(inv.paidAmount)}</Td>
                    <Td align="right" className="font-semibold text-red-600">{formatCurrency(inv.balance)}</Td>
                    <Td align="center" className="font-medium">{inv.daysOverdue}</Td>
                    <Td align="center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${bucketColor(inv.bucket)}`}>
                        {inv.bucket}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Tab 6: Payment Dues ─── */
const PaymentDuesTable = ({ data, onMarkPaid }) => {
  if (!data) {
    return <EmptyState message="No payment dues data available." />;
  }

  const { summary, overdue, upcoming } = data;
  const allItems = [...overdue, ...upcoming];

  const dueStatusColor = (status) => {
    switch (status) {
      case 'OVERDUE': return 'bg-red-50 text-red-700';
      case 'DUE_SOON': return 'bg-amber-50 text-amber-700';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border p-4 bg-red-50 text-red-700 border-red-200">
          <p className="text-xs font-semibold opacity-70">Overdue</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(summary.overdueTotal)}</p>
          <p className="text-xs opacity-60">{summary.overdueCount} items</p>
        </div>
        <div className="rounded-xl border p-4 bg-amber-50 text-amber-700 border-amber-200">
          <p className="text-xs font-semibold opacity-70">Upcoming (30 days)</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(summary.upcomingTotal)}</p>
          <p className="text-xs opacity-60">{summary.upcomingCount} items</p>
        </div>
        <div className="rounded-xl border p-4 bg-gray-50 text-gray-700 border-gray-200">
          <p className="text-xs font-semibold opacity-70">Total Due</p>
          <p className="text-lg font-bold mt-1">{formatCurrency(summary.totalAmount)}</p>
          <p className="text-xs opacity-60">{summary.totalCount} items</p>
        </div>
      </div>

      {allItems.length === 0 ? (
        <EmptyState message="No upcoming payment dues." />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <Th>Asset</Th>
                  <Th>Category</Th>
                  <Th>Frequency</Th>
                  <Th align="right">Amount</Th>
                  <Th>Due Date</Th>
                  <Th align="center">Status</Th>
                  <Th align="center">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <Td>
                      <span className="font-semibold text-primary-600">{item.asset.code}</span>
                      <span className="text-gray-400 ml-1.5 text-xs">{item.asset.name}</span>
                    </Td>
                    <Td>{item.category.replace('_', ' ')}</Td>
                    <Td className="text-xs font-medium">{item.frequency.replace('_', ' ')}</Td>
                    <Td align="right" className="font-semibold">{formatCurrency(item.amount)}</Td>
                    <Td>{formatDate(item.nextDueDate)}</Td>
                    <Td align="center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${dueStatusColor(item.status)}`}>
                        {item.status === 'OVERDUE'
                          ? `Overdue ${item.daysOverdue}d`
                          : item.status === 'DUE_SOON'
                          ? `Due in ${item.daysUntilDue}d`
                          : `In ${item.daysUntilDue}d`}
                      </span>
                    </Td>
                    <Td align="center">
                      <button
                        onClick={() => onMarkPaid(item.id)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Mark Paid
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Tab 7: Alerts ─── */
const urgencyBookingConfig = {
  EXPIRED:  { label: 'Expired',       bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    icon: MdError,    dot: 'bg-red-500' },
  CRITICAL: { label: '≤ 7 days',      bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: MdWarning,  dot: 'bg-orange-400' },
  WARNING:  { label: '8 – 15 days',   bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: MdWarning,  dot: 'bg-yellow-400' },
};
const urgencyExpenseConfig = {
  OVERDUE:  { label: 'Overdue',       bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    icon: MdError },
  CRITICAL: { label: '≤ 7 days',      bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: MdWarning },
  WARNING:  { label: '8 – 15 days',   bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: MdWarning },
};
const urgencyPermissionConfig = {
  EXPIRED:  { label: 'Expired',       bg: 'bg-red-100',    text: 'text-red-700',    icon: MdError },
  CRITICAL: { label: '≤ 15 days',     bg: 'bg-orange-100', text: 'text-orange-700', icon: MdWarning },
  WARNING:  { label: '16 – 30 days',  bg: 'bg-yellow-100', text: 'text-yellow-700', icon: MdWarning },
  UPCOMING: { label: '31 – 60 days',  bg: 'bg-blue-100',   text: 'text-blue-700',   icon: MdVerifiedUser },
};
const categoryIcon = { RENT: MdHome, MUNICIPAL_TAX: MdAccountBalance, ELECTRICITY: MdElectricBolt };
const categoryLabel = { RENT: 'Monthly Rent', MUNICIPAL_TAX: 'Municipal Tax', ELECTRICITY: 'Electricity Bill' };

const AlertsTable = ({ data }) => {
  if (!data) return <EmptyState message="No alert data available." />;

  const { summary, bookingAlerts = [], expenseAlerts = [], permissionAlerts = [], pdcAlerts = [] } = data;

  const SummaryCard = ({ count, label, colorClass, icon: Icon }) => (
    <div className={`card flex items-center gap-4 ${count === 0 ? 'opacity-50' : ''}`}>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="text-2xl" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="space-y-3">
        {/* Booking */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Bookings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard count={summary.bookingExpired}  label="Expired"       colorClass="bg-red-100 text-red-600"      icon={MdError} />
          <SummaryCard count={summary.bookingCritical} label="Expiring ≤ 7d" colorClass="bg-orange-100 text-orange-600" icon={MdBookmarkAdded} />
          <SummaryCard count={summary.bookingWarning}  label="Expiring 8–15d" colorClass="bg-yellow-100 text-yellow-600" icon={MdBookmarkAdded} />
        </div>
        {/* Expenses */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1">Expenses</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard count={summary.expenseOverdue}  label="Overdue"       colorClass="bg-red-100 text-red-600"      icon={MdError} />
          <SummaryCard count={summary.expenseCritical} label="Due ≤ 7d"      colorClass="bg-orange-100 text-orange-600" icon={MdElectricBolt} />
          <SummaryCard count={summary.expenseWarning}  label="Due 8–15d"     colorClass="bg-yellow-100 text-yellow-600" icon={MdElectricBolt} />
        </div>
        {/* Permissions */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1">Permissions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard count={summary.permissionExpired}  label="Expired"        colorClass="bg-red-100 text-red-600"      icon={MdError} />
          <SummaryCard count={summary.permissionCritical} label="Expiring ≤ 15d" colorClass="bg-orange-100 text-orange-600" icon={MdGavel} />
          <SummaryCard count={summary.permissionWarning}  label="Expiring 16–30d" colorClass="bg-yellow-100 text-yellow-600" icon={MdGavel} />
          <SummaryCard count={summary.permissionUpcoming} label="Expiring 31–60d" colorClass="bg-blue-100 text-blue-600"   icon={MdVerifiedUser} />
        </div>
        {/* PDC */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1">PDC</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard count={summary.pdcDueThisWeek} label="Cheques due this week" colorClass="bg-orange-100 text-orange-600" icon={MdCreditCard} />
        </div>
      </div>

      {/* ── Section 1: Booking Expiry Alerts ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <MdBookmarkAdded className="text-xl text-primary-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Booking Expiry Alerts</h2>
            <p className="text-xs text-gray-400">Bookings expiring within 15 days or already expired</p>
          </div>
          <span className="ml-auto bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {bookingAlerts.length} bookings
          </span>
        </div>

        {bookingAlerts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No bookings expiring in the next 15 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <Th>Booking #</Th>
                  <Th>Client</Th>
                  <Th>Contact</Th>
                  <Th>Assets</Th>
                  <Th>Start Date</Th>
                  <Th>End Date</Th>
                  <Th align="center">Days Left</Th>
                  <Th align="center">Urgency</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookingAlerts.map((row) => {
                  const cfg = urgencyBookingConfig[row.urgency];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <Td>
                        <span className="font-mono text-xs font-semibold text-primary-600">{row.bookingCode}</span>
                      </Td>
                      <Td>
                        <p className="font-medium text-gray-900 text-sm">{row.clientName}</p>
                      </Td>
                      <Td>
                        <p className="text-sm text-gray-600">{row.contactPerson}</p>
                        <p className="text-xs text-gray-400">{row.phone}</p>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {row.assets.map((a, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                              {a.code}
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td className="text-xs">{formatDate(row.startDate)}</Td>
                      <Td className="text-xs font-medium">{formatDate(row.endDate)}</Td>
                      <Td align="center">
                        <span className={`font-bold text-sm ${cfg.text}`}>
                          {row.daysRemaining < 0
                            ? `${Math.abs(row.daysRemaining)}d ago`
                            : row.daysRemaining === 0
                            ? 'Today'
                            : `${row.daysRemaining}d`}
                        </span>
                      </Td>
                      <Td align="center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <cfg.icon className="text-sm" />
                          {row.urgency === 'EXPIRED' ? 'Expired' : cfg.label}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 2: Expense Payment Alerts ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <MdElectricBolt className="text-xl text-yellow-500" />
          <div>
            <h2 className="font-semibold text-gray-900">Expense Payment Alerts</h2>
            <p className="text-xs text-gray-400">Rent, municipal tax & electricity bills due within 15 days or overdue</p>
          </div>
          <span className="ml-auto bg-yellow-50 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {expenseAlerts.length} items
          </span>
        </div>

        {expenseAlerts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No expense payments due in the next 15 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <Th>Asset</Th>
                  <Th>City</Th>
                  <Th>Expense Type</Th>
                  <Th>Frequency</Th>
                  <Th align="right">Amount</Th>
                  <Th>Due Date</Th>
                  <Th align="center">Days</Th>
                  <Th align="center">Urgency</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenseAlerts.map((row) => {
                  const cfg = urgencyExpenseConfig[row.urgency];
                  const CatIcon = categoryIcon[row.category] || MdAccountBalance;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <Td>
                        <p className="font-mono text-xs font-semibold text-primary-600">{row.assetCode}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{row.assetName}</p>
                      </Td>
                      <Td className="text-sm">{row.assetCity}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          <CatIcon className="text-base text-gray-400" />
                          {categoryLabel[row.category] || row.category.replace('_', ' ')}
                        </span>
                      </Td>
                      <Td className="text-xs text-gray-500">{row.frequency.replace('_', ' ')}</Td>
                      <Td align="right" className="font-semibold">{formatCurrency(row.amount)}</Td>
                      <Td className="text-xs font-medium">{formatDate(row.nextDueDate)}</Td>
                      <Td align="center">
                        <span className={`font-bold text-sm ${cfg.text}`}>
                          {row.daysUntilDue < 0
                            ? `${Math.abs(row.daysUntilDue)}d overdue`
                            : row.daysUntilDue === 0
                            ? 'Today'
                            : `${row.daysUntilDue}d`}
                        </span>
                      </Td>
                      <Td align="center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <cfg.icon className="text-sm" />
                          {row.urgency === 'OVERDUE' ? 'Overdue' : cfg.label}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 3: Permission / Licence Renewal Alerts ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <MdGavel className="text-xl text-purple-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Permission / Licence Renewal Alerts</h2>
            <p className="text-xs text-gray-400">Assets whose municipal/government permission expires within 60 days</p>
          </div>
          <span className="ml-auto bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {permissionAlerts.length} assets
          </span>
        </div>

        {permissionAlerts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No permission renewals due in the next 60 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <Th>Asset Code</Th>
                  <Th>Asset Name</Th>
                  <Th>Type</Th>
                  <Th>City / Zone</Th>
                  <Th>Permission No.</Th>
                  <Th>Expiry Date</Th>
                  <Th align="center">Days Left</Th>
                  <Th align="center">Urgency</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permissionAlerts.map((row) => {
                  const cfg = urgencyPermissionConfig[row.urgency];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <Td>
                        <span className="font-mono text-xs font-semibold text-primary-600">{row.code}</span>
                      </Td>
                      <Td>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{row.name}</p>
                      </Td>
                      <Td className="text-xs text-gray-500">{row.type}</Td>
                      <Td>
                        <p className="text-sm text-gray-700">{row.locationCity}</p>
                        <p className="text-xs text-gray-400">{row.zone}</p>
                      </Td>
                      <Td className="font-mono text-xs text-gray-600">{row.permissionNumber || '—'}</Td>
                      <Td className="text-xs font-medium text-gray-700">{formatDate(row.permissionExpiry)}</Td>
                      <Td align="center">
                        <span className={`font-bold text-sm ${cfg.text}`}>
                          {row.daysRemaining < 0
                            ? `${Math.abs(row.daysRemaining)}d ago`
                            : row.daysRemaining === 0
                            ? 'Today'
                            : `${row.daysRemaining}d`}
                        </span>
                      </Td>
                      <Td align="center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          <cfg.icon className="text-sm" />
                          {cfg.label}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 4: PDC Due This Week ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <MdCreditCard className="text-xl text-orange-500" />
          <div>
            <h2 className="font-semibold text-gray-900">PDC Due for Deposit This Week</h2>
            <p className="text-xs text-gray-400">Post-dated cheques held that are due within 7 days</p>
          </div>
          <span className="ml-auto bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {pdcAlerts.length} cheques
          </span>
        </div>

        {pdcAlerts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No cheques due for deposit this week.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <Th>Cheque #</Th>
                  <Th>Bank</Th>
                  <Th>Client</Th>
                  <Th>Invoice</Th>
                  <Th align="right">Amount</Th>
                  <Th>Cheque Date</Th>
                  <Th align="center">Days</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pdcAlerts.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <Td><span className="font-mono text-sm font-semibold text-gray-800">{row.chequeNumber}</span></Td>
                    <Td className="text-sm">{row.bankName}</Td>
                    <Td>
                      <p className="text-sm font-medium text-gray-900">{row.clientName}</p>
                      <p className="text-xs text-gray-400">{row.clientPhone}</p>
                    </Td>
                    <Td className="font-mono text-xs text-primary-600">{row.invoiceNumber}</Td>
                    <Td align="right" className="font-semibold">₹{row.amount.toLocaleString('en-IN')}</Td>
                    <Td className="text-xs font-medium">{new Date(row.chequeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Td>
                    <Td align="center">
                      <span className={`font-bold text-sm ${row.daysUntilDeposit === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {row.daysUntilDeposit === 0 ? 'Today' : `${row.daysUntilDeposit}d`}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Shared Components ─── */
const Th = ({ children, align = 'left' }) => (
  <th className={`text-${align} px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider`}>
    {children}
  </th>
);

const Td = ({ children, align = 'left', className = '' }) => (
  <td className={`text-${align} px-4 py-3 text-sm text-gray-600 ${className}`}>
    {children}
  </td>
);

const EmptyState = ({ message }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-12 text-center">
    <p className="text-sm text-gray-400">{message}</p>
  </div>
);

export default Reports;
