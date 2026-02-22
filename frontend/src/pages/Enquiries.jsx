import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdVisibility,
  MdQuestionAnswer,
  MdPhone,
  MdLocationOn,
  MdTrendingUp,
  MdThumbDown,
  MdAccessTime,
  MdClose,
} from 'react-icons/md';

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

const sourceLabels = {
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
  EMAIL: 'Email',
  REFERRAL: 'Referral',
  OTHER: 'Other',
};

const defaultForm = {
  clientId: '',
  clientName: '',
  contactPerson: '',
  phone: '',
  email: '',
  locationPreference: '',
  requirementNotes: '',
  startDate: '',
  endDate: '',
  budget: '',
  source: '',
  followUpDate: '',
  notes: '',
  assignedToId: '',
};

const Enquiries = () => {
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enquiries, setEnquiries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [clients, setClients] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);   // full asset objects for chips
  const [assetResults, setAssetResults] = useState([]);      // server search results
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSearching, setAssetSearching] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState({}); // { assetId: { available, conflicts } }
  const availCheckTimer = useRef(null);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchEnquiries();
    fetchStats();
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (modalOpen) fetchClients();
  }, [modalOpen]);

  // Auto-check availability when assets + dates change
  useEffect(() => {
    if (availCheckTimer.current) clearTimeout(availCheckTimer.current);
    if (!form.startDate || !form.endDate || selectedAssets.length === 0) {
      setAvailabilityMap({});
      return;
    }
    availCheckTimer.current = setTimeout(async () => {
      try {
        const res = await post('/assets/check-availability', {
          assetIds: selectedAssets.map((a) => a.id),
          startDate: form.startDate,
          endDate: form.endDate,
        });
        const map = {};
        (res.data || []).forEach((r) => { map[r.assetId] = r; });
        setAvailabilityMap(map);
      } catch (_) {}
    }, 400);
  }, [selectedAssets, form.startDate, form.endDate]);

  const fetchEnquiries = async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await get('/enquiries', params);
      setEnquiries(res.data);
      setPagination(res.pagination);
    } catch (_) {}
  };

  const fetchStats = async () => {
    try {
      const res = await get('/enquiries/stats');
      setStats(res.data);
    } catch (_) {}
  };

  const fetchClients = async () => {
    try {
      const res = await get('/clients/all');
      setClients(res.data || []);
    } catch (_) {}
  };

  // Debounced server-side asset search
  const assetSearchTimer = useRef(null);
  const searchAssets = useCallback((query) => {
    setAssetSearch(query);
    if (assetSearchTimer.current) clearTimeout(assetSearchTimer.current);
    if (query.length < 2) { setAssetResults([]); return; }
    setAssetSearching(true);
    assetSearchTimer.current = setTimeout(async () => {
      try {
        const res = await get('/assets', { search: query, limit: 20 });
        setAssetResults(res.data || []);
      } catch (_) {}
      setAssetSearching(false);
    }, 300);
  }, []);

  const openCreateModal = () => {
    setEditingEnquiry(null);
    setForm(defaultForm);
    setSelectedAssets([]);
    setAssetSearch('');
    setAssetResults([]);
    setModalOpen(true);
  };

  const openEditModal = (enq) => {
    setEditingEnquiry(enq);
    setForm({
      clientId: enq.clientId || '',
      clientName: enq.clientName,
      contactPerson: enq.contactPerson,
      phone: enq.phone,
      email: enq.email || '',
      locationPreference: enq.locationPreference || '',
      requirementNotes: enq.requirementNotes || '',
      startDate: enq.startDate ? enq.startDate.substring(0, 10) : '',
      endDate: enq.endDate ? enq.endDate.substring(0, 10) : '',
      budget: enq.budget || '',
      source: enq.source || '',
      followUpDate: enq.followUpDate ? enq.followUpDate.substring(0, 10) : '',
      notes: enq.notes || '',
      assignedToId: enq.assignedToId || '',
    });
    setSelectedAssets((enq.enquiryAssets || []).map((ea) => ea.asset));
    setAssetSearch('');
    setAssetResults([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        clientId: form.clientId ? parseInt(form.clientId) : null,
        budget: form.budget ? parseFloat(form.budget) : null,
        assignedToId: form.assignedToId ? parseInt(form.assignedToId) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        followUpDate: form.followUpDate || null,
        assetIds: selectedAssets.map((a) => a.id),
      };
      if (editingEnquiry) {
        await put(`/enquiries/${editingEnquiry.id}`, payload);
        toast.success('Enquiry updated successfully!');
      } else {
        await post('/enquiries', payload);
        toast.success('Enquiry created successfully!');
      }
      setModalOpen(false);
      fetchEnquiries();
      fetchStats();
    } catch (_) {}
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await del(`/enquiries/${deleteId}`);
      toast.success('Enquiry deleted.');
      setDeleteId(null);
      fetchEnquiries();
      fetchStats();
    } catch (_) {}
    finally { setDeleting(false); }
  };

  const f = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const columns = [
    {
      key: 'enquiryNo',
      label: 'Enquiry #',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-primary-600">{row.enquiryNo}</span>
      ),
    },
    {
      key: 'clientName',
      label: 'Company / Contact',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{row.clientName}</p>
          <p className="text-xs text-gray-500">{row.contactPerson}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row) => <span className="text-sm text-gray-600">{row.phone}</span>,
    },
    {
      key: 'locationPreference',
      label: 'Locations / Assets',
      render: (row) => (
        <div>
          {row.enquiryAssets?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.enquiryAssets.slice(0, 3).map((ea) => (
                <span key={ea.asset.id} className="text-[10px] bg-primary-50 text-primary-700 font-medium px-1.5 py-0.5 rounded">
                  {ea.asset.code}
                </span>
              ))}
              {row.enquiryAssets.length > 3 && (
                <span className="text-[10px] text-gray-400">+{row.enquiryAssets.length - 3} more</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">{row.locationPreference || '—'}</span>
          )}
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
      key: 'followUpDate',
      label: 'Follow-up',
      render: (row) => {
        if (!row.followUpDate) return <span className="text-gray-400 text-xs">—</span>;
        const date = new Date(row.followUpDate);
        const today = new Date();
        const isOverdue = date < today && row.status === 'NEW';
        return (
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (row) => (
        <div className="flex gap-1">
          <button
            onClick={() => navigate(`/enquiries/${row.id}`)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            title="View details"
          >
            <MdVisibility className="text-lg" />
          </button>
          {isManager && (
            <>
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 rounded hover:bg-gray-100 text-blue-500"
                title="Edit"
              >
                <MdEdit className="text-lg" />
              </button>
              <button
                onClick={() => setDeleteId(row.id)}
                className="p-1.5 rounded hover:bg-gray-100 text-red-500"
                title="Delete"
                disabled={!!row.bookingId}
              >
                <MdDelete className={`text-lg ${row.bookingId ? 'opacity-30' : ''}`} />
              </button>
            </>
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
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 text-sm">Track and manage all incoming enquiries</p>
        </div>
        {isManager && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <MdAdd className="text-xl" /> Add Enquiry
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-xl">
              <MdQuestionAnswer className="text-2xl text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Enquiries</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <MdAccessTime className="text-2xl text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <MdTrendingUp className="text-2xl text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.won}</p>
              <p className="text-xs text-gray-500">Won ({stats.winRate}% win rate)</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <MdThumbDown className="text-2xl text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.lost}</p>
              <p className="text-xs text-gray-500">Lost</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by enquiry no, company, contact, phone..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field sm:w-40"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <DataTable columns={columns} data={enquiries} loading={loading} emptyMessage="No enquiries found." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEnquiry ? 'Edit Enquiry' : 'New Enquiry'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prospect Info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Company / Prospect Name *</label>
              <input className="input-field" value={form.clientName} onChange={f('clientName')} required />
            </div>
            <div>
              <label className="label-field">Link to Existing Client</label>
              <select className="input-field" value={form.clientId} onChange={f('clientId')}>
                <option value="">— Not linked —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Contact Person *</label>
              <input className="input-field" value={form.contactPerson} onChange={f('contactPerson')} required />
            </div>
            <div>
              <label className="label-field">Phone *</label>
              <input className="input-field" value={form.phone} onChange={f('phone')} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={f('email')} />
            </div>
            <div>
              <label className="label-field">Source</label>
              <select className="input-field" value={form.source} onChange={f('source')}>
                <option value="">— Select —</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
                <option value="REFERRAL">Referral</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Requirement</p>
          <div>
            <label className="label-field">Location Preference</label>
            <input
              className="input-field"
              placeholder="e.g. Main Road Raipur, near bus stand..."
              value={form.locationPreference}
              onChange={f('locationPreference')}
            />
          </div>

          {/* Asset multi-select (server-side search) */}
          <div>
            <label className="label-field">Select Assets / Locations</label>
            {/* Selected assets with availability */}
            {selectedAssets.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {selectedAssets.map((a) => {
                  const avail = availabilityMap[a.id];
                  const hasConflict = avail && !avail.available;
                  const isAvailable = avail && avail.available;
                  return (
                    <div key={a.id} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
                      hasConflict ? 'bg-red-50 border-red-200' : isAvailable ? 'bg-green-50 border-green-200' : 'bg-primary-50 border-primary-100'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          <span className="font-mono text-primary-600 text-[10px] mr-1">{a.code}</span>
                          {a.name} ({a.locationCity})
                          {a.sizeWidth && a.sizeHeight && <span className="text-gray-400 ml-1">{a.sizeWidth}×{a.sizeHeight}ft</span>}
                        </p>
                        {hasConflict && avail.conflicts.map((c, i) => (
                          <p key={i} className="text-[10px] text-red-600 mt-0.5">
                            Booked: {c.bookingCode} ({c.clientName}) — {new Date(c.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} to {new Date(c.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </p>
                        ))}
                      </div>
                      {isAvailable && <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">AVAILABLE</span>}
                      {hasConflict && <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">CONFLICT</span>}
                      <button type="button" onClick={() => setSelectedAssets((prev) => prev.filter((x) => x.id !== a.id))} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                        <MdClose className="text-sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Search input */}
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9 text-sm"
                placeholder="Type 2+ characters to search assets..."
                value={assetSearch}
                onChange={(e) => searchAssets(e.target.value)}
              />
              {assetSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
            {/* Search results dropdown */}
            {assetSearch.length >= 2 && (
              <div className="border border-gray-200 rounded-xl mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100">
                {assetResults.length === 0 && !assetSearching && (
                  <p className="text-sm text-gray-400 text-center py-4">No assets found for "{assetSearch}"</p>
                )}
                {assetResults
                  .filter((a) => !selectedAssets.some((s) => s.id === a.id))
                  .map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="flex items-center gap-3 px-3 py-2 w-full text-left hover:bg-primary-50 transition-colors"
                      onClick={() => {
                        setSelectedAssets((prev) => [...prev, a]);
                        setAssetSearch('');
                        setAssetResults([]);
                      }}
                    >
                      <MdAdd className="text-primary-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          <span className="font-mono text-primary-600 text-xs mr-1">{a.code}</span>
                          {a.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {a.locationCity}
                          {a.sizeWidth && a.sizeHeight ? ` • ${a.sizeWidth}×${a.sizeHeight} ft` : ''}
                          {a.zone?.name ? ` • ${a.zone.name}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        a.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        a.status === 'BOOKED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {a.status}
                      </span>
                    </button>
                  ))}
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
              {selectedAssets.length > 0 && (!form.startDate || !form.endDate) && (
                <span className="text-amber-500 ml-1">— fill dates below to check availability</span>
              )}
            </p>
          </div>

          <div>
            <label className="label-field">Requirement Notes</label>
            <textarea rows={2} className="input-field" value={form.requirementNotes} onChange={f('requirementNotes')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Desired Start Date</label>
              <input type="date" className="input-field" value={form.startDate} onChange={f('startDate')} />
            </div>
            <div>
              <label className="label-field">Desired End Date</label>
              <input type="date" className="input-field" value={form.endDate} onChange={f('endDate')} />
            </div>
            <div>
              <label className="label-field">Budget (₹)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.budget} onChange={f('budget')} />
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Follow-up</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Next Follow-up Date</label>
              <input type="date" className="input-field" value={form.followUpDate} onChange={f('followUpDate')} />
            </div>
          </div>
          <div>
            <label className="label-field">Notes / Remarks</label>
            <textarea rows={2} className="input-field" value={form.notes} onChange={f('notes')} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : editingEnquiry ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? All activity logs will also be removed."
        loading={deleting}
      />
    </div>
  );
};

export default Enquiries;
