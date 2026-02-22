import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import AssetFilters from '../components/assets/AssetFilters';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  BOOKED: 'bg-purple-100 text-purple-800',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  UNDER_MAINTENANCE: 'Maintenance',
  BLOCKED: 'Blocked',
};

const Assets = () => {
  const { get, del, loading } = useApi();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', type: '', status: '', zoneId: '' });
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  const fetchAssets = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (filters.search) params.search = filters.search;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.zoneId) params.zoneId = filters.zoneId;

      const res = await get('/assets', params);
      setAssets(res.data);
      setPagination(res.pagination);
    } catch (error) {
      // handled
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/assets/${deleteId}`);
      toast.success('Asset deleted successfully.');
      setDeleteId(null);
      fetchAssets();
    } catch (error) {
      // handled
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { key: 'code', label: 'Code', render: (row) => (
      <Link to={`/assets/${row.id}`} className="text-primary-600 hover:text-primary-700 font-mono text-xs font-medium">
        {row.code}
      </Link>
    )},
    { key: 'name', label: 'Name', render: (row) => (
      <span className="font-medium text-gray-900">{row.name}</span>
    )},
    { key: 'type', label: 'Type', render: (row) => (
      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{row.type}</span>
    )},
    { key: 'location', label: 'Location', render: (row) => (
      <div>
        <p className="text-sm">{row.locationCity}</p>
        <p className="text-xs text-gray-400">{row.zone?.name}</p>
      </div>
    )},
    { key: 'size', label: 'Size (ft)', render: (row) => `${row.sizeWidth} x ${row.sizeHeight}` },
    { key: 'status', label: 'Status', render: (row) => (
      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[row.status]}`}>
        {statusLabels[row.status]}
      </span>
    )},
    { key: 'monthlyRate', label: 'Rate/Mo', render: (row) => (
      <span className="font-medium">
        {Number(row.monthlyRate).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
      </span>
    )},
    ...(isManager ? [{
      key: 'actions', label: 'Actions', width: '120px', render: (row) => (
        <div className="flex gap-1">
          <Link to={`/assets/${row.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="View">
            <MdVisibility className="text-lg" />
          </Link>
          <Link to={`/assets/${row.id}/edit`} className="p-1.5 rounded hover:bg-gray-100 text-blue-500" title="Edit">
            <MdEdit className="text-lg" />
          </Link>
          <button onClick={() => setDeleteId(row.id)} className="p-1.5 rounded hover:bg-gray-100 text-red-500" title="Delete">
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
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-500 text-sm">Manage your billboards, unipoles & hoardings</p>
        </div>
        {isManager && (
          <Link to="/assets/create" className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> Add Asset
          </Link>
        )}
      </div>

      <AssetFilters filters={filters} onFilterChange={setFilters} />

      <div className="card">
        <DataTable columns={columns} data={assets} loading={loading} emptyMessage="No assets found. Try adjusting your filters." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
};

export default Assets;
