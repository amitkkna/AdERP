import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdSearch, MdVisibility, MdDownload, MdClose } from 'react-icons/md';
import { pdf } from '@react-pdf/renderer';
import BookingConfirmationPDF from '../components/pdf/BookingConfirmationPDF';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const Bookings = () => {
  const { get, post, put, loading } = useApi();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [clients, setClients] = useState([]);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({
    clientId: '', startDate: '', endDate: '', notes: '',
    assets: [{ assetId: '', monthlyRate: '' }],
  });
  const [editForm, setEditForm] = useState({ status: '', notes: '' });
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchBookings();
  }, [page, search, statusFilter]);

  const fetchBookings = async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await get('/bookings', params);
      setBookings(res.data);
      setPagination(res.pagination);
    } catch (error) { /* handled */ }
  };

  const openCreateModal = async () => {
    setForm({ clientId: '', startDate: '', endDate: '', notes: '', assets: [{ assetId: '', monthlyRate: '' }] });
    try {
      const [clientRes, assetRes] = await Promise.all([
        get('/clients/all'),
        get('/assets', { limit: 200 }),
      ]);
      setClients(clientRes.data || []);
      setAssets(assetRes.data || []);
    } catch (error) { /* handled */ }
    setModalOpen(true);
  };

  // Multi-asset form helpers
  const handleAssetChange = (index, assetId) => {
    const asset = assets.find(a => a.id === parseInt(assetId));
    const newAssets = [...form.assets];
    newAssets[index] = { assetId, monthlyRate: asset ? asset.monthlyRate : '' };
    setForm({ ...form, assets: newAssets });
  };

  const handleRateChange = (index, monthlyRate) => {
    const newAssets = [...form.assets];
    newAssets[index] = { ...newAssets[index], monthlyRate };
    setForm({ ...form, assets: newAssets });
  };

  const addAssetRow = () => {
    setForm({ ...form, assets: [...form.assets, { assetId: '', monthlyRate: '' }] });
  };

  const removeAssetRow = (index) => {
    if (form.assets.length <= 1) return;
    setForm({ ...form, assets: form.assets.filter((_, i) => i !== index) });
  };

  const getSelectedAssetIds = () => form.assets.map(a => parseInt(a.assetId)).filter(Boolean);

  const calculateTotal = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const months = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
    const totalMonthlyRate = form.assets.reduce((sum, a) => sum + (parseFloat(a.monthlyRate) || 0), 0);
    return totalMonthlyRate * months;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/bookings', {
        clientId: parseInt(form.clientId),
        assets: form.assets.map(a => ({
          assetId: parseInt(a.assetId),
          monthlyRate: parseFloat(a.monthlyRate),
        })),
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes || undefined,
      });
      toast.success('Booking created successfully!');
      setModalOpen(false);
      fetchBookings();
    } catch (error) { /* handled */ }
  };

  const openEditModal = (booking) => {
    setEditModal(booking);
    setEditForm({ status: booking.status, notes: booking.notes || '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await put(`/bookings/${editModal.id}`, editForm);
      toast.success('Booking updated successfully!');
      setEditModal(null);
      fetchBookings();
    } catch (error) { /* handled */ }
  };

  const fetchBookingDetail = async (id) => {
    try {
      const res = await get(`/bookings/${id}`);
      setViewModal(res.data);
    } catch (error) { /* handled */ }
  };

  const handleDownloadPdf = async (bookingId, bookingData) => {
    setDownloadingPdf(bookingId);
    try {
      let data = bookingData;
      if (!data || !data.client) {
        const res = await get(`/bookings/${bookingId}`);
        data = res.data;
      }
      const blob = await pdf(<BookingConfirmationPDF booking={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Booking-${data.bookingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN');
  const formatCurrency = (v) => `₹${parseFloat(v).toLocaleString('en-IN')}`;

  const columns = [
    {
      key: 'bookingCode', label: 'Code', render: (row) => (
        <button onClick={() => fetchBookingDetail(row.id)} className="text-primary-600 hover:text-primary-700 font-medium">
          {row.bookingCode}
        </button>
      ),
    },
    {
      key: 'client', label: 'Client', render: (row) => (
        <div>
          <span className="font-medium text-gray-900">{row.client?.companyName}</span>
          <p className="text-xs text-gray-500">{row.client?.contactPerson}</p>
        </div>
      ),
    },
    {
      key: 'asset', label: 'Assets', render: (row) => {
        const bas = row.bookingAssets || [];
        const first = bas[0]?.asset;
        return (
          <div>
            <span className="font-medium text-gray-700">{first?.code || '-'}</span>
            {bas.length > 1 && (
              <span className="text-xs text-primary-500 ml-1 font-medium">(+{bas.length - 1} more)</span>
            )}
            <p className="text-xs text-gray-500">{first?.name || ''}</p>
          </div>
        );
      },
    },
    {
      key: 'period', label: 'Period', render: (row) => (
        <span className="text-xs">{formatDate(row.startDate)} - {formatDate(row.endDate)}</span>
      ),
    },
    {
      key: 'totalAmount', label: 'Amount', render: (row) => (
        <span className="font-medium">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'status', label: 'Status', render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status] || ''}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', width: '130px', render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => fetchBookingDetail(row.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View">
            <MdVisibility className="text-lg" />
          </button>
          <button
            onClick={() => handleDownloadPdf(row.id)}
            disabled={downloadingPdf === row.id}
            className="p-1.5 rounded hover:bg-gray-100 text-emerald-500 disabled:opacity-40"
            title="Download PDF"
          >
            <MdDownload className="text-lg" />
          </button>
          {isManager && (
            <button onClick={() => openEditModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500" title="Edit">
              <MdEdit className="text-lg" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 text-sm">Manage asset bookings and campaigns</p>
        </div>
        {isManager && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> New Booking
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by booking code, client, or asset..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input-field w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={bookings} loading={loading} emptyMessage="No bookings found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create Booking Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Booking" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Client *</label>
            <select className="input-field" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName} - {c.contactPerson}</option>
              ))}
            </select>
          </div>

          {/* Multi-asset selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-field mb-0">Assets *</label>
              <button type="button" onClick={addAssetRow} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                <MdAdd className="text-base" /> Add Asset
              </button>
            </div>
            <div className="space-y-2">
              {form.assets.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className="input-field flex-1"
                    value={entry.assetId}
                    onChange={(e) => handleAssetChange(index, e.target.value)}
                    required
                  >
                    <option value="">Select Asset</option>
                    {assets
                      .filter(a => a.status === 'AVAILABLE' || parseInt(entry.assetId) === a.id)
                      .filter(a => !getSelectedAssetIds().includes(a.id) || parseInt(entry.assetId) === a.id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.locationCity}) - ₹{parseFloat(a.monthlyRate).toLocaleString()}/mo
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field w-36"
                    placeholder="Rate/mo"
                    value={entry.monthlyRate}
                    onChange={(e) => handleRateChange(index, e.target.value)}
                    required
                  />
                  {form.assets.length > 1 && (
                    <button type="button" onClick={() => removeAssetRow(index)} className="p-2 rounded hover:bg-red-50 text-red-500" title="Remove">
                      <MdClose className="text-lg" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Start Date *</label>
              <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">End Date *</label>
              <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>

          {/* Total preview */}
          {form.startDate && form.endDate && form.assets.some(a => a.monthlyRate) && (
            <div className="p-3 bg-primary-50 rounded-lg text-sm">
              <span className="text-primary-700">Estimated Total: </span>
              <span className="font-bold text-primary-900">₹{calculateTotal().toLocaleString('en-IN')}</span>
              <span className="text-primary-600 ml-2">({form.assets.filter(a => a.assetId).length} asset{form.assets.filter(a => a.assetId).length > 1 ? 's' : ''})</span>
            </div>
          )}

          <div>
            <label className="label-field">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Booking Status Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Update Booking">
        {editModal && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p><strong>Code:</strong> {editModal.bookingCode}</p>
              <p><strong>Client:</strong> {editModal.client?.companyName}</p>
              <p className="mt-1"><strong>Assets:</strong></p>
              {editModal.bookingAssets?.map((ba, i) => (
                <p key={i} className="text-gray-600 ml-2">{ba.asset?.code} - {ba.asset?.name} (₹{parseFloat(ba.monthlyRate).toLocaleString()}/mo)</p>
              ))}
            </div>
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label-field">Notes</label>
              <textarea rows={2} className="input-field" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Booking Detail Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Booking Details" size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-semibold">{viewModal.bookingCode}</h4>
                <button
                  onClick={() => handleDownloadPdf(viewModal.id, viewModal)}
                  disabled={downloadingPdf === viewModal.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  <MdDownload className="text-sm" />
                  {downloadingPdf === viewModal.id ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[viewModal.status] || ''}`}>
                {viewModal.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Client</h5>
                <p className="font-medium">{viewModal.client?.companyName}</p>
                <p className="text-sm text-gray-500">{viewModal.client?.contactPerson}</p>
                <p className="text-sm text-gray-500">{viewModal.client?.phone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Assets ({viewModal.bookingAssets?.length || 0})</h5>
                {viewModal.bookingAssets?.map((ba, i) => (
                  <div key={i} className="mb-2 last:mb-0">
                    <p className="font-medium">{ba.asset?.code}</p>
                    <p className="text-sm text-gray-500">{ba.asset?.name}</p>
                    {ba.asset?.zone && <p className="text-sm text-gray-500">{ba.asset.zone.name}, {ba.asset.zone.city}</p>}
                    <p className="text-xs text-primary-600 font-medium">₹{parseFloat(ba.monthlyRate).toLocaleString()}/mo</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500 block">Start Date</span><span className="font-medium">{formatDate(viewModal.startDate)}</span></div>
              <div><span className="text-gray-500 block">End Date</span><span className="font-medium">{formatDate(viewModal.endDate)}</span></div>
              <div>
                <span className="text-gray-500 block">Monthly Rate</span>
                <span className="font-medium">
                  {formatCurrency(viewModal.bookingAssets?.reduce((sum, ba) => sum + parseFloat(ba.monthlyRate), 0) || 0)}
                </span>
              </div>
              <div><span className="text-gray-500 block">Total Amount</span><span className="font-medium text-primary-600">{formatCurrency(viewModal.totalAmount)}</span></div>
            </div>

            {viewModal.invoices && viewModal.invoices.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Invoices</h5>
                <div className="space-y-2">
                  {viewModal.invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <span className="font-medium">{inv.invoiceNumber}</span>
                        <span className="text-gray-500 ml-2">{formatDate(inv.invoiceDate)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatCurrency(inv.totalAmount)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          inv.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                          inv.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewModal.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                <strong>Notes:</strong> {viewModal.notes}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Bookings;
