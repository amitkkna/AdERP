import { Document, Page, Text, View, StyleSheet, Canvas } from '@react-pdf/renderer';

/* ─── Palette ────────────────────────────────────────────────── */
const C = {
  navy:       '#1e2a4a',
  navyLight:  '#263354',
  indigo:     '#4f46e5',
  gold:       '#f59e0b',
  goldBg:     '#fffbeb',
  green:      '#16a34a',
  red:        '#dc2626',
  white:      '#ffffff',
  offWhite:   '#f8fafc',
  border:     '#e2e8f0',
  text:       '#1e293b',
  muted:      '#64748b',
  light:      '#94a3b8',
  rowAlt:     '#f8fafc',
  paidGreen:  '#dcfce7',
  paidText:   '#166534',
};

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmtINR = (n) =>
  `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const monthsBetween = (start, end) => {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return Math.max(1, diff);
};

const assetTypeLabel = (t) =>
  ({ BILLBOARD: 'Billboard', UNIPOLE: 'Unipole', HOARDING: 'Hoarding', GANTRY: 'Gantry', OTHER: 'Other' }[t] || t);

/* ─── Styles ──────────────────────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
  },

  /* === HEADER === */
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandBlock: {},
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 7.5,
    color: '#94a3b8',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  brandAddress: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 1.6,
  },
  invoiceBlock: { alignItems: 'flex-end' },
  invoiceLabel: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    letterSpacing: 3,
  },
  invoiceNo: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.gold,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  invoiceDateRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  dateBox: { alignItems: 'flex-end' },
  dateLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateValue: { fontSize: 8.5, color: C.white, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  /* === STATUS BAND === */
  statusBand: {
    paddingHorizontal: 36,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* === INFO SECTION === */
  infoSection: {
    paddingHorizontal: 36,
    paddingBottom: 20,
    flexDirection: 'row',
    gap: 16,
  },
  billToBox: {
    flex: 1,
    backgroundColor: C.offWhite,
    borderRadius: 6,
    padding: 14,
    borderLeft: `3pt solid ${C.indigo}`,
  },
  bookingBox: {
    width: 180,
    backgroundColor: C.offWhite,
    borderRadius: 6,
    padding: 14,
    borderLeft: `3pt solid ${C.gold}`,
  },
  boxLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.light,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  boxPrimary: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 3 },
  boxSecondary: { fontSize: 8.5, color: C.muted, lineHeight: 1.6 },
  boxMono: { fontSize: 7.5, color: C.light, fontFamily: 'Helvetica', marginTop: 4 },
  infoRow: { flexDirection: 'row', marginBottom: 5 },
  infoKey: { fontSize: 7.5, color: C.light, width: 56 },
  infoVal: { fontSize: 8, color: C.text, fontFamily: 'Helvetica-Bold', flex: 1 },

  /* === TABLE === */
  tableWrap: { paddingHorizontal: 36, marginBottom: 4 },
  tableHead: {
    backgroundColor: C.navy,
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.rowAlt,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.3 },
  td: { fontSize: 8.5, color: C.text },
  tdMuted: { fontSize: 7.5, color: C.muted, marginTop: 1 },
  tdMono: { fontSize: 7.5, color: C.indigo, fontFamily: 'Helvetica-Bold' },
  // Column widths
  cNo:   { width: 22 },
  cDesc: { flex: 1 },
  cLoc:  { width: 80 },
  cRate: { width: 68, textAlign: 'right' },
  cMo:   { width: 32, textAlign: 'center' },
  cAmt:  { width: 72, textAlign: 'right' },

  /* === TOTALS === */
  totalsWrap: {
    paddingHorizontal: 36,
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  totalsBox: { width: 220 },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  totalKey: { fontSize: 8.5, color: C.muted },
  totalVal: { fontSize: 8.5, color: C.text },
  grandBox: {
    backgroundColor: C.navy,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  grandLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white },
  grandValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.gold },

  /* === PAYMENTS === */
  section: { paddingHorizontal: 36, marginBottom: 14 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  payRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  payRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: C.paidGreen,
    borderBottom: `0.5pt solid ${C.border}`,
  },
  pDate:   { width: 70, fontSize: 8, color: C.muted },
  pMethod: { flex: 1, fontSize: 8, color: C.text },
  pRef:    { flex: 1, fontSize: 7.5, color: C.light },
  pAmt:    { width: 70, fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.green, textAlign: 'right' },
  paidBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.paidText,
    backgroundColor: C.paidGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    letterSpacing: 1,
    alignSelf: 'flex-end',
    marginTop: 6,
  },

  /* === NOTES === */
  notesBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 5,
    padding: 10,
    borderLeft: `3pt solid ${C.gold}`,
  },
  notesText: { fontSize: 8, color: '#92400e', lineHeight: 1.6 },

  /* === FOOTER === */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.navy,
    paddingHorizontal: 36,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {},
  footerText: { fontSize: 7, color: '#94a3b8' },
  footerBrand: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.white },
  footerRight: { alignItems: 'flex-end' },

  /* === WATERMARK === */
  watermarkWrap: {
    position: 'absolute',
    top: 260,
    left: 100,
    transform: 'rotate(-35deg)',
  },
  watermarkText: {
    fontSize: 72,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    opacity: 0.07,
    letterSpacing: 8,
  },

  /* === DIVIDER === */
  divider: { height: 0.5, backgroundColor: C.border, marginHorizontal: 36, marginVertical: 12 },
});

/* ─── Status helper ───────────────────────────────────────────── */
const statusStyle = (status) => {
  const map = {
    DRAFT:          { backgroundColor: '#f1f5f9', color: '#64748b' },
    SENT:           { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    PAID:           { backgroundColor: '#dcfce7', color: '#166534' },
    PARTIALLY_PAID: { backgroundColor: '#fef3c7', color: '#92400e' },
    OVERDUE:        { backgroundColor: '#fee2e2', color: '#991b1b' },
    CANCELLED:      { backgroundColor: '#f1f5f9', color: '#94a3b8' },
  };
  return map[status] || map.DRAFT;
};

const paymentMethodLabel = (m) => ({
  CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque',
  UPI: 'UPI', ONLINE: 'Online',
}[m] || m);

/* ─── Component ───────────────────────────────────────────────── */
const InvoicePDF = ({ invoice }) => {
  if (!invoice) return null;

  const { booking, payments = [] } = invoice;
  const client   = booking?.client;
  const assets   = booking?.bookingAssets || [];

  // Derive months from invoice subtotal ÷ sum of monthly rates so row
  // amounts always reconcile with the stored invoice subtotal exactly.
  const totalMonthlyRate = assets.reduce((s, ba) => s + Number(ba.monthlyRate), 0);
  const months = totalMonthlyRate > 0
    ? Math.max(1, Math.round(Number(invoice.subtotal) / totalMonthlyRate))
    : monthsBetween(booking?.startDate, booking?.endDate);

  const isPaid   = invoice.status === 'PAID';
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance   = Number(invoice.totalAmount) - totalPaid;
  const ss = statusStyle(invoice.status);

  return (
    <Document
      title={invoice.invoiceNumber}
      author="AdERP"
      subject={`Invoice for ${client?.companyName || ''}`}
    >
      <Page size="A4" style={S.page}>

        {/* ── PAID Watermark ── */}
        {isPaid && (
          <View style={S.watermarkWrap} fixed>
            <Text style={S.watermarkText}>PAID</Text>
          </View>
        )}

        {/* ── HEADER ── */}
        <View style={S.header}>
          <View style={S.brandBlock}>
            <Text style={S.brandName}>AdERP</Text>
            <Text style={S.brandTagline}>Advertisement & Outdoor Media Management</Text>
            <Text style={S.brandAddress}>
              {'Chhattisgarh, India\ncontact@aderp.com  |  +91 98765 43210'}
            </Text>
          </View>

          <View style={S.invoiceBlock}>
            <Text style={S.invoiceLabel}>INVOICE</Text>
            <Text style={S.invoiceNo}>{invoice.invoiceNumber}</Text>
            <View style={S.invoiceDateRow}>
              <View style={S.dateBox}>
                <Text style={S.dateLabel}>Invoice Date</Text>
                <Text style={S.dateValue}>{fmtDateShort(invoice.invoiceDate)}</Text>
              </View>
              <View style={S.dateBox}>
                <Text style={S.dateLabel}>Due Date</Text>
                <Text style={S.dateValue}>{fmtDateShort(invoice.dueDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── STATUS BAND ── */}
        <View style={[S.statusBand, { backgroundColor: C.navyLight }]}>
          <Text style={[S.statusPill, { color: ss.color, backgroundColor: ss.backgroundColor }]}>
            {invoice.status.replace('_', ' ')}
          </Text>
        </View>

        {/* ── BILL TO + BOOKING INFO ── */}
        <View style={S.infoSection}>
          {/* Bill To */}
          <View style={S.billToBox}>
            <Text style={S.boxLabel}>Bill To</Text>
            <Text style={S.boxPrimary}>{client?.companyName}</Text>
            <Text style={S.boxSecondary}>{client?.contactPerson}</Text>
            {client?.phone && <Text style={S.boxSecondary}>{client.phone}</Text>}
            {client?.email && <Text style={S.boxSecondary}>{client.email}</Text>}
            {client?.address && (
              <Text style={[S.boxSecondary, { marginTop: 4 }]}>
                {client.address}{'\n'}{client.city}{client.state ? `, ${client.state}` : ''}
              </Text>
            )}
            {client?.gstNumber && (
              <Text style={S.boxMono}>GSTIN: {client.gstNumber}</Text>
            )}
            {client?.panNumber && (
              <Text style={S.boxMono}>PAN: {client.panNumber}</Text>
            )}
          </View>

          {/* Booking Info */}
          <View style={S.bookingBox}>
            <Text style={S.boxLabel}>Booking Details</Text>
            <Text style={[S.boxPrimary, { color: C.indigo }]}>{booking?.bookingCode}</Text>

            <View style={[S.infoRow, { marginTop: 8 }]}>
              <Text style={S.infoKey}>Start</Text>
              <Text style={S.infoVal}>{fmtDate(booking?.startDate)}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoKey}>End</Text>
              <Text style={S.infoVal}>{fmtDate(booking?.endDate)}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoKey}>Duration</Text>
              <Text style={S.infoVal}>{months} month{months > 1 ? 's' : ''}</Text>
            </View>
            <View style={S.infoRow}>
              <Text style={S.infoKey}>Assets</Text>
              <Text style={S.infoVal}>{assets.length} site{assets.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        {/* ── ITEMS TABLE ── */}
        <View style={S.tableWrap}>
          {/* Table Header */}
          <View style={S.tableHead}>
            <Text style={[S.th, S.cNo]}>#</Text>
            <Text style={[S.th, S.cDesc]}>Asset / Description</Text>
            <Text style={[S.th, S.cLoc]}>Location</Text>
            <Text style={[S.th, S.cRate]}>Monthly Rate</Text>
            <Text style={[S.th, S.cMo]}>Mo.</Text>
            <Text style={[S.th, S.cAmt]}>Amount</Text>
          </View>

          {/* Asset Rows */}
          {assets.length > 0 ? assets.map((ba, i) => {
            const a = ba.asset;
            const amt = Number(ba.monthlyRate) * months;
            return (
              <View key={ba.assetId || i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                <Text style={[S.td, S.cNo, { color: C.muted }]}>{i + 1}</Text>
                <View style={S.cDesc}>
                  <Text style={S.td}>{a?.name || 'Advertisement Site'}</Text>
                  <Text style={S.tdMono}>{a?.code}  {a?.type ? `· ${assetTypeLabel(a.type)}` : ''}</Text>
                  {(a?.sizeWidth && a?.sizeHeight) && (
                    <Text style={S.tdMuted}>{a.sizeWidth}W × {a.sizeHeight}H ft</Text>
                  )}
                </View>
                <View style={S.cLoc}>
                  <Text style={S.td}>{a?.locationCity || '—'}</Text>
                  {a?.locationAddress && (
                    <Text style={S.tdMuted} numberOfLines={2}>{a.locationAddress}</Text>
                  )}
                </View>
                <Text style={[S.td, S.cRate]}>{fmtINR(ba.monthlyRate)}</Text>
                <Text style={[S.td, S.cMo, { color: C.muted }]}>{months}</Text>
                <Text style={[S.td, S.cAmt, { fontFamily: 'Helvetica-Bold' }]}>{fmtINR(amt)}</Text>
              </View>
            );
          }) : (
            // Fallback: single row with subtotal if no assets
            <View style={S.tableRow}>
              <Text style={[S.td, S.cNo, { color: C.muted }]}>1</Text>
              <View style={S.cDesc}>
                <Text style={S.td}>Advertisement Services</Text>
                <Text style={S.tdMono}>{booking?.bookingCode}</Text>
              </View>
              <View style={S.cLoc}><Text style={S.td}>—</Text></View>
              <Text style={[S.td, S.cRate]}>{fmtINR(invoice.subtotal)}</Text>
              <Text style={[S.td, S.cMo, { color: C.muted }]}>{months}</Text>
              <Text style={[S.td, S.cAmt, { fontFamily: 'Helvetica-Bold' }]}>{fmtINR(invoice.subtotal)}</Text>
            </View>
          )}
        </View>

        {/* ── TOTALS ── */}
        <View style={S.totalsWrap}>
          <View style={S.totalsBox}>
            <View style={S.totalLine}>
              <Text style={S.totalKey}>Subtotal</Text>
              <Text style={S.totalVal}>{fmtINR(invoice.subtotal)}</Text>
            </View>
            <View style={S.totalLine}>
              <Text style={S.totalKey}>GST ({Number(invoice.taxRate)}%)</Text>
              <Text style={S.totalVal}>{fmtINR(invoice.taxAmount)}</Text>
            </View>
            {totalPaid > 0 && (
              <View style={S.totalLine}>
                <Text style={S.totalKey}>Amount Paid</Text>
                <Text style={[S.totalVal, { color: C.green }]}>− {fmtINR(totalPaid)}</Text>
              </View>
            )}
            {totalPaid > 0 && balance > 0 && (
              <View style={S.totalLine}>
                <Text style={[S.totalKey, { color: C.red }]}>Balance Due</Text>
                <Text style={[S.totalVal, { color: C.red, fontFamily: 'Helvetica-Bold' }]}>{fmtINR(balance)}</Text>
              </View>
            )}
            <View style={S.grandBox}>
              <Text style={S.grandLabel}>{isPaid ? 'TOTAL PAID' : 'TOTAL DUE'}</Text>
              <Text style={S.grandValue}>{fmtINR(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* ── PAYMENT HISTORY ── */}
        {payments.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Payment History</Text>
            {/* Header */}
            <View style={[S.payRow, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[S.pDate, { fontFamily: 'Helvetica-Bold', color: C.muted }]}>Date</Text>
              <Text style={[S.pMethod, { fontFamily: 'Helvetica-Bold', color: C.muted }]}>Method</Text>
              <Text style={[S.pRef, { fontFamily: 'Helvetica-Bold', color: C.muted }]}>Reference</Text>
              <Text style={[S.pAmt, { fontFamily: 'Helvetica-Bold', color: C.muted }]}>Amount</Text>
            </View>
            {payments.map((p, i) => (
              <View key={p.id || i} style={i % 2 === 0 ? S.payRow : S.payRowAlt}>
                <Text style={S.pDate}>{fmtDateShort(p.paymentDate)}</Text>
                <Text style={S.pMethod}>{paymentMethodLabel(p.method)}</Text>
                <Text style={S.pRef}>{p.transactionRef || '—'}</Text>
                <Text style={S.pAmt}>{fmtINR(p.amount)}</Text>
              </View>
            ))}
            {isPaid && (
              <Text style={S.paidBadge}>✓ FULLY PAID</Text>
            )}
          </View>
        )}

        {/* ── NOTES ── */}
        {invoice.notes && (
          <View style={[S.section, { marginBottom: 16 }]}>
            <Text style={S.sectionTitle}>Notes</Text>
            <View style={S.notesBox}>
              <Text style={S.notesText}>{invoice.notes}</Text>
            </View>
          </View>
        )}

        {/* ── TERMS ── */}
        <View style={[S.section, { marginBottom: 60 }]}>
          <Text style={S.sectionTitle}>Terms & Conditions</Text>
          <Text style={[S.notesText, { color: C.muted }]}>
            {'1. Payment is due by the date specified above. Late payments may attract penalty charges.\n' +
             '2. This is a computer-generated invoice and does not require a physical signature.\n' +
             '3. Please quote the invoice number in all correspondence and payment references.\n' +
             '4. For disputes or queries, contact us within 7 days of the invoice date.'}
          </Text>
        </View>

        {/* ── FOOTER ── */}
        <View style={S.footer} fixed>
          <View style={S.footerLeft}>
            <Text style={S.footerBrand}>AdERP — Advertisement ERP</Text>
            <Text style={S.footerText}>Chhattisgarh, India  |  contact@aderp.com</Text>
          </View>
          <View style={S.footerRight}>
            <Text style={S.footerText}>{invoice.invoiceNumber}</Text>
            <Text style={[S.footerText, { marginTop: 2 }]}>Thank you for your business!</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
};

export default InvoicePDF;
