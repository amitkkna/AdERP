import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import QuotationPDF from '../components/QuotationPDF';
import toast from 'react-hot-toast';
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdVisibility, MdDownload,
  MdRequestQuote, MdCheckCircle, MdCancel, MdSend,
  MdAccessTime,
} from 'react-icons/md';

const STATUS_COLORS = {
  DRAFT:    'bg-gray-100 text-gray-700',
  SENT:     'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED:  'bg-amber-100 text-amber-800',
};

const EMPTY_FORM = {
  clientId: '', validUntil: '', taxRate: '18', notes: '', terms:
    '1. This quotation is valid for the period mentioned above.\n2. Prices are subject to change after validity.\n3. GST as applicable.\n4. Payment terms: 50% advance, 50% before campaign launch.',
};

const EMPTY_ITEM = { description: '', location: '', size: '', assetId: '', monthlyRate: '', months: '1' };

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const Quotations = () => {
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [stats, setStats]           = useState(null);
  const [clients, setClients]       = useState([]);
  const [assets, setAssets]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [items, setItems]           = useState([{ ...EMPTY_ITEM }]);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchStats();
    fetchClients();
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [page, search, statusFilter]);

  const fetchQuotations = async () => {
    try {
      const res = await get('/quotations', {
        page, limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setQuotations(res.data);
      setPagination(res.pagination);
    } catch (_) {}
  };

  const fetchStats = async () => {
    try {
      const res = await get('/quotations/stats');
      setStats(res.data);
    } catch (_) {}
  };

  const fetchClients = async () => {
    try {
      const res = await get('/clients', { limit: 200 });
      setClients(res.data || []);
    } catch (_) {}
  };

  const fetchAssets = async () => {
    try {
      const res = await get('/assets', { limit: 200 });
      setAssets(res.data || []);
    } catch (_) {}
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setItems([{ ...EMPTY_ITEM }]);
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditingId(q.id);
    setForm({
      clientId: q.clientId,
      validUntil: q.validUntil?.substring(0, 10) || '',
      taxRate: String(q.taxRate),
      notes: q.notes || '',
      terms: q.terms || '',
    });
    setItems((q.items || []).map((it) => ({
      description: it.description,
      location: it.location || '',
      size: it.size || '',
      assetId: it.assetId || '',
      monthlyRate: String(it.monthlyRate),
      months: String(it.months),
    })));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Add at least one item.'); return; }
    const payload = { ...form, items };
    try {
      if (editingId) {
        await put(`/quotations/${editingId}`, payload);
        toast.success('Quotation updated.');
      } else {
        const res = await post('/quotations', payload);
        toast.success('Quotation created.');
        navigate(`/quotations/${res.data.id}`);
        return;
      }
      setModalOpen(false);
      fetchQuotations();
      fetchStats();
    } catch (_) {}
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/quotations/${deleteId}`);
      toast.success('Quotation deleted.');
      setDeleteId(null);
      fetchQuotations();
      fetchStats();
    } catch (_) {} finally { setDeleting(false); }
  };

  const downloadPDF = async (row) => {
    setDownloadingId(row.id);
    try {
      const res = await get(`/quotations/${row.id}`);
      const blob = await pdf(<QuotationPDF quotation={res.data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.quotationNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      toast.error('Failed to generate PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Item helpers
  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    // auto-fill description from asset
    if (field === 'assetId' && value) {
      const a = assets.find((a) => a.id === parseInt(value));
      if (a) {
        updated[i].description = a.name;
        updated[i].location = a.locationCity;
        updated[i].size = `${a.sizeWidth}x${a.sizeHeight} ft`;
        updated[i].monthlyRate = String(a.monthlyRate);
      }
    }
    setItems(updated);
  };

  // Preview totals
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.monthlyRate || 0) * parseInt(it.months || 1)), 0);
  const taxAmt = Math.round(subtotal * parseFloat(form.taxRate || 0)) / 100;
  const total = subtotal + taxAmt;

  const columns = [
    { key: 'quotationNo', label: 'Quotation #', render: (row) => <span className="font-mono text-xs font-semibold text-primary-600">{row.quotationNo}</span> },
    { key: 'client', label: 'Client', render: (row) => (
      <div>
        <p className="font-medium text-sm text-gray-800">{row.client?.companyName}</p>
        <p className="text-xs text-gray-400">{row.client?.contactPerson}</p>
      </div>
    )},
    { key: 'totalAmount', label: 'Amount', render: (row) => <span className="font-semibold">{fmt(row.totalAmount)}</span> },
    { key: 'validUntil', label: 'Valid Until', render: (row) => (
      <span className={new Date(row.validUntil) < new Date() ? 'text-red-500 text-xs' : 'text-xs text-gray-600'}>
        {fmtDate(row.validUntil)}
      </span>
    )},
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[row.status]}`}>{row.status}</span>
    )},
    { key: 'createdAt', label: 'Created', render: (row) => <span className="text-xs text-gray-400">{fmtDate(row.createdAt)}</span> },
    { key: 'actions', label: '', render: (row) => (
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(`/quotations/${row.id}`)} className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="View">
          <MdVisibility />
        </button>
        <button
          onClick={() => downloadPDF(row)}
          disabled={downloadingId === row.id}
          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-40"
          title="Download PDF"
        >
          {downloadingId === row.id
            ? <span className="text-[10px] font-bold leading-none">...</span>
            : <MdDownload />}
        </button>
        {isManager && (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Edit">
              <MdEdit />
            </button>
            <button onClick={() => setDeleteId(row.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
              <MdDelete />
            </button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-500 text-sm">Create and manage client quotations</p>
        </div>
        {isManager && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-lg" /> New Quotation
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, icon: MdRequestQuote, color: 'text-primary-600' },
            { label: 'Draft', value: stats.draft, icon: MdAccessTime, color: 'text-gray-500' },
            { label: 'Sent', value: stats.sent, icon: MdSend, color: 'text-blue-600' },
            { label: 'Accepted', value: stats.accepted, icon: MdCheckCircle, color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, icon: MdCancel, color: 'text-red-600' },
            { label: 'Win Rate', value: `${stats.conversionRate}%`, icon: MdCheckCircle, color: 'text-emerald-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center">
              <Icon className={`text-2xl mx-auto mb-1 ${color}`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" className="input-field pl-9 text-sm"
              placeholder="Search quotation # or client..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field text-sm w-40"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {['DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={quotations} loading={loading} emptyMessage="No quotations found." />
        {pagination && <Pagination pagination={pagination} page={page} onPageChange={setPage} />}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Quotation' : 'New Quotation'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Client *</label>
              <select
                className="input-field text-sm"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
              >
                <option value="">Select client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Valid Until *</label>
              <input type="date" className="input-field text-sm" required
                value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
            <div>
              <label className="label">GST Rate (%)</label>
              <input type="number" className="input-field text-sm" min="0" max="100" step="0.01"
                value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Items *</label>
              <button type="button" onClick={addItem}
                className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1">
                <MdAdd /> Add Row
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-2 bg-gray-50 rounded-xl">
                  <div className="col-span-3">
                    <select className="input-field text-xs py-1.5"
                      value={item.assetId}
                      onChange={(e) => updateItem(i, 'assetId', e.target.value)}>
                      <option value="">Custom item</option>
                      {assets.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="text" className="input-field text-xs py-1.5" placeholder="Description *"
                      value={item.description} required
                      onChange={(e) => updateItem(i, 'description', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="text" className="input-field text-xs py-1.5" placeholder="Location"
                      value={item.location}
                      onChange={(e) => updateItem(i, 'location', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <input type="text" className="input-field text-xs py-1.5" placeholder="Size"
                      value={item.size}
                      onChange={(e) => updateItem(i, 'size', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <input type="number" className="input-field text-xs py-1.5" placeholder="Rate ₹" required
                      value={item.monthlyRate} min="0"
                      onChange={(e) => updateItem(i, 'monthlyRate', e.target.value)} />
                  </div>
                  <div className="col-span-1">
                    <input type="number" className="input-field text-xs py-1.5" placeholder="Mo." required
                      value={item.months} min="1"
                      onChange={(e) => updateItem(i, 'months', e.target.value)} />
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <span className="text-xs font-semibold text-gray-600">
                      ₹{((parseFloat(item.monthlyRate || 0)) * parseInt(item.months || 1)).toLocaleString('en-IN')}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="ml-1 text-red-400 hover:text-red-600">
                        <MdDelete className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Totals preview */}
            <div className="flex justify-end gap-4 mt-3 text-sm text-gray-600">
              <span>Subtotal: <strong>₹{subtotal.toLocaleString('en-IN')}</strong></span>
              <span>GST ({form.taxRate}%): <strong>₹{taxAmt.toLocaleString('en-IN')}</strong></span>
              <span className="text-primary-700 font-bold">Total: ₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Notes</label>
              <textarea className="input-field text-sm" rows={3}
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes for client..." />
            </div>
            <div>
              <label className="label">Terms & Conditions</label>
              <textarea className="input-field text-sm" rows={3}
                value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create Quotation'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
};

export default Quotations;
