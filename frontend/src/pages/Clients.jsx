import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdBusiness, MdVisibility } from 'react-icons/md';

const Clients = () => {
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    companyName: '', contactPerson: '', email: '', phone: '', alternatePhone: '',
    address: '', city: '', state: 'Chhattisgarh', pincode: '', gstNumber: '', panNumber: '', notes: '',
  });

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchClients();
  }, [page, search]);

  const fetchClients = async () => {
    try {
      const res = await get('/clients', { page, limit: 10, search: search || undefined });
      setClients(res.data);
      setPagination(res.pagination);
    } catch (error) { /* handled */ }
  };

  const openCreateModal = () => {
    setEditingClient(null);
    setForm({
      companyName: '', contactPerson: '', email: '', phone: '', alternatePhone: '',
      address: '', city: '', state: 'Chhattisgarh', pincode: '', gstNumber: '', panNumber: '', notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setForm({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      alternatePhone: client.alternatePhone || '',
      address: client.address,
      city: client.city,
      state: client.state,
      pincode: client.pincode || '',
      gstNumber: client.gstNumber || '',
      panNumber: client.panNumber || '',
      notes: client.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await put(`/clients/${editingClient.id}`, form);
        toast.success('Client updated successfully!');
      } else {
        await post('/clients', form);
        toast.success('Client created successfully!');
      }
      setModalOpen(false);
      fetchClients();
    } catch (error) { /* handled */ }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/clients/${deleteId}`);
      toast.success('Client deleted successfully!');
      setDeleteId(null);
      fetchClients();
    } catch (error) { /* handled */ }
    finally { setDeleting(false); }
  };

  const columns = [
    {
      key: 'companyName', label: 'Company', render: (row) => (
        <div>
          <span className="font-medium text-gray-900">{row.companyName}</span>
          <p className="text-xs text-gray-500">{row.contactPerson}</p>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    {
      key: 'gstNumber', label: 'GST', render: (row) => (
        <span className="text-xs text-gray-500 font-mono">{row.gstNumber || '-'}</span>
      ),
    },
    {
      key: 'bookings', label: 'Bookings', render: (row) => (
        <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm font-medium">
          {row._count?.bookings || 0}
        </span>
      ),
    },
    ...(isManager ? [{
      key: 'actions', label: 'Actions', width: '120px', render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => setViewModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
            <MdVisibility className="text-lg" />
          </button>
          <button onClick={() => openEditModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500">
            <MdEdit className="text-lg" />
          </button>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded hover:bg-gray-100 text-red-500">
            <MdDelete className="text-lg" />
          </button>
        </div>
      ),
    }] : [{
      key: 'actions', label: '', width: '50px', render: (row) => (
        <button onClick={() => setViewModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
          <MdVisibility className="text-lg" />
        </button>
      ),
    }]),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">Manage your advertising clients</p>
        </div>
        {isManager && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> Add Client
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by company, contact, email, phone, or GST..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="card">
        <DataTable columns={columns} data={clients} loading={loading} emptyMessage="No clients found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingClient ? 'Edit Client' : 'Add Client'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Company Name *</label>
              <input className="input-field" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Contact Person *</label>
              <input className="input-field" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">Phone *</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label-field">Alternate Phone</label>
            <input className="input-field" value={form.alternatePhone} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Address *</label>
            <input className="input-field" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-field">City *</label>
              <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">State</label>
              <input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Pincode</label>
              <input className="input-field" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">GST Number</label>
              <input className="input-field" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            </div>
            <div>
              <label className="label-field">PAN Number</label>
              <input className="input-field" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label-field">Notes</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : (editingClient ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Client Details" size="md">
        {viewModal && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-50 rounded-xl">
                <MdBusiness className="text-2xl text-primary-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{viewModal.companyName}</h4>
                <p className="text-sm text-gray-500">{viewModal.contactPerson}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{viewModal.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{viewModal.phone}</span></div>
              <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="text-gray-900">{viewModal.address}, {viewModal.city}, {viewModal.state}</span></div>
              {viewModal.gstNumber && <div><span className="text-gray-500">GST:</span> <span className="text-gray-900 font-mono text-xs">{viewModal.gstNumber}</span></div>}
              {viewModal.panNumber && <div><span className="text-gray-500">PAN:</span> <span className="text-gray-900 font-mono text-xs">{viewModal.panNumber}</span></div>}
              <div><span className="text-gray-500">Bookings:</span> <span className="font-medium text-primary-600">{viewModal._count?.bookings || 0}</span></div>
            </div>
            {viewModal.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{viewModal.notes}</div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message="Are you sure you want to delete this client? Clients with active bookings cannot be deleted."
        loading={deleting}
      />
    </div>
  );
};

export default Clients;
