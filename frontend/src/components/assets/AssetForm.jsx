import { useState, useEffect, useRef } from 'react';
import useApi from '../../hooks/useApi';
import toast from 'react-hot-toast';
import {
  MdAdd, MdClose, MdCameraAlt, MdStar, MdStarBorder, MdDelete,
} from 'react-icons/md';

const ANGLE_OPTIONS = [
  'Front View', 'Left Side', 'Right Side', 'Top View',
  'Night View', 'Street Perspective', 'Close-up', 'Aerial View',
];

const AssetForm = ({ initialData, onSubmit, loading, assetId }) => {
  const { get, put, del } = useApi();
  const fileInput = useRef(null);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    name: '', type: 'BILLBOARD', sizeWidth: '', sizeHeight: '',
    locationAddress: '', locationCity: '', locationDistrict: '',
    latitude: '', longitude: '', facingDirection: '',
    illumination: 'NONLIT', material: '', installationDate: '',
    condition: 'GOOD', ownership: 'OWNED', status: 'AVAILABLE',
    monthlyRate: '', quarterlyRate: '', yearlyRate: '',
    permissionNumber: '', permissionExpiry: '', zoneId: '', notes: '',
    ...initialData,
  });

  // Photos
  const [pendingFiles, setPendingFiles] = useState([]); // [{file, caption, preview}]
  const [existingImages, setExistingImages] = useState([]); // from server (edit mode)

  useEffect(() => {
    fetchZones();
    if (assetId) fetchExistingImages();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
        installationDate: initialData.installationDate
          ? new Date(initialData.installationDate).toISOString().split('T')[0] : '',
        permissionExpiry: initialData.permissionExpiry
          ? new Date(initialData.permissionExpiry).toISOString().split('T')[0] : '',
        zoneId: initialData.zoneId?.toString() || '',
      }));
    }
  }, [initialData]);

  const fetchZones = async () => {
    try {
      const res = await get('/zones', { all: 'true' });
      setZones(res.data || []);
    } catch (error) { /* handled */ }
  };

  const fetchExistingImages = async () => {
    try {
      const res = await get(`/assets/${assetId}`);
      setExistingImages(res.data?.images || []);
    } catch (_) {}
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, pendingFiles);
  };

  // ── Pending files (new uploads) ─────────────────────────────────
  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPending = files.map((file) => ({
      file,
      caption: '',
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInput.current) fileInput.current.value = '';
  };

  const removePendingFile = (idx) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const setPendingCaption = (idx, caption) => {
    setPendingFiles((prev) => prev.map((p, i) => i === idx ? { ...p, caption } : p));
  };

  // ── Existing images (edit mode) ─────────────────────────────────
  const handleSetPrimary = async (imageId) => {
    try {
      await put(`/assets/${assetId}/images/${imageId}`, { isPrimary: true });
      toast.success('Primary photo updated.');
      fetchExistingImages();
    } catch (_) {}
  };

  const handleUpdateCaption = async (imageId, caption) => {
    try {
      await put(`/assets/${assetId}/images/${imageId}`, { caption });
      fetchExistingImages();
    } catch (_) {}
  };

  const handleDeleteExisting = async (imageId) => {
    try {
      await del(`/assets/${assetId}/images/${imageId}`);
      toast.success('Photo deleted.');
      fetchExistingImages();
    } catch (_) {}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Asset Name *</label>
            <input name="name" className="input-field" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">Type *</label>
            <select name="type" className="input-field" value={form.type} onChange={handleChange} required>
              <option value="BILLBOARD">Billboard</option>
              <option value="UNIPOLE">Unipole</option>
              <option value="HOARDING">Hoarding</option>
              <option value="GANTRY">Gantry</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label-field">Status</label>
            <select name="status" className="input-field" value={form.status} onChange={handleChange}>
              <option value="AVAILABLE">Available</option>
              <option value="BOOKED">Booked</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
          <div>
            <label className="label-field">Width (ft) *</label>
            <input name="sizeWidth" type="number" step="0.1" className="input-field" value={form.sizeWidth} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">Height (ft) *</label>
            <input name="sizeHeight" type="number" step="0.1" className="input-field" value={form.sizeHeight} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">Facing Direction</label>
            <input name="facingDirection" className="input-field" placeholder="e.g. North, South" value={form.facingDirection || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className="label-field">Address *</label>
            <input name="locationAddress" className="input-field" value={form.locationAddress} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">Zone *</label>
            <select name="zoneId" className="input-field" value={form.zoneId} onChange={handleChange} required>
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name} ({zone.city})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">City *</label>
            <input name="locationCity" className="input-field" value={form.locationCity} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">District *</label>
            <input name="locationDistrict" className="input-field" value={form.locationDistrict} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">Latitude</label>
            <input name="latitude" type="number" step="0.0001" className="input-field" value={form.latitude || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Longitude</label>
            <input name="longitude" type="number" step="0.0001" className="input-field" value={form.longitude || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Details */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Illumination</label>
            <select name="illumination" className="input-field" value={form.illumination} onChange={handleChange}>
              <option value="NONLIT">Non-Lit</option>
              <option value="FRONTLIT">Frontlit</option>
              <option value="BACKLIT">Backlit</option>
              <option value="LED">LED</option>
            </select>
          </div>
          <div>
            <label className="label-field">Material</label>
            <input name="material" className="input-field" placeholder="e.g. Steel + Flex" value={form.material || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Condition</label>
            <select name="condition" className="input-field" value={form.condition} onChange={handleChange}>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
          <div>
            <label className="label-field">Ownership</label>
            <select name="ownership" className="input-field" value={form.ownership} onChange={handleChange}>
              <option value="OWNED">Owned</option>
              <option value="LEASED">Leased</option>
              <option value="THIRD_PARTY">Third Party</option>
            </select>
          </div>
          <div>
            <label className="label-field">Installation Date</label>
            <input name="installationDate" type="date" className="input-field" value={form.installationDate || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Rates */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Rates (INR)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Monthly Rate *</label>
            <input name="monthlyRate" type="number" step="0.01" className="input-field" value={form.monthlyRate} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-field">Quarterly Rate</label>
            <input name="quarterlyRate" type="number" step="0.01" className="input-field" value={form.quarterlyRate || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Yearly Rate</label>
            <input name="yearlyRate" type="number" step="0.01" className="input-field" value={form.yearlyRate || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Permission Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Permission Number</label>
            <input name="permissionNumber" className="input-field" value={form.permissionNumber || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="label-field">Permission Expiry</label>
            <input name="permissionExpiry" type="date" className="input-field" value={form.permissionExpiry || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <MdCameraAlt className="text-green-500" /> Photos
          </h3>
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
              type="button"
              onClick={() => fileInput.current?.click()}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <MdAdd /> Add Photos
            </button>
          </div>
        </div>

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Current Photos ({existingImages.length})</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-100">
                  <img src={img.url} alt={img.caption || 'Asset'} className="w-full h-24 object-cover" />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5">
                      <MdStar className="text-[9px]" /> Primary
                    </span>
                  )}
                  <div className="px-1.5 py-1 bg-white">
                    <select
                      className="w-full text-[11px] bg-transparent border-0 p-0 text-gray-600 focus:outline-none focus:ring-0"
                      value={img.caption || ''}
                      onChange={(e) => handleUpdateCaption(img.id, e.target.value)}
                    >
                      <option value="">— Angle —</option>
                      {ANGLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        className="bg-white/90 text-amber-600 p-0.5 rounded shadow-sm"
                        title="Set as primary"
                      >
                        <MdStarBorder className="text-xs" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteExisting(img.id)}
                      className="bg-white/90 text-red-600 p-0.5 rounded shadow-sm"
                      title="Delete"
                    >
                      <MdDelete className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New files to upload */}
        {pendingFiles.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2">New Photos ({pendingFiles.length})</p>
            <div className="space-y-2">
              {pendingFiles.map((pf, idx) => {
                const isCustom = pf.caption && !ANGLE_OPTIONS.includes(pf.caption);
                return (
                  <div key={idx} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <img src={pf.preview} alt="" className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate mb-1.5">{pf.file.name}</p>
                      <select
                        className="input-field text-sm py-1"
                        value={isCustom ? '__custom' : pf.caption}
                        onChange={(e) => setPendingCaption(idx, e.target.value === '__custom' ? '' : e.target.value)}
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
                          className="input-field text-sm py-1 mt-1.5"
                          placeholder="Enter custom caption"
                          value={pf.caption}
                          onChange={(e) => setPendingCaption(idx, e.target.value)}
                        />
                      )}
                    </div>
                    <button type="button" onClick={() => removePendingFile(idx)} className="p-1 text-red-400 hover:text-red-600 flex-shrink-0">
                      <MdClose />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {existingImages.length === 0 && pendingFiles.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            <MdCameraAlt className="text-3xl text-gray-200 mx-auto mb-1" />
            <p className="text-sm text-gray-400">No photos yet</p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Upload photos from different angles
            </button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="label-field">Notes</label>
        <textarea name="notes" rows={3} className="input-field" value={form.notes || ''} onChange={handleChange} placeholder="Additional notes..." />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Saving...' : (initialData ? 'Update Asset' : 'Create Asset')}
        </button>
      </div>
    </form>
  );
};

export default AssetForm;
