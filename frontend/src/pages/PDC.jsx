import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdCheckCircle, MdError,
  MdAccountBalance, MdHourglassEmpty, MdCreditCard, MdWarning,
} from 'react-icons/md';

const statusColors = {
  HELD:       'bg-blue-100 text-blue-800',
  DEPOSITED:  'bg-purple-100 text-purple-800',
  CLEARED:    'bg-green-100 text-green-800',
  BOUNCED:    'bg-red-100 text-red-800',
  CANCELLED:  'bg-gray-100 text-gray-600',
};

const statusOptions = ['HELD', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'CANCELLED'];

const formatCurrency = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const defaultForm = {
  invoiceId: '', chequeNumber: '', bankName: '', branchName: '',
  chequeDate: '', amount: '', notes: '',
};

const PDC = () => {
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();

  const [pdcs, setPdcs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPDC, setEditingPDC] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // { pdc, newStatus }
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [statusForm, setStatusForm] = useState({
    status: '', depositedDate: '', clearedDate: '', bouncedDate: '', bounceReason: '', penaltyAmount: '',
  });
  const [invoices, setInvoices] = useState([]);

  const canWrite = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    fetchPDCs();
    fetchStats();
  }, [page, search, statusFilter]);

  const fetchPDCs = async () => {
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await get('/pdcs', params);
      setPdcs(res.data);
      setPagination(res.pagination);
    } catch (_) {}
  };

  const fetchStats = async () => {
    try {
      const res = await get('/pdcs/stats');
      setStats(res.data);
    } catch (_) {}
  };

  const fetchInvoices = async () => {
    try {
      // Get all invoices that are SENT / PARTIALLY_PAID / OVERDUE (unpaid)
      const res = await get('/invoices', { limit: 200, status: 'SENT' });
      const res2 = await get('/invoices', { limit: 200, status: 'PARTIALLY_PAID' });
      const res3 = await get('/invoices', { limit: 200, status: 'OVERDUE' });
      setInvoices([...(res.data || []), ...(res2.data || []), ...(res3.data || [])]);
    } catch (_) {}
  };

  const openCreateModal = async () => {
    setEditingPDC(null);
    setForm(defaultForm);
    await fetchInvoices();
    setModalOpen(true);
  };

  const openEditModal = (pdc) => {
    setEditingPDC(pdc);
    setForm({
      invoiceId: pdc.invoiceId,
      chequeNumber: pdc.chequeNumber,
      bankName: pdc.bankName,
      branchName: pdc.branchName || '',
      chequeDate: pdc.chequeDate ? pdc.chequeDate.substring(0, 10) : '',
      amount: pdc.amount,
      notes: pdc.notes || '',
    });
    setModalOpen(true);
  };

  const openStatusModal = (pdc, newStatus) => {
    setStatusModal({ pdc, newStatus });
    setStatusForm({
      status: newStatus,
      depositedDate: newStatus === 'DEPOSITED' ? new Date().toISOString().substring(0, 10) : '',
      clearedDate:   newStatus === 'CLEARED'   ? new Date().toISOString().substring(0, 10) : '',
      bouncedDate:   newStatus === 'BOUNCED'   ? new Date().toISOString().substring(0, 10) : '',
      bounceReason: '', penaltyAmount: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPDC) {
        await put(`/pdcs/${editingPDC.id}`, { ...form, amount: parseFloat(form.amount) });
        toast.success('PDC updated.');
      } else {
        await post('/pdcs', { ...form, amount: parseFloat(form.amount) });
        toast.success('PDC recorded.');
      }
      setModalOpen(false);
      fetchPDCs(); fetchStats();
    } catch (_) {}
  };

  const handleStatusUpdate = async () => {
    try {
      await put(`/pdcs/${statusModal.pdc.id}`, statusForm);
      toast.success(`Cheque marked as ${statusModal.newStatus}.`);
      setStatusModal(null);
      fetchPDCs(); fetchStats();
    } catch (_) {}
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/pdcs/${deleteId}`);
      toast.success('PDC deleted.');
      setDeleteId(null);
      fetchPDCs(); fetchStats();
    } catch (_) {}
    finally { setDeleting(false); }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const sf = (key) => (e) => setStatusForm({ ...statusForm, [key]: e.target.value });

  const isChequeDueSoon = (pdc) => {
    if (pdc.status !== 'HELD') return false;
    const days = Math.ceil((new Date(pdc.chequeDate) - new Date()) / (24 * 60 * 60 * 1000));
    return days >= 0 && days <= 7;
  };

  const columns = [
    {
      key: 'chequeNumber',
      label: 'Cheque #',
      render: (row) => (
        <div>
          <p className="font-mono text-sm font-semibold text-gray-800">{row.chequeNumber}</p>
          <p className="text-xs text-gray-400">{row.bankName}{row.branchName ? ` — ${row.branchName}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'client',
      label: 'Client / Invoice',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{row.invoice?.booking?.client?.companyName}</p>
          <p className="text-xs text-gray-500 font-mono">{row.invoice?.invoiceNumber}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="font-semibold text-gray-800">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'chequeDate',
      label: 'Cheque Date',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${isChequeDueSoon(row) ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
            {formatDate(row.chequeDate)}
          </span>
          {isChequeDueSoon(row) && <MdWarning className="text-orange-500 text-sm" title="Due for deposit soon" />}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[row.status]}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '200px',
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          {canWrite && row.status === 'HELD' && (
            <button
              onClick={() => openStatusModal(row, 'DEPOSITED')}
              className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
            >
              Deposit
            </button>
          )}
          {canWrite && row.status === 'DEPOSITED' && (
            <>
              <button
                onClick={() => openStatusModal(row, 'CLEARED')}
                className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium"
              >
                Cleared
              </button>
              <button
                onClick={() => openStatusModal(row, 'BOUNCED')}
                className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium"
              >
                Bounced
              </button>
            </>
          )}
          {canWrite && row.status === 'HELD' && (
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 rounded hover:bg-gray-100 text-blue-500"
            >
              <MdEdit className="text-base" />
            </button>
          )}
          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              onClick={() => setDeleteId(row.id)}
              className="p-1.5 rounded hover:bg-gray-100 text-red-400"
              disabled={['CLEARED', 'DEPOSITED'].includes(row.status)}
            >
              <MdDelete className={`text-base ${['CLEARED', 'DEPOSITED'].includes(row.status) ? 'opacity-30' : ''}`} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDC Tracker</h1>
          <p className="text-gray-500 text-sm">Post-dated cheque management</p>
        </div>
        {canWrite && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> Record Cheque
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Held',          count: stats.held,        icon: MdHourglassEmpty,  color: 'bg-blue-50 text-blue-600' },
            { label: 'Deposited',     count: stats.deposited,   icon: MdAccountBalance,  color: 'bg-purple-50 text-purple-600' },
            { label: 'Cleared',       count: stats.cleared,     icon: MdCheckCircle,     color: 'bg-green-50 text-green-600' },
            { label: 'Bounced',       count: stats.bounced,     icon: MdError,           color: 'bg-red-50 text-red-600' },
            { label: 'Due this week', count: stats.dueThisWeek, icon: MdWarning,         color: 'bg-orange-50 text-orange-600' },
            { label: 'Total Held',    count: formatCurrency(stats.totalHeldAmount), icon: MdCreditCard, color: 'bg-gray-50 text-gray-600', isCurrency: true },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="text-xl" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by cheque no, bank, client, invoice..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field sm:w-44"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable columns={columns} data={pdcs} loading={loading} emptyMessage="No PDC records found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPDC ? 'Edit Cheque' : 'Record PDC'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingPDC && (
            <div>
              <label className="label-field">Invoice *</label>
              <select className="input-field" value={form.invoiceId} onChange={f('invoiceId')} required>
                <option value="">— Select invoice —</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {inv.booking?.client?.companyName} — {formatCurrency(inv.totalAmount)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Cheque Number *</label>
              <input className="input-field font-mono" value={form.chequeNumber} onChange={f('chequeNumber')} required />
            </div>
            <div>
              <label className="label-field">Cheque Date *</label>
              <input type="date" className="input-field" value={form.chequeDate} onChange={f('chequeDate')} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Bank Name *</label>
              <input className="input-field" value={form.bankName} onChange={f('bankName')} required />
            </div>
            <div>
              <label className="label-field">Branch Name</label>
              <input className="input-field" value={form.branchName} onChange={f('branchName')} />
            </div>
          </div>
          <div>
            <label className="label-field">Amount (₹) *</label>
            <input type="number" min="0.01" step="0.01" className="input-field" value={form.amount} onChange={f('amount')} required />
          </div>
          <div>
            <label className="label-field">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={f('notes')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : editingPDC ? 'Update' : 'Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={`Mark Cheque as ${statusModal?.newStatus}`}
        size="sm"
      >
        {statusModal && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl text-sm">
              <p className="font-semibold text-gray-800">{statusModal.pdc.chequeNumber}</p>
              <p className="text-gray-500">{statusModal.pdc.bankName} — {formatCurrency(statusModal.pdc.amount)}</p>
            </div>

            {statusModal.newStatus === 'DEPOSITED' && (
              <div>
                <label className="label-field">Deposit Date *</label>
                <input type="date" className="input-field" value={statusForm.depositedDate} onChange={sf('depositedDate')} required />
              </div>
            )}
            {statusModal.newStatus === 'CLEARED' && (
              <div>
                <label className="label-field">Cleared Date *</label>
                <input type="date" className="input-field" value={statusForm.clearedDate} onChange={sf('clearedDate')} required />
              </div>
            )}
            {statusModal.newStatus === 'BOUNCED' && (
              <>
                <div>
                  <label className="label-field">Bounce Date *</label>
                  <input type="date" className="input-field" value={statusForm.bouncedDate} onChange={sf('bouncedDate')} required />
                </div>
                <div>
                  <label className="label-field">Bounce Reason</label>
                  <input className="input-field" placeholder="e.g. Insufficient funds" value={statusForm.bounceReason} onChange={sf('bounceReason')} />
                </div>
                <div>
                  <label className="label-field">Penalty Amount (₹)</label>
                  <input type="number" min="0" step="0.01" className="input-field" value={statusForm.penaltyAmount} onChange={sf('penaltyAmount')} />
                </div>
              </>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setStatusModal(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors ${
                  statusModal.newStatus === 'BOUNCED' ? 'bg-red-600 hover:bg-red-700' :
                  statusModal.newStatus === 'CLEARED' ? 'bg-green-600 hover:bg-green-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading ? 'Saving...' : `Confirm ${statusModal.newStatus}`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete PDC"
        message="Are you sure you want to delete this cheque record?"
        loading={deleting}
      />
    </div>
  );
};

export default PDC;
