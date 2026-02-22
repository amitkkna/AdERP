import { useState, useEffect } from 'react';
import { MdSearch, MdFilterList, MdClear } from 'react-icons/md';
import useApi from '../../hooks/useApi';

const AssetFilters = ({ filters, onFilterChange }) => {
  const { get } = useApi();
  const [zones, setZones] = useState([]);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await get('/zones', { all: 'true' });
      setZones(res.data || []);
    } catch (error) {
      // handled
    }
  };

  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ search: '', type: '', status: '', zoneId: '' });
  };

  const hasActiveFilters = filters.search || filters.type || filters.status || filters.zoneId;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <MdFilterList className="text-gray-500 text-sm" />
        </div>
        <span className="text-sm font-semibold text-gray-700">Filters</span>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 ml-auto">
            <MdClear className="text-sm" /> Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            className="input-field pl-10"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>
        <select
          className="input-field"
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="BILLBOARD">Billboard</option>
          <option value="UNIPOLE">Unipole</option>
          <option value="HOARDING">Hoarding</option>
          <option value="GANTRY">Gantry</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          className="input-field"
          value={filters.status}
          onChange={(e) => handleChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BOOKED">Booked</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="BLOCKED">Blocked</option>
        </select>
        <select
          className="input-field"
          value={filters.zoneId}
          onChange={(e) => handleChange('zoneId', e.target.value)}
        >
          <option value="">All Zones</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name} ({zone.city})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AssetFilters;
