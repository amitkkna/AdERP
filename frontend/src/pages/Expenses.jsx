import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdClear,
  MdSchedule, MdExpandMore, MdExpandLess, MdCheckCircle,
} from 'react-icons/md';

const CATEGORIES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'MUNICIPAL_TAX', label: 'Municipal Tax' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PERMISSION_FEE', label: 'Permission Fee' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'INSTALLATION', label: 'Installation' },
  { value: 'OTHER', label: 'Other' },
];

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const frequencyLabels = Object.fromEntries(FREQUENCIES.map((f) => [f.value, f.label]));
const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

const Expenses = () => {
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState({ search: '', assetId: '', category: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    category: '', amount: '', date: '', assetId: '', vendor: '', reference: '', description: '', notes: '',
  });

  // Recurring schedules state
  const [schedules, setSchedules] = useState([]);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    assetId: '', category: '', frequency: '', amount: '', startDate: '', description: '',
  });
  const [editingSchedule, setEditingSchedule] = useState(null);

  const canManage = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    fetchAssets();
    fetchSchedules();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [page, filters]);

  const fetchAssets = async () => {
    try {
      const res = await get('/assets', { all: 'true', limit: 100 });
      setAssets(res.data || []);
    } catch (error) { /* handled */ }
  };

  const fetchSchedules = async () => {
    try {
      const res = await get('/recurring-expenses', { limit: 50 });
      setSchedules(res.data || []);
    } catch (error) { /* handled */ }
  };

  const fetchExpenses = async () => {
    try {
      const params = { page, limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.assetId) params.assetId = filters.assetId;
      if (filters.category) params.category = filters.category;

      const res = await get('/expenses', params);
      setExpenses(res.data || []);
      setPagination(res.pagination);
    } catch (error) { /* handled */ }
  };

  const formatCurrency = (v) => `₹${parseFloat(v || 0).toLocaleString('en-IN')}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const openCreateModal = () => {
    setEditingExpense(null);
    setForm({ category: '', amount: '', date: new Date().toISOString().split('T')[0], assetId: '', vendor: '', reference: '', description: '', notes: '' });
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      category: expense.category,
      amount: parseFloat(expense.amount),
      date: new Date(expense.date).toISOString().split('T')[0],
      assetId: expense.assetId,
      vendor: expense.vendor || '',
      reference: expense.reference || '',
      description: expense.description || '',
      notes: expense.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editingExpense) {
        await put(`/expenses/${editingExpense.id}`, payload);
        toast.success('Expense updated successfully!');
      } else {
        await post('/expenses', payload);
        toast.success('Expense recorded successfully!');
      }
      setModalOpen(false);
      fetchExpenses();
    } catch (error) { /* handled */ }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/expenses/${deleteId}`);
      toast.success('Expense deleted successfully!');
      setDeleteId(null);
      fetchExpenses();
    } catch (error) { /* handled */ }
    finally { setDeleting(false); }
  };

  // Recurring schedule handlers
  const openScheduleCreate = () => {
    setEditingSchedule(null);
    setScheduleForm({ assetId: '', category: '', frequency: '', amount: '', startDate: new Date().toISOString().split('T')[0], description: '' });
    setScheduleModalOpen(true);
  };

  const openScheduleEdit = (sched) => {
    setEditingSchedule(sched);
    setScheduleForm({
      assetId: sched.assetId,
      category: sched.category,
      frequency: sched.frequency,
      amount: parseFloat(sched.amount),
      startDate: new Date(sched.startDate).toISOString().split('T')[0],
      description: sched.description || '',
    });
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await put(`/recurring-expenses/${editingSchedule.id}`, {
          amount: scheduleForm.amount,
          frequency: scheduleForm.frequency,
          description: scheduleForm.description,
        });
        toast.success('Schedule updated!');
      } else {
        await post('/recurring-expenses', scheduleForm);
        toast.success('Recurring schedule created!');
      }
      setScheduleModalOpen(false);
      fetchSchedules();
    } catch (error) { /* handled */ }
  };

  const handleScheduleDelete = async (id) => {
    try {
      await del(`/recurring-expenses/${id}`);
      toast.success('Schedule removed!');
      fetchSchedules();
    } catch (error) { /* handled */ }
  };

  const handleMarkPaid = async (id) => {
    try {
      await post(`/recurring-expenses/${id}/mark-paid`);
      toast.success('Marked as paid, next due date advanced!');
      fetchSchedules();
    } catch (error) { /* handled */ }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', assetId: '', category: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.search || filters.assetId || filters.category;

  const columns = [
    {
      key: 'date', label: 'Date', render: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.date)}</span>
      ),
    },
    {
      key: 'asset', label: 'Asset', render: (row) => (
        <div>
          <span className="font-medium text-gray-900 text-sm">{row.asset?.code}</span>
          <p className="text-xs text-gray-400">{row.asset?.name}</p>
        </div>
      ),
    },
    {
      key: 'category', label: 'Category', render: (row) => (
        <span className="text-sm text-gray-700">{categoryLabels[row.category] || row.category}</span>
      ),
    },
    {
      key: 'vendor', label: 'Vendor', render: (row) => (
        <span className="text-sm text-gray-600">{row.vendor || '-'}</span>
      ),
    },
    {
      key: 'amount', label: 'Amount', render: (row) => (
        <span className="font-semibold text-gray-900 text-sm">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      key: 'reference', label: 'Reference', render: (row) => (
        <span className="text-xs text-gray-500 font-mono">{row.reference || '-'}</span>
      ),
    },
    ...(canManage ? [{
      key: 'actions', label: 'Actions', width: '100px', render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => openEditModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500">
            <MdEdit className="text-lg" />
          </button>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded hover:bg-gray-100 text-red-500">
            <MdDelete className="text-lg" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm">Track asset-wise operational expenses</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> Record Expense
          </button>
        )}
      </div>

      {/* Recurring Schedules — Collapsible */}
      {canManage && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card mb-5 overflow-hidden">
          <button
            onClick={() => setSchedulesOpen(!schedulesOpen)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <MdSchedule className="text-purple-600 text-sm" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Recurring Schedules</span>
              <span className="text-xs text-gray-400 ml-1">({schedules.length})</span>
            </div>
            {schedulesOpen ? <MdExpandLess className="text-xl text-gray-400" /> : <MdExpandMore className="text-xl text-gray-400" />}
          </button>

          {schedulesOpen && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <div className="flex items-center justify-between mt-4 mb-3">
                <p className="text-xs text-gray-400">Manage recurring payment schedules per asset. Mark as paid to advance due dates.</p>
                <button onClick={openScheduleCreate} className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5">
                  <MdAdd className="text-sm" /> Add Schedule
                </button>
              </div>

              {schedules.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No recurring schedules configured yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="px-3 py-2.5 rounded-l-lg">Asset</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Frequency</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                        <th className="px-3 py-2.5">Next Due</th>
                        <th className="px-3 py-2.5">Status</th>
                        <th className="px-3 py-2.5 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {schedules.map((s) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const due = new Date(s.nextDueDate);
                        due.setHours(0, 0, 0, 0);
                        const isOverdue = due < today;
                        const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                        const isDueSoon = !isOverdue && daysUntilDue <= 7;

                        return (
                          <tr key={s.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5">
                              <span className="font-medium text-gray-900">{s.asset?.code}</span>
                              <p className="text-xs text-gray-400">{s.asset?.name}</p>
                            </td>
                            <td className="px-3 py-2.5 text-gray-700">{categoryLabels[s.category] || s.category}</td>
                            <td className="px-3 py-2.5 text-gray-600">{frequencyLabels[s.frequency]}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(s.amount)}</td>
                            <td className="px-3 py-2.5 text-gray-600">{formatDate(s.nextDueDate)}</td>
                            <td className="px-3 py-2.5">
                              {isOverdue ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10">OVERDUE</span>
                              ) : isDueSoon ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10">DUE SOON</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-500/10">UPCOMING</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <button
                                  onClick={() => handleMarkPaid(s.id)}
                                  title="Mark Paid"
                                  className="p-1.5 rounded hover:bg-green-50 text-green-600"
                                >
                                  <MdCheckCircle className="text-lg" />
                                </button>
                                <button
                                  onClick={() => openScheduleEdit(s)}
                                  title="Edit"
                                  className="p-1.5 rounded hover:bg-gray-100 text-blue-500"
                                >
                                  <MdEdit className="text-lg" />
                                </button>
                                <button
                                  onClick={() => handleScheduleDelete(s.id)}
                                  title="Remove"
                                  className="p-1.5 rounded hover:bg-gray-100 text-red-500"
                                >
                                  <MdDelete className="text-lg" />
                                </button>
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
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <MdFilterList className="text-gray-500 text-sm" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto">
              <MdClear className="text-sm" /> Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendor, description..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <select className="input-field" value={filters.assetId} onChange={(e) => handleFilterChange('assetId', e.target.value)}>
            <option value="">All Assets</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>{asset.code} - {asset.name}</option>
            ))}
          </select>
          <select className="input-field" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={expenses} loading={loading} emptyMessage="No expenses found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingExpense ? 'Edit Expense' : 'Record Expense'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Category *</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Asset *</label>
              <select className="input-field" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required>
                <option value="">Select asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.code} - {asset.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Amount (₹) *</label>
              <input type="number" step="0.01" min="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Date *</label>
              <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Vendor / Paid To</label>
              <input className="input-field" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Raipur Municipal Corporation" />
            </div>
            <div>
              <label className="label-field">Reference / Bill No.</label>
              <input className="input-field" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. RMC/TAX/2026/001" />
            </div>
          </div>
          <div>
            <label className="label-field">Description</label>
            <input className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the expense" />
          </div>
          <div>
            <label className="label-field">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Record')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        loading={deleting}
      />

      {/* Recurring Schedule Modal */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title={editingSchedule ? 'Edit Schedule' : 'Add Recurring Schedule'}>
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {!editingSchedule && (
            <>
              <div>
                <label className="label-field">Asset *</label>
                <select className="input-field" value={scheduleForm.assetId} onChange={(e) => setScheduleForm({ ...scheduleForm, assetId: e.target.value })} required>
                  <option value="">Select asset</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Category *</label>
                <select className="input-field" value={scheduleForm.category} onChange={(e) => setScheduleForm({ ...scheduleForm, category: e.target.value })} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Frequency *</label>
              <select className="input-field" value={scheduleForm.frequency} onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })} required>
                <option value="">Select frequency</option>
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Amount (₹) *</label>
              <input type="number" step="0.01" min="0.01" className="input-field" value={scheduleForm.amount} onChange={(e) => setScheduleForm({ ...scheduleForm, amount: e.target.value })} required />
            </div>
          </div>
          {!editingSchedule && (
            <div>
              <label className="label-field">Start Date *</label>
              <input type="date" className="input-field" value={scheduleForm.startDate} onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })} required />
              <p className="text-xs text-gray-400 mt-1">First payment due date. Future dues will be calculated from this date.</p>
            </div>
          )}
          <div>
            <label className="label-field">Description</label>
            <input className="input-field" value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })} placeholder="Optional notes about this schedule" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setScheduleModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
