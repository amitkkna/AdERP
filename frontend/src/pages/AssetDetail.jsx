import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  MdArrowBack, MdEdit, MdLocationOn, MdAspectRatio,
  MdLightbulb, MdBuild, MdAttachMoney, MdSecurity,
  MdUpload, MdDelete, MdImage, MdTrendingUp, MdAccountBalance,
  MdArrowForward, MdStar, MdStarBorder, MdClose, MdCameraAlt, MdAdd,
} from 'react-icons/md';

const statusColors = {
  AVAILABLE: 'bg-green-100 text-green-800',
  BOOKED: 'bg-purple-100 text-purple-800',
  UNDER_MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  UNDER_MAINTENANCE: 'Under Maintenance',
  BLOCKED: 'Blocked',
};

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, post, put, del, loading } = useApi();
  const { user } = useAuth();
  const fileInput = useRef(null);
  const [asset, setAsset] = useState(null);
  const [profitability, setProfitability] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Upload modal state
  const [uploadModal, setUploadModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]); // [{file, caption, preview}]
  // Lightbox
  const [lightboxImg, setLightboxImg] = useState(null);

  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role);

  useEffect(() => {
    fetchAsset();
    fetchProfitability();
    fetchRecentExpenses();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const res = await get(`/assets/${id}`);
      setAsset(res.data);
    } catch (error) {
      navigate('/assets');
    } finally {
      setFetching(false);
    }
  };

  const fetchProfitability = async () => {
    try {
      const res = await get(`/expenses/asset/${id}/profitability`);
      setProfitability(res.data);
    } catch (error) { /* handled */ }
  };

  const fetchRecentExpenses = async () => {
    try {
      const res = await get('/expenses', { assetId: id, limit: 5 });
      setRecentExpenses(res.data || []);
    } catch (error) { /* handled */ }
  };

  const ANGLE_OPTIONS = [
    'Front View', 'Left Side', 'Right Side', 'Top View',
    'Night View', 'Street Perspective', 'Close-up', 'Aerial View',
  ];

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPending = files.map((file) => ({
      file,
      caption: '',
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    setUploadModal(true);
    if (fileInput.current) fileInput.current.value = '';
  };

  const removePendingFile = (idx) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUploadSubmit = async () => {
    if (!pendingFiles.length) return;
    const formData = new FormData();
    pendingFiles.forEach((pf, i) => {
      formData.append('images', pf.file);
      formData.append('captions', pf.caption === '__custom' ? '' : (pf.caption || ''));
    });
    setUploading(true);
    try {
      await post(`/assets/${id}/images`, formData);
      toast.success(`${pendingFiles.length} photo(s) uploaded!`);
      pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
      setPendingFiles([]);
      setUploadModal(false);
      fetchAsset();
    } catch (_) {}
    finally { setUploading(false); }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await put(`/assets/${id}/images/${imageId}`, { isPrimary: true });
      toast.success('Primary photo updated.');
      fetchAsset();
    } catch (_) {}
  };

  const handleUpdateCaption = async (imageId, caption) => {
    try {
      await put(`/assets/${id}/images/${imageId}`, { caption });
      fetchAsset();
    } catch (_) {}
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await del(`/assets/${id}/images/${imageId}`);
      toast.success('Image deleted.');
      fetchAsset();
    } catch (error) {
      // handled
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!asset) return null;

  const formatCurrency = (val) =>
    val ? Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) : '-';

  const formatDate = (val) =>
    val ? new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/assets')} className="p-2 rounded-lg hover:bg-gray-100">
            <MdArrowBack className="text-xl text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[asset.status]}`}>
                {statusLabels[asset.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono">{asset.code}</p>
          </div>
        </div>
        {isManager && (
          <Link to={`/assets/${id}/edit`} className="btn-primary flex items-center gap-2">
            <MdEdit /> Edit
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location & Basic Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdLocationOn className="text-primary-500" /> Location & Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase">Address</p>
                <p className="text-sm text-gray-900">{asset.locationAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">City / District</p>
                <p className="text-sm text-gray-900">{asset.locationCity}, {asset.locationDistrict}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Zone</p>
                <p className="text-sm text-gray-900">{asset.zone?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">GPS</p>
                <p className="text-sm text-gray-900">
                  {asset.latitude && asset.longitude ? `${asset.latitude}, ${asset.longitude}` : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Type</p>
                <p className="text-sm text-gray-900">{asset.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Size</p>
                <p className="text-sm text-gray-900">{asset.sizeWidth} x {asset.sizeHeight} ft</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Facing Direction</p>
                <p className="text-sm text-gray-900">{asset.facingDirection || '-'}</p>
              </div>
            </div>
          </div>

          {/* Technical */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdLightbulb className="text-yellow-500" /> Technical Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase">Illumination</p>
                <p className="text-sm text-gray-900">{asset.illumination}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Material</p>
                <p className="text-sm text-gray-900">{asset.material || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Condition</p>
                <p className="text-sm text-gray-900">{asset.condition}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Ownership</p>
                <p className="text-sm text-gray-900">{asset.ownership.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Installation Date</p>
                <p className="text-sm text-gray-900">{formatDate(asset.installationDate)}</p>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdImage className="text-green-500" /> Photos
                {asset.images?.length > 0 && (
                  <span className="text-xs font-normal text-gray-400">({asset.images.length})</span>
                )}
              </h2>
              {isManager && (
                <div>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <MdAdd /> Add Photos
                  </button>
                </div>
              )}
            </div>
            {asset.images?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {asset.images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-100">
                    <img
                      src={img.url}
                      alt={img.caption || 'Asset'}
                      className="w-full h-40 object-cover cursor-pointer"
                      onClick={() => setLightboxImg(img)}
                    />
                    {/* Primary badge */}
                    {img.isPrimary && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <MdStar className="text-[10px]" /> Primary
                      </span>
                    )}
                    {/* Caption bar */}
                    <div className="px-2 py-1.5 bg-white">
                      {img.caption ? (
                        <p className="text-xs text-gray-600 font-medium truncate flex items-center gap-1">
                          <MdCameraAlt className="text-gray-400 flex-shrink-0" /> {img.caption}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 italic">No caption</p>
                      )}
                    </div>
                    {/* Hover actions */}
                    {isManager && (
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!img.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(img.id)}
                            className="bg-white/90 text-amber-600 p-1 rounded shadow-sm hover:bg-amber-50"
                            title="Set as primary"
                          >
                            <MdStarBorder className="text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="bg-white/90 text-red-600 p-1 rounded shadow-sm hover:bg-red-50"
                          title="Delete"
                        >
                          <MdDelete className="text-sm" />
                        </button>
                      </div>
                    )}
                    {/* Editable caption on hover (manager only) */}
                    {isManager && (
                      <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          className="w-full text-[11px] bg-white/95 border-0 border-t border-gray-100 py-1 px-2 text-gray-600 focus:outline-none focus:ring-0"
                          value={img.caption || ''}
                          onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                        >
                          <option value="">— Set angle/caption —</option>
                          {ANGLE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MdCameraAlt className="text-4xl text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No photos uploaded yet.</p>
                {isManager && (
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Upload your first photo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Upload Modal */}
          {uploadModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Photos</h3>
                  <button onClick={() => { pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview)); setPendingFiles([]); setUploadModal(false); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                    <MdClose className="text-xl" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <p className="text-sm text-gray-500 mb-3">
                    Select an angle/view for each photo to help identify them in the campaign PDF.
                  </p>
                  {pendingFiles.map((pf, idx) => {
                    const isCustom = pf.caption && !ANGLE_OPTIONS.includes(pf.caption);
                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <img src={pf.preview} alt="" className="w-24 h-20 object-cover rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 truncate mb-2">{pf.file.name}</p>
                          <select
                            className="input-field text-sm py-1.5"
                            value={isCustom ? '__custom' : pf.caption}
                            onChange={(e) => setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, caption: e.target.value === '__custom' ? '' : e.target.value } : p))}
                          >
                            <option value="">— Select angle/view —</option>
                            {ANGLE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                            <option value="__custom">Custom caption...</option>
                          </select>
                          {isCustom && (
                            <input
                              type="text"
                              className="input-field text-sm py-1.5 mt-2"
                              placeholder="Enter custom caption"
                              value={pf.caption}
                              autoFocus
                              onChange={(e) => setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, caption: e.target.value } : p))}
                            />
                          )}
                        </div>
                        <button onClick={() => removePendingFile(idx)} className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                          <MdClose />
                        </button>
                      </div>
                    );
                  })}
                  {pendingFiles.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No files selected.</p>
                  )}
                </div>
                <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add more files
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview)); setPendingFiles([]); setUploadModal(false); }} className="btn-secondary text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadSubmit}
                      disabled={uploading || pendingFiles.length === 0}
                      className="btn-primary text-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <MdUpload /> {uploading ? 'Uploading...' : `Upload ${pendingFiles.length} Photo${pendingFiles.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Lightbox */}
          {lightboxImg && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
              <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img src={lightboxImg.url} alt={lightboxImg.caption || 'Asset'} className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                {lightboxImg.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm px-4 py-2 rounded-b-lg">
                    {lightboxImg.caption}
                    {lightboxImg.isPrimary && <span className="ml-2 text-amber-400 text-xs">★ Primary</span>}
                  </div>
                )}
                <button onClick={() => setLightboxImg(null)} className="absolute -top-3 -right-3 bg-white text-gray-600 p-1.5 rounded-full shadow-lg hover:bg-gray-100">
                  <MdClose className="text-lg" />
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {asset.notes && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-sm text-gray-600">{asset.notes}</p>
            </div>
          )}

          {/* Recent Expenses */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdAccountBalance className="text-indigo-500" /> Recent Expenses
              </h2>
              <Link
                to={`/expenses?assetId=${id}`}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View all <MdArrowForward className="text-sm" />
              </Link>
            </div>
            {recentExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Vendor</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2.5 text-sm text-gray-600">{formatDate(exp.date)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700">{exp.category.replace('_', ' ')}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-500">{exp.vendor || '-'}</td>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(exp.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No expenses recorded for this asset.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rates */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdAttachMoney className="text-green-500" /> Rates
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Monthly</span>
                <span className="font-semibold text-gray-900">{formatCurrency(asset.monthlyRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Quarterly</span>
                <span className="font-semibold text-gray-900">{formatCurrency(asset.quarterlyRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Yearly</span>
                <span className="font-semibold text-gray-900">{formatCurrency(asset.yearlyRate)}</span>
              </div>
            </div>
          </div>

          {/* Permission */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MdSecurity className="text-blue-500" /> Permission
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 uppercase">Permit Number</p>
                <p className="text-sm text-gray-900">{asset.permissionNumber || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase">Expiry Date</p>
                <p className={`text-sm font-medium ${
                  asset.permissionExpiry && new Date(asset.permissionExpiry) < new Date()
                    ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {formatDate(asset.permissionExpiry)}
                </p>
              </div>
            </div>
          </div>

          {/* Profitability */}
          {profitability && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MdTrendingUp className="text-emerald-500" /> Profitability
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Revenue</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(profitability.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Expenses</span>
                  <span className="font-semibold text-red-600">{formatCurrency(profitability.totalExpenses)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Net Profit</span>
                  <span className={`font-bold ${profitability.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(profitability.netProfit)}
                  </span>
                </div>
                {profitability.totalExpenses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">ROI</span>
                    <span className={`font-semibold ${profitability.roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {profitability.roi}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase">Info</h2>
            <div className="space-y-2 text-xs text-gray-400">
              <p>Created: {formatDate(asset.createdAt)}</p>
              <p>Updated: {formatDate(asset.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
