import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoicePDF from '../components/InvoicePDF';
import { MdAdd, MdEdit, MdSearch, MdVisibility, MdPayment, MdDownload } from 'react-icons/md';

const invoiceStatusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-50 text-red-600',
};

const Invoices = () => {
  const { get, post, put, loading } = useApi();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [bookingsForInvoice, setBookingsForInvoice] = useState([]);
  const [form, setForm] = useState({ bookingId: '', subtotal: '', taxRate: '18', dueDate: '', notes: '' });
  const [editForm, setEditForm] = useState({ status: '', notes: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'BANK_TRANSFER', transactionRef: '', paymentDate: '', notes: '' });

  const canManage = ['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user?.role);

  useEffect(() => {
    fetchInvoices();
  }, [page, search, statusFilter]);

  const fetchInvoices = async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await get('/invoices', params);
      setInvoices(res.data);
      setPagination(res.pagination);
    } catch (error) { /* handled */ }
  };

  const openCreateModal = async () => {
    setForm({ bookingId: '', subtotal: '', taxRate: '18', dueDate: '', notes: '' });
    try {
      const res = await get('/bookings', { status: 'ACTIVE', limit: 100 });
      setBookingsForInvoice(res.data || []);
    } catch (error) { /* handled */ }
    setCreateModal(true);
  };

  const handleBookingSelect = (bookingId) => {
    const booking = bookingsForInvoice.find(b => b.id === parseInt(bookingId));
    const totalRate = booking?.bookingAssets?.reduce((sum, ba) => sum + parseFloat(ba.monthlyRate || 0), 0) || 0;
    setForm({
      ...form,
      bookingId,
      subtotal: totalRate || form.subtotal,
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await post('/invoices', {
        bookingId: parseInt(form.bookingId),
        subtotal: parseFloat(form.subtotal),
        taxRate: parseFloat(form.taxRate),
        dueDate: form.dueDate,
        notes: form.notes || undefined,
      });
      toast.success('Invoice created successfully!');
      setCreateModal(false);
      fetchInvoices();
    } catch (error) { /* handled */ }
  };

  const openEditModal = (invoice) => {
    setEditModal(invoice);
    setEditForm({ status: invoice.status, notes: invoice.notes || '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await put(`/invoices/${editModal.id}`, editForm);
      toast.success('Invoice updated successfully!');
      setEditModal(null);
      fetchInvoices();
    } catch (error) { /* handled */ }
  };

  const fetchInvoiceDetail = async (id) => {
    try {
      const res = await get(`/invoices/${id}`);
      setViewModal(res.data);
    } catch (error) { /* handled */ }
  };

  const openPaymentModal = (invoice) => {
    setPaymentModal(invoice);
    const paid = invoice.payments?.reduce((s, p) => s + parseFloat(p.amount), 0) || 0;
    const remaining = parseFloat(invoice.totalAmount) - paid;
    setPaymentForm({
      amount: remaining > 0 ? remaining.toFixed(2) : '',
      method: 'BANK_TRANSFER',
      transactionRef: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await post(`/invoices/${paymentModal.id}/payments`, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        transactionRef: paymentForm.transactionRef || undefined,
        paymentDate: paymentForm.paymentDate || undefined,
        notes: paymentForm.notes || undefined,
      });
      toast.success('Payment recorded successfully!');
      setPaymentModal(null);
      fetchInvoices();
      // Refresh detail if open
      if (viewModal?.id === paymentModal.id) {
        fetchInvoiceDetail(paymentModal.id);
      }
    } catch (error) { /* handled */ }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN');
  const formatCurrency = (v) => `₹${parseFloat(v).toLocaleString('en-IN')}`;

  const columns = [
    {
      key: 'invoiceNumber', label: 'Invoice #', render: (row) => (
        <button onClick={() => fetchInvoiceDetail(row.id)} className="text-primary-600 hover:text-primary-700 font-medium">
          {row.invoiceNumber}
        </button>
      ),
    },
    {
      key: 'client', label: 'Client', render: (row) => (
        <span className="font-medium text-gray-900">{row.booking?.client?.companyName}</span>
      ),
    },
    {
      key: 'booking', label: 'Booking', render: (row) => (
        <span className="text-sm text-gray-600">{row.booking?.bookingCode}</span>
      ),
    },
    {
      key: 'invoiceDate', label: 'Date', render: (row) => formatDate(row.invoiceDate),
    },
    {
      key: 'dueDate', label: 'Due', render: (row) => {
        const overdue = new Date(row.dueDate) < new Date() && row.status !== 'PAID' && row.status !== 'CANCELLED';
        return <span className={overdue ? 'text-red-600 font-medium' : ''}>{formatDate(row.dueDate)}</span>;
      },
    },
    {
      key: 'totalAmount', label: 'Amount', render: (row) => (
        <span className="font-medium">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'status', label: 'Status', render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoiceStatusColors[row.status] || ''}`}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions', width: '160px', render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => fetchInvoiceDetail(row.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <MdVisibility className="text-lg" />
          </button>
          <PDFDownloadLink
            document={<InvoicePDF invoice={row} />}
            fileName={`${row.invoiceNumber}.pdf`}
            className="p-1.5 rounded hover:bg-primary-50 text-primary-600"
            title="Download PDF"
          >
            {({ loading: pdfLoading }) => <MdDownload className={`text-lg ${pdfLoading ? 'opacity-40' : ''}`} />}
          </PDFDownloadLink>
          {canManage && (
            <>
              <button onClick={() => openEditModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500">
                <MdEdit className="text-lg" />
              </button>
              {row.status !== 'PAID' && row.status !== 'CANCELLED' && (
                <button onClick={() => fetchInvoiceDetail(row.id).then(() => {}).catch(() => {}) || openPaymentModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-green-600" title="Record Payment">
                  <MdPayment className="text-lg" />
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  const computedTax = form.subtotal && form.taxRate
    ? (parseFloat(form.subtotal) * parseFloat(form.taxRate) / 100).toFixed(2)
    : '0.00';
  const computedTotal = form.subtotal
    ? (parseFloat(form.subtotal) + parseFloat(computedTax)).toFixed(2)
    : '0.00';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm">Manage invoices and track payments</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> New Invoice
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
              placeholder="Search by invoice number, booking code, or client..."
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
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={invoices} loading={loading} emptyMessage="No invoices found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Invoice" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="label-field">Booking (Active) *</label>
            <select className="input-field" value={form.bookingId} onChange={(e) => handleBookingSelect(e.target.value)} required>
              <option value="">Select Booking</option>
              {bookingsForInvoice.map((b) => {
                const assetLabel = b.bookingAssets?.map(ba => ba.asset?.code).join(', ') || 'No assets';
                const totalRate = b.bookingAssets?.reduce((sum, ba) => sum + parseFloat(ba.monthlyRate || 0), 0) || 0;
                return (
                  <option key={b.id} value={b.id}>
                    {b.bookingCode} - {b.client?.companyName} / {assetLabel} ({formatCurrency(totalRate)}/mo)
                  </option>
                );
              })}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Subtotal (₹) *</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Tax Rate (%)</label>
              <input type="number" step="0.01" min="0" max="100" className="input-field" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Due Date *</label>
              <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(form.subtotal || 0)}</span></div>
            <div className="flex justify-between"><span>Tax ({form.taxRate}%):</span><span>{formatCurrency(computedTax)}</span></div>
            <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 mt-2"><span>Total:</span><span>{formatCurrency(computedTotal)}</span></div>
          </div>
          <div>
            <label className="label-field">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Update Invoice">
        {editModal && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p><strong>{editModal.invoiceNumber}</strong></p>
              <p>Amount: {formatCurrency(editModal.totalAmount)}</p>
            </div>
            <div>
              <label className="label-field">Status</label>
              <select className="input-field" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="OVERDUE">Overdue</option>
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

      {/* View Invoice Detail Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Invoice Details" size="lg">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-lg font-semibold">{viewModal.invoiceNumber}</h4>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoiceStatusColors[viewModal.status] || ''}`}>
                  {viewModal.status.replace('_', ' ')}
                </span>
                <PDFDownloadLink
                  document={<InvoicePDF invoice={viewModal} />}
                  fileName={`${viewModal.invoiceNumber}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {({ loading: pdfLoading }) =>
                    pdfLoading ? 'Preparing…' : <><MdDownload className="text-sm" /> Download PDF</>
                  }
                </PDFDownloadLink>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</h5>
                <p className="font-medium">{viewModal.booking?.client?.companyName}</p>
                <p className="text-sm text-gray-500">{viewModal.booking?.client?.contactPerson}</p>
                <p className="text-sm text-gray-500">{viewModal.booking?.client?.address}</p>
                {viewModal.booking?.client?.gstNumber && (
                  <p className="text-xs text-gray-400 mt-1">GST: {viewModal.booking.client.gstNumber}</p>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">Booking & Assets</h5>
                <p className="font-medium">{viewModal.booking?.bookingCode}</p>
                {viewModal.booking?.bookingAssets?.map((ba, i) => (
                  <p key={i} className="text-sm text-gray-500">{ba.asset?.code} - {ba.asset?.name}</p>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100"><td className="px-4 py-2 text-gray-500">Invoice Date</td><td className="px-4 py-2 text-right">{formatDate(viewModal.invoiceDate)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-4 py-2 text-gray-500">Due Date</td><td className="px-4 py-2 text-right">{formatDate(viewModal.dueDate)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-4 py-2 text-gray-500">Subtotal</td><td className="px-4 py-2 text-right">{formatCurrency(viewModal.subtotal)}</td></tr>
                  <tr className="border-b border-gray-100"><td className="px-4 py-2 text-gray-500">Tax ({parseFloat(viewModal.taxRate)}%)</td><td className="px-4 py-2 text-right">{formatCurrency(viewModal.taxAmount)}</td></tr>
                  <tr className="bg-gray-50"><td className="px-4 py-2 font-semibold">Total</td><td className="px-4 py-2 text-right font-semibold text-primary-600">{formatCurrency(viewModal.totalAmount)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Payments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">Payments</h5>
                {canManage && viewModal.status !== 'PAID' && viewModal.status !== 'CANCELLED' && (
                  <button onClick={() => openPaymentModal(viewModal)} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                    <MdAdd /> Record Payment
                  </button>
                )}
              </div>
              {viewModal.payments && viewModal.payments.length > 0 ? (
                <div className="space-y-2">
                  {viewModal.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm">
                      <div>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                        <span className="text-gray-500 ml-2">via {p.method.replace('_', ' ')}</span>
                        {p.transactionRef && <span className="text-gray-400 ml-2">Ref: {p.transactionRef}</span>}
                      </div>
                      <span className="text-gray-500">{formatDate(p.paymentDate)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-2 text-sm font-medium">
                    <span>Total Paid:</span>
                    <span className="text-green-600">
                      {formatCurrency(viewModal.payments.reduce((s, p) => s + parseFloat(p.amount), 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No payments recorded yet.</p>
              )}
            </div>

            {viewModal.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                <strong>Notes:</strong> {viewModal.notes}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!paymentModal} onClose={() => setPaymentModal(null)} title="Record Payment">
        {paymentModal && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p><strong>{paymentModal.invoiceNumber}</strong></p>
              <p>Total: {formatCurrency(paymentModal.totalAmount)}</p>
            </div>
            <div>
              <label className="label-field">Amount (₹) *</label>
              <input type="number" step="0.01" min="0.01" className="input-field" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Payment Method</label>
                <select className="input-field" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div>
                <label className="label-field">Payment Date</label>
                <input type="date" className="input-field" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label-field">Transaction Reference</label>
              <input className="input-field" value={paymentForm.transactionRef} onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })} placeholder="e.g. NEFT/UTR number, Cheque #" />
            </div>
            <div>
              <label className="label-field">Notes</label>
              <textarea rows={2} className="input-field" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setPaymentModal(null)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
