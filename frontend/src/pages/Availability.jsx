import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import useApi from '../hooks/useApi';
import Modal from '../components/common/Modal';
import AssetCampaignPDF from '../components/pdf/AssetCampaignPDF';
import toast from 'react-hot-toast';
import {
  MdChevronLeft, MdChevronRight, MdSearch, MdCalendarMonth,
  MdCheckCircle, MdCancel, MdGridView, MdDownload,
  MdTableChart, MdRequestQuote, MdPictureAsPdf, MdSelectAll,
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

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtCurrency = (v) => v ? `₹${parseFloat(v).toLocaleString('en-IN')}` : '—';

const Availability = () => {
  const { get, post, loading } = useApi();
  const navigate = useNavigate();
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
  const [tooltip, setTooltip] = useState(null);

  // Calendar state
  const [assets, setAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [calData, setCalData] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Multiple Assets tab state
  const [occupancyData, setOccupancyData] = useState([]);
  const [occupancyLoading, setOccupancyLoading] = useState(false);
  const [multiSearch, setMultiSearch] = useState('');
  const [multiType, setMultiType] = useState('');
  const [multiZone, setMultiZone] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [quoteForm, setQuoteForm] = useState({ clientId: '', months: 1, validDays: 30 });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

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

  useEffect(() => {
    if (tab === 'multi') fetchOccupancy();
  }, [tab, multiType, multiZone]);

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

  const fetchOccupancy = async () => {
    setOccupancyLoading(true);
    try {
      const params = {};
      if (multiType) params.type = multiType;
      if (multiZone) params.zoneId = multiZone;
      const res = await get('/assets/occupancy', params);
      setOccupancyData(res.data || []);
    } catch (_) {}
    setOccupancyLoading(false);
  };

  const fetchClients = async () => {
    try {
      const res = await get('/clients', { limit: 200 });
      setClients(res.data || []);
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

  // ── Multiple Assets derived & handlers ──────────────────────────────────
  const filteredOccupancy = occupancyData.filter(a =>
    !multiSearch ||
    a.code.toLowerCase().includes(multiSearch.toLowerCase()) ||
    a.name.toLowerCase().includes(multiSearch.toLowerCase()) ||
    a.locationCity.toLowerCase().includes(multiSearch.toLowerCase()) ||
    a.locationAddress.toLowerCase().includes(multiSearch.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOccupancy.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOccupancy.map(a => a.id)));
    }
  };

  const selectedAssets = filteredOccupancy.filter(a => selectedIds.has(a.id));

  const handleOpenQuoteModal = () => {
    if (selectedIds.size === 0) return toast.error('Select at least one asset');
    fetchClients();
    setQuoteForm({ clientId: '', months: 1, validDays: 30 });
    setShowQuoteModal(true);
  };

  const handleCreateQuotation = async () => {
    if (!quoteForm.clientId) return toast.error('Select a client');
    setQuoteSubmitting(true);
    try {
      const items = selectedAssets.map(a => ({
        description: `${a.name} (${a.code})`,
        location: `${a.locationAddress}, ${a.locationCity}`,
        size: `${a.sizeWidth}×${a.sizeHeight} ft`,
        monthlyRate: parseFloat(a.monthlyRate),
        months: parseInt(quoteForm.months),
        amount: parseFloat(a.monthlyRate) * parseInt(quoteForm.months),
        assetId: a.id,
      }));
      const subtotal = items.reduce((s, i) => s + i.amount, 0);
      const taxRate = 18;
      const taxAmount = subtotal * taxRate / 100;
      const totalAmount = subtotal + taxAmount;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(quoteForm.validDays));

      const res = await post('/quotations', {
        clientId: parseInt(quoteForm.clientId),
        validUntil: validUntil.toISOString(),
        taxRate,
        items,
        subtotal,
        taxAmount,
        totalAmount,
      });
      toast.success('Quotation created!');
      setShowQuoteModal(false);
      setSelectedIds(new Set());
      navigate(`/quotations/${res.data.id}`);
    } catch (_) {}
    setQuoteSubmitting(false);
  };

  const handleDownloadPDF = async () => {
    if (selectedIds.size === 0) return toast.error('Select at least one asset');
    setPdfGenerating(true);
    try {
      const res = await post('/assets/campaign-data', { assetIds: [...selectedIds] });
      const blob = await pdf(<AssetCampaignPDF assets={res.data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Campaign_Proposal_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Campaign PDF downloaded!');
    } catch (_) { toast.error('Failed to generate PDF'); }
    setPdfGenerating(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="text-gray-500 text-sm">Track occupancy across all assets and plan campaigns</p>
        </div>
        <div className="flex gap-2">
          {tab === 'matrix' && (
            <button
              onClick={exportExcel}
              disabled={!matrixData}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <MdDownload className="text-lg" /> Download Excel
            </button>
          )}
          {tab === 'multi' && (
            <>
              <button
                onClick={handleOpenQuoteModal}
                disabled={selectedIds.size === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <MdRequestQuote className="text-lg" /> Create Quotation ({selectedIds.size})
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={selectedIds.size === 0 || pdfGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <MdPictureAsPdf className="text-lg" /> {pdfGenerating ? 'Generating...' : `Campaign PDF (${selectedIds.size})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'matrix',   icon: <MdGridView />,      label: 'Matrix Report' },
          { key: 'calendar', icon: <MdCalendarMonth />, label: 'Single Asset' },
          { key: 'multi',    icon: <MdTableChart />,    label: 'Multiple Assets' },
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

      {/* ════════════════════════════════════════════════════════════════════
          MULTIPLE ASSETS TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 'multi' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-9 text-sm"
                placeholder="Search assets…"
                value={multiSearch}
                onChange={e => setMultiSearch(e.target.value)}
              />
            </div>
            <select className="input-field text-sm w-44" value={multiType} onChange={e => setMultiType(e.target.value)}>
              <option value="">All Types</option>
              {['BILLBOARD','UNIPOLE','HOARDING','GANTRY','OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input-field text-sm w-44" value={multiZone} onChange={e => setMultiZone(e.target.value)}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            {selectedIds.size > 0 && (
              <span className="flex items-center text-sm font-medium text-primary-700 bg-primary-50 px-3 rounded-lg">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          {/* Table */}
          {occupancyLoading ? (
            <div className="card flex items-center justify-center py-20">
              <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse min-w-full">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="sticky left-0 z-20 bg-slate-800 px-2 py-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={filteredOccupancy.length > 0 && selectedIds.size === filteredOccupancy.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded"
                        />
                      </th>
                      <th className="px-2 py-3 text-center font-semibold w-10">#</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ minWidth: 90 }}>Code</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ minWidth: 160 }}>Name</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">District</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Town</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Medium</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ minWidth: 180 }}>Location</th>
                      <th className="px-2 py-3 text-center font-semibold">W</th>
                      <th className="px-2 py-3 text-center font-semibold">H</th>
                      <th className="px-2 py-3 text-center font-semibold">SqFt</th>
                      <th className="px-3 py-3 text-left font-semibold">Display</th>
                      <th className="px-3 py-3 text-left font-semibold">Facing</th>
                      <th className="px-2 py-3 text-center font-semibold">Lat</th>
                      <th className="px-2 py-3 text-center font-semibold">Lon</th>
                      <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Rate/Mo</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap bg-slate-700">Occ. From</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap bg-slate-700">Occ. To</th>
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap bg-slate-700">Client</th>
                      <th className="px-3 py-3 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOccupancy.length === 0 && (
                      <tr><td colSpan={20} className="text-center py-12 text-gray-400">No assets found.</td></tr>
                    )}
                    {filteredOccupancy.map((a, i) => {
                      const isSelected = selectedIds.has(a.id);
                      return (
                        <tr
                          key={a.id}
                          className={`${isSelected ? 'bg-primary-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary-50/50 cursor-pointer transition-colors`}
                          onClick={() => toggleSelect(a.id)}
                        >
                          <td className="sticky left-0 z-10 bg-inherit px-2 py-2 text-center border-r border-gray-200">
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(a.id)} className="w-4 h-4 rounded" onClick={e => e.stopPropagation()} />
                          </td>
                          <td className="px-2 py-2 text-center text-gray-400 font-mono">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-primary-700 whitespace-nowrap">{a.code}</td>
                          <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap" style={{ maxWidth: 200 }}>
                            <span className="block truncate">{a.name}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{a.locationDistrict || '—'}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{a.locationCity}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{a.type}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-[11px]" style={{ maxWidth: 200 }}>
                            <span className="block truncate">{a.locationAddress}</span>
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600">{a.sizeWidth}</td>
                          <td className="px-2 py-2 text-center text-gray-600">{a.sizeHeight}</td>
                          <td className="px-2 py-2 text-center font-medium text-gray-700">{a.sqft}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-[11px]">{a.illumination || '—'}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-[11px]">{a.facingDirection || '—'}</td>
                          <td className="px-2 py-2 text-center text-gray-500 text-[10px] font-mono">{a.latitude ? a.latitude.toFixed(4) : '—'}</td>
                          <td className="px-2 py-2 text-center text-gray-500 text-[10px] font-mono">{a.longitude ? a.longitude.toFixed(4) : '—'}</td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-800 whitespace-nowrap">{fmtCurrency(a.monthlyRate)}</td>
                          <td className="px-3 py-2 whitespace-nowrap bg-amber-50/50">
                            {a.occupiedFrom ? <span className="text-[11px] text-amber-800 font-medium">{fmtDate(a.occupiedFrom)}</span> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap bg-amber-50/50">
                            {a.occupiedTo ? <span className="text-[11px] text-amber-800 font-medium">{fmtDate(a.occupiedTo)}</span> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap bg-amber-50/50">
                            {a.currentClient ? <span className="text-[11px] font-semibold text-gray-800">{a.currentClient}</span> : <span className="text-green-600 text-[11px] font-medium">Available</span>}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              a.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                              a.status === 'BOOKED' ? 'bg-red-100 text-red-700' :
                              a.status === 'UNDER_MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{a.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                <span>Showing {filteredOccupancy.length} assets</span>
                {selectedIds.size > 0 && (
                  <span className="font-medium text-primary-700">
                    Total Monthly Rate: {fmtCurrency(selectedAssets.reduce((s, a) => s + parseFloat(a.monthlyRate || 0), 0))}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Create Quotation Modal */}
          {showQuoteModal && (
            <Modal title="Create Quotation from Selected Assets" size="lg" onClose={() => setShowQuoteModal(false)}>
              <div className="space-y-4">
                {/* Selected assets summary */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">{selectedAssets.length} Assets Selected</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {selectedAssets.map(a => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-primary-700 text-xs">{a.code}</span>
                        <span className="text-gray-600 truncate mx-2 flex-1">{a.name}</span>
                        <span className="font-semibold text-gray-800">{fmtCurrency(a.monthlyRate)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select
                    className="input-field"
                    value={quoteForm.clientId}
                    onChange={e => setQuoteForm(f => ({ ...f, clientId: e.target.value }))}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.companyName} — {c.contactPerson}</option>)}
                  </select>
                </div>

                {/* Duration & Validity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={quoteForm.months}
                      onChange={e => setQuoteForm(f => ({ ...f, months: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid for (days)</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={quoteForm.validDays}
                      onChange={e => setQuoteForm(f => ({ ...f, validDays: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-primary-50 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal ({quoteForm.months} mo × {selectedAssets.length} assets)</span>
                    <span className="font-semibold">{fmtCurrency(selectedAssets.reduce((s, a) => s + parseFloat(a.monthlyRate || 0), 0) * (parseInt(quoteForm.months) || 1))}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">GST @ 18%</span>
                    <span className="font-semibold">{fmtCurrency(selectedAssets.reduce((s, a) => s + parseFloat(a.monthlyRate || 0), 0) * (parseInt(quoteForm.months) || 1) * 0.18)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-primary-200 pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-primary-700">{fmtCurrency(selectedAssets.reduce((s, a) => s + parseFloat(a.monthlyRate || 0), 0) * (parseInt(quoteForm.months) || 1) * 1.18)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowQuoteModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button
                    onClick={handleCreateQuotation}
                    disabled={quoteSubmitting || !quoteForm.clientId}
                    className="btn-primary disabled:opacity-50"
                  >
                    {quoteSubmitting ? 'Creating...' : 'Create Quotation'}
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
};

export default Availability;
