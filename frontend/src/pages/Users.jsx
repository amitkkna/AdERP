import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { MdEdit, MdBlock, MdCheckCircle, MdLink } from 'react-icons/md';

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  ACCOUNTANT: 'bg-green-100 text-green-800',
  CLIENT: 'bg-purple-100 text-purple-800',
};

const Users = () => {
  const { get, put, loading } = useApi();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [linkingUser, setLinkingUser] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: 'CLIENT', phone: '', password: '' });

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, [page]);

  const fetchUsers = async () => {
    try {
      const res = await get('/users', { page, limit: 10 });
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (_) {}
  };

  const fetchClients = async () => {
    try {
      const res = await get('/clients', { limit: 200 });
      setClients(res.data || []);
    } catch (_) {}
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone || '', password: '' });
    setModalOpen(true);
  };

  const openLinkModal = (user) => {
    setLinkingUser(user);
    setSelectedClientId('');
    setLinkModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      await put(`/users/${editingUser.id}`, data);
      toast.success('User updated successfully!');
      setModalOpen(false);
      fetchUsers();
    } catch (_) {}
  };

  const handleLinkClient = async (e) => {
    e.preventDefault();
    try {
      await put('/portal/link-client', {
        userId: linkingUser.id,
        clientId: selectedClientId ? parseInt(selectedClientId) : null,
      });
      toast.success(selectedClientId ? 'Client linked to user.' : 'User unlinked from client.');
      setLinkModalOpen(false);
      fetchUsers();
    } catch (_) {}
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await put(`/users/${userId}`, { isActive: !isActive });
      toast.success(isActive ? 'User deactivated.' : 'User activated.');
      fetchUsers();
    } catch (_) {}
  };

  const columns = [
    { key: 'name', label: 'Name', render: (_, row) => (
      <div>
        <p className="font-medium text-gray-900">{row.name}</p>
        <p className="text-xs text-gray-400">{row.email}</p>
      </div>
    )},
    { key: 'role', label: 'Role', render: (_, row) => (
      <span className={`text-xs px-2 py-1 rounded-full ${roleColors[row.role]}`}>{row.role}</span>
    )},
    { key: 'phone', label: 'Phone', render: (_, row) => row.phone || '-' },
    { key: 'status', label: 'Status', render: (_, row) => (
      <span className={`text-xs px-2 py-1 rounded-full ${row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'createdAt', label: 'Joined', render: (_, row) => new Date(row.createdAt).toLocaleDateString('en-IN') },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex gap-1">
        <button onClick={() => openEditModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500" title="Edit">
          <MdEdit className="text-lg" />
        </button>
        {row.role === 'CLIENT' && (
          <button onClick={() => openLinkModal(row)} className="p-1.5 rounded hover:bg-gray-100 text-purple-500" title="Link to Client">
            <MdLink className="text-lg" />
          </button>
        )}
        <button
          onClick={() => handleToggleActive(row.id, row.isActive)}
          className={`p-1.5 rounded hover:bg-gray-100 ${row.isActive ? 'text-red-500' : 'text-green-500'}`}
          title={row.isActive ? 'Deactivate' : 'Activate'}
        >
          {row.isActive ? <MdBlock className="text-lg" /> : <MdCheckCircle className="text-lg" />}
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 text-sm">Manage system users and roles. Use the link icon to connect CLIENT users to their client records.</p>
      </div>

      <div className="card">
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">New Password (leave blank to keep current)</label>
            <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : 'Update User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Link Client Modal */}
      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Link Client to User">
        <form onSubmit={handleLinkClient} className="space-y-4">
          <p className="text-sm text-gray-600">
            Link <strong>{linkingUser?.name}</strong> ({linkingUser?.email}) to a client record.
            This will give them access to the Client Portal to view their bookings, invoices, and quotations.
          </p>
          <div>
            <label className="label">Client Record</label>
            <select
              className="input-field"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">— No client linked (unlink) —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactPerson})
                </option>
              ))}
            </select>
          </div>
          {selectedClientId && (
            <div className="p-3 bg-purple-50 rounded-xl text-sm text-purple-700">
              This user will be able to log in and view all data linked to the selected client company.
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setLinkModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Link</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
