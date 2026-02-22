import { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import useApi from '../hooks/useApi';
import WorkOrderPDF from '../components/WorkOrderPDF';
import {
  MdSearch, MdDownload, MdEdit, MdBuild, MdDeleteForever,
  MdCheckCircle, MdPending, MdWarning, MdClose, MdSave,
  MdAssignment, MdPlayArrow, MdDone,
} from 'react-icons/md';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.getDate().toString().padStart(2,'0')} ${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
};

const TYPE_STYLE = {
  MOUNT:   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  DEMOUNT: { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
};

const STATUS_STYLE = {
  PENDING:     { bg: 'bg-amber-100',  text: 'text-amber-700'  },
  IN_PROGRESS: { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  COMPLETED:   { bg: 'bg-green-100',  text: 'text-green-700'  },
  CANCELLED:   { bg: 'bg-red-100',    text: 'text-red-700'    },
};

const Badge = ({ type, label, size = 'sm' }) => {
  const st = TYPE_STYLE[type] || STATUS_STYLE[type] || {};
  const p  = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full ${p} ${st.bg} ${st.text}`}>
      {st.dot && <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />}
      {label}
    </span>
  );
};

// ─── Edit / Detail Modal ───────────────────────────────────────────────────────
const WorkOrderModal = ({ wo, onClose, onSave }) => {
  const { put, loading } = useApi();
  const isMount = wo.type === 'MOUNT';
  const [form, setForm] = useState({
    assignedTo:          wo.assignedTo || '',
    assignedPhone:       wo.assignedPhone || '',
    scheduledDate:       wo.scheduledDate ? wo.scheduledDate.substring(0, 10) : '',
    status:              wo.status,
    flexSize:            wo.flexSize || '',
    flexMaterial:        wo.flexMaterial || '',
    flexCopies:          wo.flexCopies || '',
    flexDesignRef:       wo.flexDesignRef || '',
    specialInstructions: wo.specialInstructions || '',
    supervisorNotes:     wo.supervisorNotes || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const res = await put(`/work-orders/${wo.id}`, form);
    if (res) onSave(res.data);
  };

  const booking = wo.booking || {};
  const client  = booking.client || {};
  const assets  = booking.bookingAssets || [];

  const statusFlow = [
    { key: 'PENDING',     label: 'Pending',     icon: <MdPending /> },
    { key: 'IN_PROGRESS', label: 'In Progress',  icon: <MdPlayArrow /> },
    { key: 'COMPLETED',   label: 'Completed',    icon: <MdDone /> },
    { key: 'CANCELLED',   label: 'Cancelled',    icon: <MdClose /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className={`px-6 py-4 rounded-t-2xl flex items-center justify-between ${
          isMount ? 'bg-emerald-700' : 'bg-orange-700'
        }`}>
          <div>
            <p className="text-xs text-white/70 font-mono">{wo.workOrderNo}</p>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MdBuild />
              {isMount ? 'Mount' : 'Demount'} Work Order
            </h2>
            <p className="text-xs text-white/70 mt-0.5">
              Booking: {booking.bookingCode} &nbsp;·&nbsp; {client.companyName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* PDF Download */}
            <PDFDownloadLink
              document={<WorkOrderPDF workOrder={wo} />}
              fileName={`${wo.workOrderNo}.pdf`}
            >
              {({ loading: l }) => (
                <button className="btn-secondary flex items-center gap-1.5 text-sm bg-white/10 text-white border-white/30 hover:bg-white/20">
                  <MdDownload /> {l ? 'Preparing…' : 'Download PDF'}
                </button>
              )}
            </PDFDownloadLink>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white">
              <MdClose className="text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Status stepper */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Status</p>
            <div className="flex gap-2">
              {statusFlow.map(st => (
                <button
                  key={st.key}
                  onClick={() => set('status', st.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.status === st.key
                      ? (STATUS_STYLE[st.key]?.bg || '') + ' ' + (STATUS_STYLE[st.key]?.text || '') + ' border-transparent shadow'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {st.icon} {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Mounter / Technician Name</label>
              <input className="input-field" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="e.g. Ramesh Kumar" />
            </div>
            <div>
              <label className="label-field">Contact Number</label>
              <input className="input-field" value={form.assignedPhone} onChange={e => set('assignedPhone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label-field">Scheduled Date</label>
              <input type="date" className="input-field" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} />
            </div>
          </div>

          {/* Assets summary */}
          {assets.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Assets</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {assets.map((ba, i) => {
                  const a = ba.asset || {};
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                      <span className="font-mono text-xs font-bold text-primary-600 w-16">{a.code}</span>
                      <span className="font-medium text-gray-800 flex-1">{a.name}</span>
                      <span className="text-xs text-gray-400">{a.locationCity}</span>
                      {a.sizeWidth && <span className="text-xs text-gray-400">{a.sizeWidth}×{a.sizeHeight} ft</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Flex specs (mount only) */}
          {isMount && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Flex / Creative Specifications</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Flex Size (W × H)</label>
                  <input className="input-field" value={form.flexSize} onChange={e => set('flexSize', e.target.value)} placeholder="e.g. 20 × 10 ft" />
                </div>
                <div>
                  <label className="label-field">Material / Grade</label>
                  <input className="input-field" value={form.flexMaterial} onChange={e => set('flexMaterial', e.target.value)} placeholder="e.g. Star Flex 440 GSM" />
                </div>
                <div>
                  <label className="label-field">No. of Copies</label>
                  <input type="number" className="input-field" value={form.flexCopies} onChange={e => set('flexCopies', e.target.value)} placeholder="1" min="1" />
                </div>
                <div>
                  <label className="label-field">Design / Print Reference</label>
                  <input className="input-field" value={form.flexDesignRef} onChange={e => set('flexDesignRef', e.target.value)} placeholder="e.g. PRINT-2026-001" />
                </div>
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div>
            <label className="label-field">Special Instructions</label>
            <textarea
              className="input-field h-20 resize-none"
              value={form.specialInstructions}
              onChange={e => set('specialInstructions', e.target.value)}
              placeholder="Any special instructions for the mounter…"
            />
          </div>

          <div>
            <label className="label-field">Supervisor Notes (internal)</label>
            <textarea
              className="input-field h-16 resize-none"
              value={form.supervisorNotes}
              onChange={e => set('supervisorNotes', e.target.value)}
              placeholder="Internal notes…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            <MdSave /> {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const WorkOrders = () => {
  const { get, loading } = useApi();

  const [workOrders, setWorkOrders] = useState([]);
  const [total, setTotal]           = useState(0);
  const [stats, setStats]           = useState(null);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]     = useState(null);

  const limit = 20;

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchWorkOrders(); }, [page, search, typeFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const res = await get('/work-orders/stats');
      setStats(res.data);
    } catch (_) {}
  };

  const fetchWorkOrders = async () => {
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await get('/work-orders', params);
      setWorkOrders(res.data || []);
      setTotal(res.total || 0);
    } catch (_) {}
  };

  const handleSave = (updated) => {
    setWorkOrders(prev => prev.map(w => w.id === updated.id ? updated : w));
    setSelected(updated);
    fetchStats();
  };

  const statCards = stats ? [
    { label: 'Total Work Orders', value: stats.total,        color: 'text-gray-800' },
    { label: 'Pending Mount',     value: stats.pendingMount, color: 'text-emerald-600', type: 'MOUNT' },
    { label: 'Pending Demount',   value: stats.pendingDemount, color: 'text-orange-600', type: 'DEMOUNT' },
    { label: 'In Progress',       value: stats.inProgress,   color: 'text-blue-600' },
    { label: 'Completed',         value: stats.completed,    color: 'text-green-600' },
  ] : [];

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <p className="text-gray-500 text-sm">Auto-generated on booking activation and completion. Assign mounters and download field forms.</p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {statCards.map(s => (
            <div key={s.label} className="card text-center py-3">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9 text-sm"
            placeholder="Search work orders…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field text-sm w-40"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          <option value="MOUNT">Mount</option>
          <option value="DEMOUNT">Demount</option>
        </select>
        <select
          className="input-field text-sm w-44"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-16">
            <MdAssignment className="text-5xl text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No work orders found.</p>
            <p className="text-gray-300 text-xs mt-1">Work orders are auto-created when a booking becomes Active or Completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">WO Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Booking / Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Assets</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo, i) => {
                  const booking = wo.booking || {};
                  const client  = booking.client || {};
                  const assets  = booking.bookingAssets || [];
                  return (
                    <tr key={wo.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-700">{wo.workOrderNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge type={wo.type} label={wo.type} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-primary-600 font-semibold">{booking.bookingCode || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{client.companyName || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {assets.slice(0, 2).map(ba => (
                            <p key={ba.asset?.id} className="text-xs text-gray-600 font-mono">{ba.asset?.code}</p>
                          ))}
                          {assets.length > 2 && (
                            <p className="text-xs text-gray-400">+{assets.length - 2} more</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {wo.assignedTo ? (
                          <>
                            <p className="text-sm text-gray-800 font-medium">{wo.assignedTo}</p>
                            {wo.assignedPhone && <p className="text-xs text-gray-400">{wo.assignedPhone}</p>}
                          </>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {wo.scheduledDate ? fmtDate(wo.scheduledDate) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge type={wo.status} label={wo.status.replace('_', ' ')} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelected(wo)}
                            className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                            title="View & Edit"
                          >
                            <MdEdit className="text-base" />
                          </button>
                          <PDFDownloadLink
                            document={<WorkOrderPDF workOrder={wo} />}
                            fileName={`${wo.workOrderNo}.pdf`}
                          >
                            {({ loading: l }) => (
                              <button
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                title="Download PDF"
                              >
                                <MdDownload className="text-base" />
                              </button>
                            )}
                          </PDFDownloadLink>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <p>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              Previous
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail / Edit modal */}
      {selected && (
        <WorkOrderModal
          wo={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default WorkOrders;
