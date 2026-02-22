import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:       '#0F2D52',
  navyLight:  '#1A4070',
  gold:       '#C8972A',
  green:      '#1A6B35',
  greenLight: '#EAF5EE',
  orange:     '#B84D00',
  orangeLight:'#FFF0E6',
  gray50:     '#F8F9FA',
  gray100:    '#F1F3F5',
  gray200:    '#E9ECEF',
  gray400:    '#868E96',
  gray600:    '#495057',
  gray800:    '#212529',
  white:      '#FFFFFF',
  red:        '#C0392B',
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.gray800,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 32,
    backgroundColor: C.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: C.navy,
    marginHorizontal: -32,
    marginTop: -28,
    paddingHorizontal: 32,
    paddingVertical: 18,
    marginBottom: 16,
  },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.5 },
  companyTag:  { fontSize: 7.5, color: '#A8BDD4', marginTop: 3 },
  companyMeta: { fontSize: 7,   color: '#7FA3C0', marginTop: 1.5 },

  woRight: { alignItems: 'flex-end' },
  woLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 1.5 },
  woNo:    { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 2 },
  woBadge: { marginTop: 5, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 3 },
  woBadgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1, color: C.white },

  // Two-column info section
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 4,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 7,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: C.gold,
  },
  infoRow2: { flexDirection: 'row', marginBottom: 3.5 },
  infoLabel: { fontSize: 7, color: C.gray400, width: 72 },
  infoValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray800, flex: 1 },

  // Fillable field (blank line)
  fieldRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  fieldLabel: { fontSize: 7, color: C.gray600, width: 80 },
  fieldLine: { flex: 1, borderBottomWidth: 0.75, borderBottomColor: C.gray400, height: 12 },

  // Asset table
  section: { marginBottom: 12 },
  table: { borderWidth: 1, borderColor: C.gray200, borderRadius: 3, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 5, paddingHorizontal: 6 },
  tableHeadText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderTopWidth: 0.5, borderTopColor: C.gray200 },
  tableRowAlt: { backgroundColor: C.gray50 },
  tableCell: { fontSize: 7.5, color: C.gray800 },
  tableCellMono: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy },

  colCode:    { width: 52 },
  colName:    { flex: 1.8 },
  colLoc:     { flex: 2.2 },
  colSize:    { width: 56 },
  colType:    { width: 52 },
  colFacing:  { width: 44 },
  colIllum:   { width: 44 },

  // Flex specs grid (mount only)
  flexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flexField: { width: '30%' },
  flexLabel: { fontSize: 6.5, color: C.gray400, marginBottom: 3 },
  flexInput: { borderBottomWidth: 0.75, borderBottomColor: C.gray400, height: 14, paddingHorizontal: 2 },
  flexValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray800 },

  // Checklist
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  checkItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 5, paddingRight: 6 },
  checkbox: {
    width: 9, height: 9,
    borderWidth: 1, borderColor: C.navy,
    borderRadius: 1.5,
    marginRight: 6,
    flexShrink: 0,
  },
  checkText: { fontSize: 7.5, color: C.gray600, flex: 1 },

  // Special instructions box
  instructBox: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 3,
    padding: 6,
    backgroundColor: C.gray50,
  },
  instructText: { fontSize: 7.5, color: C.gray600, lineHeight: 1.5 },

  // Sign-off
  signRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  signBlock: { flex: 1, borderWidth: 1, borderColor: C.gray200, borderRadius: 3, padding: 8 },
  signLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 18 },
  signLine: { borderBottomWidth: 1, borderBottomColor: C.gray400, marginBottom: 4 },
  signMeta: { fontSize: 6.5, color: C.gray400 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: C.gray200,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: C.gray400 },

  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, alignSelf: 'flex-start', marginTop: 3 },
  statusText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MOUNT_TASKS = [
  'Collect flex/creative from office store',
  'Verify flex dimensions match asset size',
  'Inspect asset structure for safety',
  'Clean surface thoroughly before mounting',
  'Align and mount flex securely',
  'Tighten all bolts, screws & fastenings',
  'Verify visibility and angle from road',
  'Take geotagged photograph after mounting',
  'Report completion to supervisor',
  'Update asset status in ERP system',
];

const DEMOUNT_TASKS = [
  'Photograph asset before removal',
  'Remove flex carefully to avoid damage',
  'Roll and label flex for records/storage',
  'Inspect asset structure for any damage',
  'Clean site and asset surface after removal',
  'Take geotagged photograph post-demount',
  'Report asset condition to supervisor',
  'Return materials / flex to office store',
  'Update asset status in ERP system',
  'Handover demount report to manager',
];

const StatusBadge = ({ status }) => {
  const map = {
    PENDING:     { bg: '#FFF3CD', color: '#856404' },
    IN_PROGRESS: { bg: '#CCE5FF', color: '#004085' },
    COMPLETED:   { bg: '#D4EDDA', color: '#155724' },
    CANCELLED:   { bg: '#F8D7DA', color: '#721C24' },
  };
  const c = map[status] || map.PENDING;
  return (
    <View style={[s.statusBadge, { backgroundColor: c.bg }]}>
      <Text style={[s.statusText, { color: c.color }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
};

const InfoLine = ({ label, value }) => (
  <View style={s.infoRow2}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={s.infoValue}>{value || '—'}</Text>
  </View>
);

const FieldLine = ({ label, value }) => (
  <View style={s.fieldRow}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.fieldLine}>
      {value ? <Text style={[s.flexValue, { paddingHorizontal: 3 }]}>{value}</Text> : null}
    </View>
  </View>
);

const FlexField = ({ label, value }) => (
  <View style={s.flexField}>
    <Text style={s.flexLabel}>{label}</Text>
    <View style={s.flexInput}>
      {value ? <Text style={s.flexValue}>{value}</Text> : null}
    </View>
  </View>
);

// ─── Main PDF ─────────────────────────────────────────────────────────────────
const WorkOrderPDF = ({ workOrder }) => {
  if (!workOrder) return null;

  const isMount = workOrder.type === 'MOUNT';
  const booking = workOrder.booking || {};
  const client  = booking.client || {};
  const assets  = booking.bookingAssets || [];
  const tasks   = isMount ? MOUNT_TASKS : DEMOUNT_TASKS;

  const badgeBg    = isMount ? C.green : C.orange;
  const accentColor = isMount ? C.green : C.orange;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>AdERP Media</Text>
            <Text style={s.companyTag}>Billboard &amp; Advertisement Solutions</Text>
            <Text style={s.companyMeta}>Raipur, Chhattisgarh  |  +91 98765 43210</Text>
            <Text style={s.companyMeta}>info@aderpmedia.com  |  www.aderpmedia.com</Text>
          </View>
          <View style={s.woRight}>
            <Text style={s.woLabel}>WORK ORDER</Text>
            <Text style={s.woNo}>{workOrder.workOrderNo}</Text>
            <View style={[s.woBadge, { backgroundColor: badgeBg }]}>
              <Text style={s.woBadgeText}>{workOrder.type}</Text>
            </View>
          </View>
        </View>

        {/* ── INFO ROW: Booking Details + Assignment ── */}
        <View style={s.infoRow}>
          {/* Booking block */}
          <View style={s.infoBox}>
            <Text style={s.sectionTitle}>Booking Reference</Text>
            <InfoLine label="Work Order No." value={workOrder.workOrderNo} />
            <InfoLine label="Booking Code"   value={booking.bookingCode} />
            <InfoLine label="Client"         value={client.companyName} />
            <InfoLine label="Contact Person" value={client.contactPerson} />
            <InfoLine label="Phone"          value={client.phone} />
            <InfoLine label="Campaign Period"
              value={`${fmtDate(booking.startDate)} — ${fmtDate(booking.endDate)}`}
            />
            <InfoLine label="Order Type"     value={workOrder.type} />
            <InfoLine label="Generated On"   value={fmtDate(workOrder.createdAt)} />
            <View style={{ marginTop: 4 }}>
              <Text style={[s.infoLabel, { marginBottom: 2 }]}>WO Status</Text>
              <StatusBadge status={workOrder.status} />
            </View>
          </View>

          {/* Assignment block */}
          <View style={s.infoBox}>
            <Text style={s.sectionTitle}>Assignment Details</Text>
            <FieldLine label="Mounter Name"    value={workOrder.assignedTo} />
            <FieldLine label="Contact No."     value={workOrder.assignedPhone} />
            <FieldLine label="Scheduled Date"  value={workOrder.scheduledDate ? fmtDate(workOrder.scheduledDate) : null} />
            <FieldLine label="Completed Date"  value={workOrder.completedDate ? fmtDate(workOrder.completedDate) : null} />
            <FieldLine label="Supervisor"      value={null} />
            <FieldLine label="Vehicle No."     value={null} />
            <FieldLine label="Team Size"       value={null} />
          </View>
        </View>

        {/* ── ASSET DETAILS TABLE ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Asset Details</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={[s.tableHeadText, s.colCode]}>Code</Text>
              <Text style={[s.tableHeadText, s.colName]}>Asset Name</Text>
              <Text style={[s.tableHeadText, s.colLoc]}>Location</Text>
              <Text style={[s.tableHeadText, s.colSize]}>Size (W×H ft)</Text>
              <Text style={[s.tableHeadText, s.colType]}>Type</Text>
              <Text style={[s.tableHeadText, s.colFacing]}>Facing</Text>
              <Text style={[s.tableHeadText, s.colIllum]}>Illum.</Text>
            </View>
            {assets.length === 0 && (
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { color: C.gray400 }]}>No assets found.</Text>
              </View>
            )}
            {assets.map((ba, i) => {
              const a = ba.asset || {};
              return (
                <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCellMono, s.colCode]}>{a.code || '—'}</Text>
                  <Text style={[s.tableCell, s.colName]}>{a.name || '—'}</Text>
                  <Text style={[s.tableCell, s.colLoc]}>
                    {[a.locationAddress, a.locationCity].filter(Boolean).join(', ')}
                  </Text>
                  <Text style={[s.tableCell, s.colSize]}>
                    {a.sizeWidth && a.sizeHeight ? `${a.sizeWidth} × ${a.sizeHeight}` : '—'}
                  </Text>
                  <Text style={[s.tableCell, s.colType]}>{a.type || '—'}</Text>
                  <Text style={[s.tableCell, s.colFacing]}>{a.facingDirection || '—'}</Text>
                  <Text style={[s.tableCell, s.colIllum]}>{a.illumination || '—'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── FLEX SPECIFICATIONS (MOUNT ONLY) ── */}
        {isMount && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Flex / Creative Specifications  (Mount Only)</Text>
            <View style={s.flexGrid}>
              <FlexField label="Flex Size (W × H)" value={workOrder.flexSize} />
              <FlexField label="Material / Grade"   value={workOrder.flexMaterial} />
              <FlexField label="No. of Copies"      value={workOrder.flexCopies ? String(workOrder.flexCopies) : null} />
              <FlexField label="Design Reference"   value={workOrder.flexDesignRef} />
              <FlexField label="Print Vendor"        value={null} />
              <FlexField label="Collected By"        value={null} />
            </View>
          </View>
        )}

        {/* ── TASK CHECKLIST ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { borderBottomColor: accentColor }]}>
            {isMount ? 'Mount' : 'Demount'} Task Checklist
          </Text>
          <View style={s.checkGrid}>
            {tasks.map((task, i) => (
              <View key={i} style={s.checkItem}>
                <View style={[s.checkbox, { borderColor: accentColor }]} />
                <Text style={s.checkText}>{task}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── SPECIAL INSTRUCTIONS ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Special Instructions / Notes</Text>
          <View style={s.instructBox}>
            <Text style={s.instructText}>
              {workOrder.specialInstructions || 'No special instructions.'}
            </Text>
          </View>
        </View>

        {/* ── SIGN-OFF ── */}
        <View style={s.signRow}>
          <View style={s.signBlock}>
            <Text style={s.signLabel}>Mounter Signature</Text>
            <View style={s.signLine} />
            <Text style={s.signMeta}>Name: ________________________</Text>
            <Text style={[s.signMeta, { marginTop: 4 }]}>Date: ____________  Time: ________</Text>
          </View>
          <View style={s.signBlock}>
            <Text style={s.signLabel}>Supervisor / Manager</Text>
            <View style={s.signLine} />
            <Text style={s.signMeta}>Name: ________________________</Text>
            <Text style={[s.signMeta, { marginTop: 4 }]}>Date: ____________________________</Text>
          </View>
          <View style={s.signBlock}>
            <Text style={s.signLabel}>Site Photographs</Text>
            <View style={s.photoRow}>
              <View style={s.checkbox} />
              <Text style={s.checkText}>Before</Text>
              <View style={s.checkbox} />
              <Text style={s.checkText}>After</Text>
            </View>
            <Text style={[s.signMeta, { marginTop: 8 }]}>Photographer: ______________</Text>
            <Text style={[s.signMeta, { marginTop: 4 }]}>Submitted to: ______________</Text>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {workOrder.workOrderNo} • {isMount ? 'MOUNT' : 'DEMOUNT'} • Booking: {booking.bookingCode || '—'}
          </Text>
          <Text style={s.footerText}>
            Generated by AdERP on {fmtDate(new Date())}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

export default WorkOrderPDF;
