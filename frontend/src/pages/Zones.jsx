import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const Zones = () => {
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', district: '', state: 'Chhattisgarh', description: '' });

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchZones();
  }, [page]);

  const fetchZones = async () => {
    try {
      const res = await get('/zones', { page, limit: 10 });
      setZones(res.data);
      setPagination(res.pagination);
    } catch (error) { /* handled */ }
  };

  const openCreateModal = () => {
    setEditingZone(null);
    setForm({ name: '', city: '', district: '', state: 'Chhattisgarh', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (zone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      city: zone.city,
      district: zone.district,
      state: zone.state,
      description: zone.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingZone) {
        await put(`/zones/${editingZone.id}`, form);
        toast.success('Zone updated successfully!');
      } else {
        await post('/zones', form);
        toast.success('Zone created successfully!');
      }
      setModalOpen(false);
      fetchZones();
    } catch (error) { /* handled */ }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/zones/${deleteId}`);
      toast.success('Zone deleted successfully!');
      setDeleteId(null);
      fetchZones();
    } catch (error) { /* handled */ }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'name', label: 'Zone Name', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'city', label: 'City' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'assets', label: 'Assets', render: (row) => (
      <span className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm font-medium">
        {row._count?.assets || 0}
      </span>
    )},
    { key: 'description', label: 'Description', render: (row) => (
      <span className="text-sm text-gray-500 truncate max-w-[200px] block">{row.description || '-'}</span>
    )},
    ...(isManager ? [{
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
          <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-500 text-sm">Manage geographic zones for your assets</p>
        </div>
        {isManager && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> Add Zone
          </button>
        )}
      </div>

      <div className="card">
        <DataTable columns={columns} data={zones} loading={loading} emptyMessage="No zones found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingZone ? 'Edit Zone' : 'Create Zone'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Zone Name *</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">City *</label>
              <input className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <label className="label-field">District *</label>
              <input className="input-field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label-field">State</label>
            <input className="input-field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <label className="label-field">Description</label>
            <textarea rows={3} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : (editingZone ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Zone"
        message="Are you sure you want to delete this zone? Zones with linked assets cannot be deleted."
        loading={deleting}
      />
    </div>
  );
};

export default Zones;
