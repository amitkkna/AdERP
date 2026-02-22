import { useState, useEffect } from 'react';
import useApi from '../hooks/useApi';
import {
  MdChevronLeft, MdChevronRight, MdSearch, MdCalendarMonth,
  MdCheckCircle, MdCancel, MdGridView, MdDownload,
} from 'react-icons/md';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const occupancyBadge = (pct) => {
  if (pct >= 80) return 'bg-red-100 text-red-700';
  if (pct >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
};

const Availability = () => {
  const { get, loading } = useApi();
  const today = new Date();

  const [tab, setTab] = useState('matrix');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // Shared filters
  const [zones, setZones] = useState([]);
  const [zoneFilter, setZoneFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  // Matrix state
  const [matrixData, setMatrixData] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { clientName, bookingCode, day, x, y }

  // Calendar state
  const [assets, setAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [calData, setCalData] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchZones();
    fetchAssets();
  }, []);

  useEffect(() => {
    if (tab === 'matrix') fetchMatrix();
  }, [tab, year, month, zoneFilter]);

  useEffect(() => {
    if (tab === 'calendar' && selectedAsset) fetchCalendar();
  }, [tab, selectedAsset, year, month]);

  // ── Data fetchers ─────────────────────────────────────────────────────────
  const fetchZones = async () => {
    try {
      const res = await get('/zones', { limit: 100 });
      setZones(res.data || []);
    } catch (_) {}
  };

  const fetchAssets = async () => {
    try {
      const res = await get('/assets', { limit: 200 });
      setAssets(res.data || []);
    } catch (_) {}
  };

  const fetchMatrix = async () => {
    setMatrixLoading(true);
    try {
      const params = { year, month };
      if (zoneFilter) params.zoneId = zoneFilter;
      const res = await get('/assets/availability/matrix', params);
      setMatrixData(res.data);
    } catch (_) {}
    setMatrixLoading(false);
  };

  const fetchCalendar = async () => {
    try {
      const res = await get(`/assets/${selectedAsset.id}/availability`, { year, month });
      setCalData(res.data);
    } catch (_) {}
  };

  // ── Month navigation ──────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ── Excel Export (dynamic import avoids Vite CJS/ESM conflict) ───────────
  const exportExcel = async () => {
    if (!matrixData) return;
    const XLSX = await import('xlsx');
    const { assets: allAssets, daysInMonth } = matrixData;
    const monthName = MONTH_NAMES[month - 1];

    const filtered = allAssets.filter(a =>
      !searchText ||
      a.code.toLowerCase().includes(searchText.toLowerCase()) ||
      a.name.toLowerCase().includes(searchText.toLowerCase()) ||
      a.locationCity.toLowerCase().includes(searchText.toLowerCase())
    );

    // Build day headers
    const dayHeaders = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dn = new Date(year, month - 1, d).getDay();
      dayHeaders.push(`${d} (${DAY_SHORT[dn]})`);
    }

    const titleRow = [`Asset Availability Report - ${monthName} ${year}`];
    const metaRow = [`Generated: ${new Date().toLocaleDateString('en-IN')}    |    Total Assets: ${filtered.length}    |    Avg Occupancy: ${matrixData.summary.avgOccupancy}%`];
    const header = ['Code', 'Asset Name', 'Zone', 'City', 'Size (ft)', 'Type', ...dayHeaders, 'Booked Days', 'Free Days', 'Occupancy %'];

    const dataRows = filtered.map(a => {
      const size = a.sizeWidth && a.sizeHeight ? `${a.sizeWidth}x${a.sizeHeight}` : '';
      const dayCells = a.days.map(d =>
        d.status === 'BOOKED'
          ? `BOOKED - ${d.clientName || ''}`
          : d.status === 'MAINTENANCE'
          ? 'MAINTENANCE'
          : 'FREE'
      );
      return [a.code, a.name, a.zone?.name || '', a.locationCity, size, a.type, ...dayCells, a.bookedDays, a.availableDays, `${a.occupancy}%`];
    });

    const ws = XLSX.utils.aoa_to_sheet([titleRow, metaRow, [], header, ...dataRows]);

    ws['!cols'] = [
      { wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
      ...Array(daysInMonth).fill({ wch: 22 }),
      { wch: 13 }, { wch: 11 }, { wch: 13 },
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${year}`);
    XLSX.writeFile(wb, `Availability_${monthName}_${year}.xlsx`);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredMatrix = (matrixData?.assets || []).filter(a =>
    !searchText ||
    a.code.toLowerCase().includes(searchText.toLowerCase()) ||
    a.name.toLowerCase().includes(searchText.toLowerCase()) ||
    a.locationCity.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredCalAssets = assets.filter(a =>
    !assetSearch ||
    a.code.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.locationCity.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const calGrid = () => {
    if (!calData) return [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (const day of calData.days) grid.push(day);
    return grid;
  };

  const bookedCount = calData?.days.filter(d => d.status === 'BOOKED').length || 0;
  const availCount  = calData?.days.filter(d => d.status === 'AVAILABLE').length || 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="text-gray-500 text-sm">Track occupancy across all assets and plan campaigns</p>
        </div>
        {tab === 'matrix' && (
          <button
            onClick={exportExcel}
            disabled={!matrixData}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <MdDownload className="text-lg" /> Download Excel
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'matrix',   icon: <MdGridView />,      label: 'Matrix Report' },
          { key: 'calendar', icon: <MdCalendarMonth />, label: 'Single Asset' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
              tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Month navigator — shared */}
      <div className="card flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <MdChevronLeft className="text-xl" />
        </button>
        <p className="text-lg font-bold text-gray-900">{MONTH_NAMES[month - 1]} {year}</p>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <MdChevronRight className="text-xl" />
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MATRIX TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'matrix' && (
        <>
          {/* Filters row */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9 text-sm"
                placeholder="Search assets…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
            <select
              className="input-field text-sm w-48"
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>

          {/* Summary stat cards */}
          {matrixData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Assets',      value: filteredMatrix.length,                                         color: 'text-gray-800' },
                { label: 'Fully Available',   value: filteredMatrix.filter(a => a.bookedDays === 0).length,        color: 'text-green-600' },
                { label: 'Partially Booked',  value: filteredMatrix.filter(a => a.bookedDays > 0 && a.bookedDays < matrixData.daysInMonth).length, color: 'text-amber-600' },
                { label: 'Fully Booked',      value: filteredMatrix.filter(a => a.bookedDays === matrixData.daysInMonth).length, color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="card text-center py-3">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Matrix table */}
          {matrixLoading ? (
            <div className="card flex items-center justify-center py-20">
              <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : matrixData ? (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse min-w-full">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      {/* Sticky label columns */}
                      <th className="sticky left-0 z-20 bg-slate-800 px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ minWidth: 82 }}>
                        Code
                      </th>
                      <th className="sticky z-20 bg-slate-800 px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ left: 82, minWidth: 180 }}>
                        Asset Name
                      </th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ minWidth: 120 }}>
                        Zone / City
                      </th>
                      <th className="px-3 py-3 text-center font-semibold whitespace-nowrap" style={{ minWidth: 70 }}>
                        Size (ft)
                      </th>
                      {/* Day columns */}
                      {Array.from({ length: matrixData.daysInMonth }, (_, i) => i + 1).map(d => {
                        const dn = new Date(year, month - 1, d).getDay();
                        const isToday =
                          today.getFullYear() === year &&
                          today.getMonth() + 1 === month &&
                          today.getDate() === d;
                        return (
                          <th
                            key={d}
                            className={`px-0 py-2 text-center font-semibold w-7 ${
                              isToday ? 'bg-primary-600' : (dn === 0 || dn === 6) ? 'bg-slate-700' : ''
                            }`}
                          >
                            <div className="text-[11px]">{d}</div>
                            <div className="text-[9px] opacity-60">{DAY_SHORT[dn]}</div>
                          </th>
                        );
                      })}
                      {/* Summary columns */}
                      <th className="px-2 py-3 text-center font-semibold whitespace-nowrap border-l border-slate-600" style={{ minWidth: 64 }}>
                        Bkd/Tot
                      </th>
                      <th className="px-2 py-3 text-center font-semibold whitespace-nowrap" style={{ minWidth: 60 }}>
                        Occ %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatrix.length === 0 && (
                      <tr>
                        <td colSpan={4 + matrixData.daysInMonth + 2} className="text-center py-12 text-gray-400">
                          No assets found.
                        </td>
                      </tr>
                    )}
                    {filteredMatrix.map((asset, rowIdx) => (
                      <tr key={asset.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {/* Sticky code column */}
                        <td
                          className="sticky left-0 z-10 bg-inherit px-3 py-2 font-mono font-semibold text-primary-700 whitespace-nowrap border-r border-gray-200"
                          style={{ minWidth: 82 }}
                        >
                          {asset.code}
                        </td>
                        {/* Sticky name column */}
                        <td
                          className="sticky z-10 bg-inherit px-3 py-2 font-medium text-gray-800 whitespace-nowrap border-r border-gray-200"
                          style={{ left: 82, minWidth: 180, maxWidth: 200 }}
                        >
                          <span className="block truncate">{asset.name}</span>
                        </td>
                        {/* Zone/City */}
                        <td className="px-3 py-2 whitespace-nowrap border-r border-gray-100">
                          <p className="font-medium text-gray-700 text-[11px]">{asset.zone?.name || '—'}</p>
                          <p className="text-gray-400 text-[10px]">{asset.locationCity}</p>
                        </td>
                        {/* Size */}
                        <td className="px-3 py-2 text-center whitespace-nowrap border-r border-gray-100 text-[11px] font-medium text-gray-600">
                          {asset.sizeWidth && asset.sizeHeight ? `${asset.sizeWidth}×${asset.sizeHeight}` : '—'}
                        </td>
                        {/* Day cells */}
                        {asset.days.map((day) => {
                          const isBooked = day.status === 'BOOKED';
                          const isMaint  = day.status === 'MAINTENANCE' || day.status === 'BLOCKED';
                          const isToday  =
                            today.getFullYear() === year &&
                            today.getMonth() + 1 === month &&
                            today.getDate() === day.day;
                          return (
                            <td
                              key={day.day}
                              className={`relative w-7 p-0 text-center border border-gray-100 ${
                                isBooked ? 'bg-red-100' : isMaint ? 'bg-yellow-100' : 'bg-green-50'
                              } ${isToday ? 'ring-2 ring-inset ring-primary-400' : ''}`}
                              style={{ height: 32 }}
                              onMouseEnter={e => {
                                if (isBooked) {
                                  setTooltip({
                                    clientName: day.clientName,
                                    bookingCode: day.bookingCode,
                                    day: day.day,
                                    x: e.clientX,
                                    y: e.clientY,
                                  });
                                }
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <span
                                className={`inline-block w-2 h-2 rounded-full mt-2.5 ${
                                  isBooked ? 'bg-red-400' : isMaint ? 'bg-yellow-400' : 'bg-green-400'
                                }`}
                              />
                            </td>
                          );
                        })}
                        {/* Summary cells */}
                        <td className="px-2 py-2 text-center text-gray-700 font-semibold border-l border-gray-200 whitespace-nowrap">
                          {asset.bookedDays}/{matrixData.daysInMonth}
                        </td>
                        <td className="px-2 py-2 text-center border-l border-gray-100">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${occupancyBadge(asset.occupancy)}`}>
                            {asset.occupancy}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-200 inline-block" /> Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-200 inline-block" /> Maintenance / Blocked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm ring-2 ring-primary-400 inline-block" /> Today
                </span>
                <span className="ml-auto text-gray-400 italic">Hover red cells to see booking details</span>
              </div>
            </div>
          ) : null}

          {/* Floating tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl pointer-events-none"
              style={{ left: tooltip.x + 14, top: tooltip.y - 14 }}
            >
              <p className="font-semibold text-white">{tooltip.clientName || 'Booked'}</p>
              <p className="text-gray-400 font-mono text-[10px]">{tooltip.bookingCode}</p>
              <p className="text-gray-500 text-[10px]">Day {tooltip.day}</p>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SINGLE ASSET CALENDAR TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Asset selector */}
          <div className="lg:col-span-1">
            <div className="card h-full">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Asset</h2>
              <div className="relative mb-3">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-9 text-sm"
                  placeholder="Search assets…"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {filteredCalAssets.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAsset(a); setCalData(null); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm ${
                      selectedAsset?.id === a.id
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <p className={`font-mono text-xs font-semibold ${selectedAsset?.id === a.id ? 'text-white/80' : 'text-primary-600'}`}>
                      {a.code}
                    </p>
                    <p className="font-medium truncate">{a.name}</p>
                    <p className={`text-xs ${selectedAsset?.id === a.id ? 'text-white/70' : 'text-gray-400'}`}>
                      {a.locationCity}
                    </p>
                  </button>
                ))}
                {filteredCalAssets.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No assets found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3 space-y-4">
            {!selectedAsset ? (
              <div className="card flex flex-col items-center justify-center py-24 text-center">
                <MdCalendarMonth className="text-5xl text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">Select an asset from the left to view its availability calendar.</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                {calData && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="card text-center">
                      <p className="text-2xl font-bold text-green-600">{availCount}</p>
                      <p className="text-xs text-gray-500">Available Days</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-2xl font-bold text-red-500">{bookedCount}</p>
                      <p className="text-xs text-gray-500">Booked Days</p>
                    </div>
                    <div className="card text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {calData.days.length > 0 ? Math.round((bookedCount / calData.days.length) * 100) : 0}%
                      </p>
                      <p className="text-xs text-gray-500">Occupancy</p>
                    </div>
                  </div>
                )}

                {/* Calendar grid */}
                <div className="card">
                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    </div>
                  ) : calData ? (
                    <>
                      <div className="grid grid-cols-7 mb-2">
                        {DAY_NAMES.map((d) => (
                          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-2">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calGrid().map((day, idx) => {
                          if (!day) return <div key={`empty-${idx}`} />;
                          const isToday = day.date === today.toISOString().substring(0, 10);
                          const isBooked = day.status === 'BOOKED';
                          return (
                            <div
                              key={day.day}
                              className={`relative rounded-xl p-2 text-center cursor-default transition-all group
                                ${isBooked ? 'bg-red-100 text-red-800' : 'bg-green-50 text-green-800'}
                                ${isToday ? 'ring-2 ring-primary-500' : ''}
                              `}
                              onMouseEnter={() => setHoveredDay(day)}
                              onMouseLeave={() => setHoveredDay(null)}
                            >
                              <p className={`text-sm font-bold ${isToday ? 'text-primary-600' : ''}`}>{day.day}</p>
                              {isBooked
                                ? <MdCancel className="text-red-400 text-xs mx-auto" />
                                : <MdCheckCircle className="text-green-400 text-xs mx-auto" />
                              }
                              {hoveredDay?.day === day.day && day.clientName && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10 w-40 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-xl pointer-events-none">
                                  <p className="font-semibold">{day.clientName}</p>
                                  <p className="text-gray-300 font-mono text-[10px]">{day.bookingCode}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Available</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Booked</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-primary-500 inline-block" /> Today</span>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Active bookings this month */}
                {calData?.bookings?.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Bookings This Month</h3>
                    <div className="space-y-2">
                      {calData.bookings.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{b.clientName}</p>
                            <p className="text-xs text-gray-500 font-mono">{b.bookingCode}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(b.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              {' — '}
                              {new Date(b.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;
