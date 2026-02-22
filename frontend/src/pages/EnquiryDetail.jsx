import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import { pdf } from '@react-pdf/renderer';
import CampaignPDF from '../components/pdf/CampaignPDF';
import {
  MdArrowBack,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdCalendarToday,
  MdBusiness,
  MdEdit,
  MdCheckCircle,
  MdCancel,
  MdSwapHoriz,
  MdNote,
  MdPeople,
  MdAdd,
  MdClose,
  MdBookmarkAdded,
  MdOpenInNew,
  MdPictureAsPdf,
} from 'react-icons/md';

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

const activityIcons = {
  NOTE: MdNote,
  CALL: MdPhone,
  EMAIL: MdEmail,
  MEETING: MdPeople,
  STATUS_CHANGE: MdSwapHoriz,
};

const activityColors = {
  NOTE: 'bg-gray-100 text-gray-600',
  CALL: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-purple-100 text-purple-600',
  MEETING: 'bg-yellow-100 text-yellow-700',
  STATUS_CHANGE: 'bg-orange-100 text-orange-600',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const EnquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, post, put, loading } = useApi();
  const { user } = useAuth();

  const [enquiry, setEnquiry] = useState(null);
  const [fetching, setFetching] = useState(true);

  // Activity form
  const [activityForm, setActivityForm] = useState({ type: 'NOTE', description: '' });
  const [loggingActivity, setLoggingActivity] = useState(false);

  // Mark Lost modal
  const [lostModal, setLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [markingLost, setMarkingLost] = useState(false);

  // Convert to Booking modal
  const [convertModal, setConvertModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [assets, setAssets] = useState([]);
  const [convertForm, setConvertForm] = useState({
    clientId: '',
    startDate: '',
    endDate: '',
    notes: '',
    assets: [{ assetId: '', monthlyRate: '' }],
  });
  const [converting, setConverting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchEnquiry();
  }, [id]);

  const fetchEnquiry = async () => {
    setFetching(true);
    try {
      const res = await get(`/enquiries/${id}`);
      setEnquiry(res.data);
    } catch (_) {
      navigate('/enquiries');
    } finally {
      setFetching(false);
    }
  };

  const handleDownloadCampaignPdf = async () => {
    if (!enquiry.enquiryAssets?.length) {
      toast.error('No assets linked to this enquiry.');
      return;
    }
    setGeneratingPdf(true);
    try {
      const res = await get(`/enquiries/${id}/campaign`);
      const blob = await pdf(<CampaignPDF enquiry={res.data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Campaign-${enquiry.enquiryNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Campaign PDF downloaded!');
    } catch (_) {
      toast.error('Failed to generate Campaign PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleMarkWon = async () => {
    try {
      await put(`/enquiries/${id}`, { status: 'WON' });
      toast.success('Enquiry marked as Won!');
      fetchEnquiry();
    } catch (_) {}
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) {
      toast.error('Please enter a reason for losing this enquiry.');
      return;
    }
    setMarkingLost(true);
    try {
      await put(`/enquiries/${id}`, { status: 'LOST', lostReason });
      toast.success('Enquiry marked as Lost.');
      setLostModal(false);
      setLostReason('');
      fetchEnquiry();
    } catch (_) {}
    finally { setMarkingLost(false); }
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();
    setLoggingActivity(true);
    try {
      await post(`/enquiries/${id}/activities`, activityForm);
      toast.success('Activity logged.');
      setActivityForm({ type: 'NOTE', description: '' });
      fetchEnquiry();
    } catch (_) {}
    finally { setLoggingActivity(false); }
  };

  const openConvertModal = async () => {
    try {
      const [clientRes, assetRes] = await Promise.all([
        get('/clients/all'),
        get('/assets', { limit: 200 }),
      ]);
      setClients(clientRes.data || []);
      const availableAssets = (assetRes.data || []).filter((a) => a.status === 'AVAILABLE');
      setAssets(availableAssets);
      // Pre-populate with enquiry's linked assets
      const linkedAssets = (enquiry.enquiryAssets || [])
        .filter((ea) => availableAssets.some((a) => a.id === ea.asset.id))
        .map((ea) => ({ assetId: String(ea.asset.id), monthlyRate: String(ea.asset.monthlyRate) }));
      setConvertForm({
        clientId: enquiry.clientId ? String(enquiry.clientId) : '',
        startDate: enquiry.startDate ? enquiry.startDate.substring(0, 10) : '',
        endDate: enquiry.endDate ? enquiry.endDate.substring(0, 10) : '',
        notes: enquiry.notes || '',
        assets: linkedAssets.length > 0 ? linkedAssets : [{ assetId: '', monthlyRate: '' }],
      });
    } catch (_) {}
    setConvertModal(true);
  };

  const handleAssetChange = (index, assetId) => {
    const asset = assets.find((a) => a.id === parseInt(assetId));
    const updated = [...convertForm.assets];
    updated[index] = { assetId, monthlyRate: asset ? String(asset.monthlyRate) : '' };
    setConvertForm({ ...convertForm, assets: updated });
  };

  const handleRateChange = (index, monthlyRate) => {
    const updated = [...convertForm.assets];
    updated[index] = { ...updated[index], monthlyRate };
    setConvertForm({ ...convertForm, assets: updated });
  };

  const addAssetRow = () =>
    setConvertForm({ ...convertForm, assets: [...convertForm.assets, { assetId: '', monthlyRate: '' }] });

  const removeAssetRow = (index) => {
    if (convertForm.assets.length <= 1) return;
    setConvertForm({ ...convertForm, assets: convertForm.assets.filter((_, i) => i !== index) });
  };

  const getSelectedAssetIds = () => convertForm.assets.map((a) => parseInt(a.assetId)).filter(Boolean);

  const calculateTotal = () => {
    if (!convertForm.startDate || !convertForm.endDate) return 0;
    const start = new Date(convertForm.startDate);
    const end = new Date(convertForm.endDate);
    const months = Math.max(1, Math.ceil((end - start) / (30 * 24 * 60 * 60 * 1000)));
    return convertForm.assets.reduce((sum, a) => sum + (parseFloat(a.monthlyRate) || 0), 0) * months;
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    setConverting(true);
    try {
      const payload = {
        clientId: parseInt(convertForm.clientId),
        startDate: convertForm.startDate,
        endDate: convertForm.endDate,
        notes: convertForm.notes || null,
        assets: convertForm.assets
          .filter((a) => a.assetId)
          .map((a) => ({ assetId: parseInt(a.assetId), monthlyRate: parseFloat(a.monthlyRate) })),
      };
      await post(`/enquiries/${id}/convert`, payload);
      toast.success('Booking created successfully!');
      setConvertModal(false);
      fetchEnquiry();
      navigate('/bookings');
    } catch (_) {}
    finally { setConverting(false); }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!enquiry) return null;

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/enquiries')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <MdArrowBack className="text-xl" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{enquiry.enquiryNo}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[enquiry.status]}`}>
              {enquiry.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Created {formatDateTime(enquiry.createdAt)} by {enquiry.createdBy?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — details + activity */}
        <div className="lg:col-span-3 space-y-6">
          {/* Prospect details */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Enquiry Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MdBusiness className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Company</p>
                  <p className="font-medium text-gray-900">{enquiry.clientName}</p>
                  {enquiry.client && (
                    <p className="text-xs text-primary-600 mt-0.5">(Client: {enquiry.client.companyName})</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdPeople className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Contact Person</p>
                  <p className="font-medium text-gray-900">{enquiry.contactPerson}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MdPhone className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="font-medium text-gray-900">{enquiry.phone}</p>
                </div>
              </div>
              {enquiry.email && (
                <div className="flex items-start gap-2">
                  <MdEmail className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="font-medium text-gray-900">{enquiry.email}</p>
                  </div>
                </div>
              )}
              {enquiry.locationPreference && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <MdLocationOn className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Location Preference</p>
                    <p className="font-medium text-gray-900">{enquiry.locationPreference}</p>
                  </div>
                </div>
              )}
              {(enquiry.startDate || enquiry.endDate) && (
                <div className="flex items-start gap-2">
                  <MdCalendarToday className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Desired Period</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(enquiry.startDate)} — {formatDate(enquiry.endDate)}
                    </p>
                  </div>
                </div>
              )}
              {enquiry.budget && (
                <div>
                  <p className="text-gray-400 text-xs">Budget</p>
                  <p className="font-medium text-gray-900">
                    ₹{parseFloat(enquiry.budget).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {enquiry.source && (
                <div>
                  <p className="text-gray-400 text-xs">Source</p>
                  <p className="font-medium text-gray-900">{enquiry.source.replace('_', ' ')}</p>
                </div>
              )}
              {enquiry.followUpDate && (
                <div>
                  <p className="text-gray-400 text-xs">Next Follow-up</p>
                  <p className="font-medium text-gray-900">{formatDate(enquiry.followUpDate)}</p>
                </div>
              )}
            </div>
            {/* Interested Assets */}
            {enquiry.enquiryAssets?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-2">Interested Assets ({enquiry.enquiryAssets.length})</p>
                <div className="space-y-1.5">
                  {enquiry.enquiryAssets.map((ea) => (
                    <div key={ea.asset.id} className="flex items-center gap-3 p-2.5 bg-primary-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-mono text-primary-600 text-xs mr-1.5">{ea.asset.code}</span>
                          {ea.asset.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {ea.asset.locationCity}
                          {ea.asset.zone?.name ? ` • ${ea.asset.zone.name}` : ''}
                          {ea.asset.sizeWidth && ea.asset.sizeHeight ? ` • ${ea.asset.sizeWidth}×${ea.asset.sizeHeight} ft` : ''}
                          {ea.asset.type ? ` • ${ea.asset.type}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-primary-700">
                        ₹{parseFloat(ea.asset.monthlyRate).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enquiry.requirementNotes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Requirement Notes</p>
                <p className="text-sm text-gray-700">{enquiry.requirementNotes}</p>
              </div>
            )}
            {enquiry.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{enquiry.notes}</p>
              </div>
            )}
            {enquiry.lostReason && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl">
                <p className="text-xs text-red-400 mb-1">Lost Reason</p>
                <p className="text-sm text-red-700">{enquiry.lostReason}</p>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Activity Log</h2>

            {/* Log new activity */}
            {isManager && enquiry.status === 'NEW' && (
              <form onSubmit={handleLogActivity} className="mb-5 p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label-field">Type</label>
                    <select
                      className="input-field"
                      value={activityForm.type}
                      onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                    >
                      <option value="NOTE">Note</option>
                      <option value="CALL">Call</option>
                      <option value="EMAIL">Email</option>
                      <option value="MEETING">Meeting</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label-field">Description</label>
                    <input
                      className="input-field"
                      placeholder="What happened?"
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={loggingActivity} className="btn-primary text-sm disabled:opacity-50">
                    {loggingActivity ? 'Saving...' : 'Log Activity'}
                  </button>
                </div>
              </form>
            )}

            {/* Activity list */}
            <div className="space-y-3">
              {enquiry.activities.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No activities yet.</p>
              ) : (
                enquiry.activities.map((act) => {
                  const Icon = activityIcons[act.type] || MdNote;
                  const colorClass = activityColors[act.type] || 'bg-gray-100 text-gray-600';
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 h-fit ${colorClass}`}>
                        <Icon className="text-base" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{act.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {act.createdBy?.name} · {formatDateTime(act.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column — status & actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status card */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Status & Actions</h2>
            <div className="flex items-center gap-2 mb-5">
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusColors[enquiry.status]}`}>
                {enquiry.status}
              </span>
            </div>

            {/* Campaign PDF Download */}
            {enquiry.enquiryAssets?.length > 0 && (
              <button
                onClick={handleDownloadCampaignPdf}
                disabled={generatingPdf}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 transition-colors mb-3"
              >
                <MdPictureAsPdf className="text-lg" />
                {generatingPdf ? 'Generating PDF...' : 'Download Campaign PDF'}
              </button>
            )}

            {isManager && enquiry.status === 'NEW' && (
              <div className="space-y-2">
                <button
                  onClick={handleMarkWon}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <MdCheckCircle className="text-lg" />
                  Mark as Won
                </button>
                <button
                  onClick={() => setLostModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <MdCancel className="text-lg" />
                  Mark as Lost
                </button>
              </div>
            )}

            {enquiry.status === 'WON' && (
              <div className="space-y-3">
                {enquiry.booking ? (
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-semibold mb-1">Converted to Booking</p>
                    <Link
                      to="/bookings"
                      className="flex items-center gap-1.5 text-sm font-semibold text-green-700 hover:underline"
                    >
                      <MdBookmarkAdded />
                      {enquiry.booking.bookingCode}
                      <MdOpenInNew className="text-xs" />
                    </Link>
                  </div>
                ) : isManager ? (
                  <button
                    onClick={openConvertModal}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <MdBookmarkAdded className="text-lg" />
                    Convert to Booking
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">Awaiting booking conversion.</p>
                )}
              </div>
            )}

            {enquiry.status === 'LOST' && (
              <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">
                This enquiry was lost. No further actions available.
              </div>
            )}
          </div>

          {/* Enquiry meta */}
          <div className="card text-sm space-y-2">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Information</h2>
            <div className="flex justify-between">
              <span className="text-gray-400">Enquiry No</span>
              <span className="font-mono font-semibold text-primary-600">{enquiry.enquiryNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created by</span>
              <span className="text-gray-700">{enquiry.createdBy?.name}</span>
            </div>
            {enquiry.assignedTo && (
              <div className="flex justify-between">
                <span className="text-gray-400">Assigned to</span>
                <span className="text-gray-700">{enquiry.assignedTo.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Activities</span>
              <span className="text-gray-700">{enquiry.activities.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-700">{formatDate(enquiry.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mark Lost Modal */}
      <Modal isOpen={lostModal} onClose={() => setLostModal(false)} title="Mark as Lost" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Please provide a reason for losing this enquiry.</p>
          <div>
            <label className="label-field">Lost Reason *</label>
            <textarea
              rows={3}
              className="input-field"
              placeholder="e.g. Budget constraints, competitor offer, location not suitable..."
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setLostModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleMarkLost}
              disabled={markingLost}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {markingLost ? 'Saving...' : 'Confirm Lost'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Convert to Booking Modal */}
      <Modal isOpen={convertModal} onClose={() => setConvertModal(false)} title="Convert to Booking" size="xl">
        <form onSubmit={handleConvert} className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a client and assets to create a booking from this enquiry.
          </p>

          <div>
            <label className="label-field">Client *</label>
            <select
              className="input-field"
              value={convertForm.clientId}
              onChange={(e) => setConvertForm({ ...convertForm, clientId: e.target.value })}
              required
            >
              <option value="">— Select client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName} — {c.contactPerson}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={convertForm.startDate}
                onChange={(e) => setConvertForm({ ...convertForm, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label-field">End Date *</label>
              <input
                type="date"
                className="input-field"
                value={convertForm.endDate}
                onChange={(e) => setConvertForm({ ...convertForm, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Asset rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-field mb-0">Assets *</label>
              <button type="button" onClick={addAssetRow} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                <MdAdd /> Add asset
              </button>
            </div>
            <div className="space-y-2">
              {convertForm.assets.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <select
                      className="input-field"
                      value={row.assetId}
                      onChange={(e) => handleAssetChange(idx, e.target.value)}
                      required
                    >
                      <option value="">— Select asset —</option>
                      {assets.map((a) => (
                        <option
                          key={a.id}
                          value={a.id}
                          disabled={getSelectedAssetIds().includes(a.id) && String(a.id) !== row.assetId}
                        >
                          {a.code} — {a.name} ({a.locationCity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-36">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-field"
                      placeholder="Monthly rate"
                      value={row.monthlyRate}
                      onChange={(e) => handleRateChange(idx, e.target.value)}
                      required
                    />
                  </div>
                  {convertForm.assets.length > 1 && (
                    <button type="button" onClick={() => removeAssetRow(idx)} className="p-2 text-red-400 hover:text-red-600 mt-0.5">
                      <MdClose />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total preview */}
          {convertForm.startDate && convertForm.endDate && (
            <div className="p-3 bg-primary-50 rounded-xl">
              <p className="text-xs text-primary-600">Estimated Total</p>
              <p className="text-xl font-bold text-primary-700">
                ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
            </div>
          )}

          <div>
            <label className="label-field">Notes</label>
            <textarea
              rows={2}
              className="input-field"
              value={convertForm.notes}
              onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setConvertModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={converting} className="btn-primary disabled:opacity-50">
              {converting ? 'Creating Booking...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EnquiryDetail;
