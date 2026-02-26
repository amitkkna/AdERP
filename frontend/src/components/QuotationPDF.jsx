import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';

const C = {
  navy: '#0F2D52', navyLight: '#1A4070', gold: '#C8972A', goldLight: '#FFF8E8',
  white: '#FFFFFF', gray50: '#F8FAFC', gray100: '#F1F5F9', gray200: '#E2E8F0',
  gray400: '#94A3B8', gray500: '#64748B', gray600: '#475569', gray800: '#1E293B',
  accent: '#4F46E5',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 9, color: C.gray800,
    paddingTop: 0, paddingBottom: 50, paddingHorizontal: 0, backgroundColor: C.white,
  },

  /* ── Top Banner ── */
  banner: {
    backgroundColor: C.navy, paddingHorizontal: 36, paddingTop: 28, paddingBottom: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  brandName: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  brandTag: { fontSize: 7, color: '#8BACC8', marginTop: 2, letterSpacing: 0.5 },
  docTitleWrap: { alignItems: 'flex-end' },
  docTitle: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 3 },
  docNo: { fontSize: 9, color: '#A8BDD4', marginTop: 4, fontFamily: 'Helvetica-Bold' },
  docDate: { fontSize: 7, color: '#7FA3C0', marginTop: 2 },

  /* ── Gold accent strip ── */
  goldStrip: { height: 3, backgroundColor: C.gold },

  /* ── Info cards row ── */
  body: { paddingHorizontal: 36, paddingTop: 20 },

  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  infoCard: {
    flex: 1, backgroundColor: C.gray50, borderRadius: 6, padding: 14,
    borderTopWidth: 2, borderTopColor: C.gold,
  },
  infoLabel: {
    fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.gray400,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  infoValue: { fontSize: 9, color: C.gray800, lineHeight: 1.6 },
  infoBold: { fontFamily: 'Helvetica-Bold', fontSize: 10 },

  /* ── Period & Validity strip ── */
  metaStrip: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  metaBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 5, paddingVertical: 8, paddingHorizontal: 12,
  },
  metaLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', marginLeft: 6 },

  /* ── Table ── */
  tableWrap: { borderRadius: 6, borderWidth: 0.5, borderColor: C.gray200, overflow: 'hidden', marginBottom: 16 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 8, paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10,
    borderBottomWidth: 0.5, borderBottomColor: C.gray200,
  },
  tableRowAlt: {
    flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10,
    borderBottomWidth: 0.5, borderBottomColor: C.gray200, backgroundColor: C.gray50,
  },
  colNo:   { width: '5%' },
  colDesc: { width: '30%' },
  colLoc:  { width: '20%' },
  colSize: { width: '10%' },
  colRate: { width: '15%', textAlign: 'right' },
  colMo:   { width: '8%', textAlign: 'center' },
  colAmt:  { width: '12%', textAlign: 'right' },
  thText:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.4 },
  tdText:  { fontSize: 8, color: C.gray600 },
  tdBold:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray800 },

  /* ── Totals ── */
  totalsWrap: { alignItems: 'flex-end', marginBottom: 20 },
  totalsBox: { width: 220, borderRadius: 6, overflow: 'hidden', borderWidth: 0.5, borderColor: C.gray200 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.gray200,
  },
  totalLabel: { fontSize: 8.5, color: C.gray500 },
  totalValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.gray800 },
  grandRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.navy,
  },
  grandLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.white },
  grandValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.gold },

  /* ── Notes / Terms ── */
  notesRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  noteCard: {
    flex: 1, backgroundColor: C.gray50, borderRadius: 5, padding: 12,
    borderLeftWidth: 2, borderLeftColor: C.gold,
  },
  noteLabel: {
    fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.navy,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  noteText: { fontSize: 8, color: C.gray600, lineHeight: 1.6 },

  /* ── Signature ── */
  sigRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, paddingTop: 12,
  },
  sigBlock: { width: '40%', alignItems: 'center' },
  sigLine: { width: '100%', borderBottomWidth: 0.5, borderBottomColor: C.gray400, marginBottom: 4 },
  sigLabel: { fontSize: 7, color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* ── Footer ── */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.navy, paddingVertical: 8, paddingHorizontal: 36,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  footerBrand: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gold },
  footerText: { fontSize: 6.5, color: '#7FA3C0' },
});

const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const QuotationPDF = ({ quotation }) => {
  const {
    client, items = [], quotationNo, validUntil, startDate, endDate,
    createdAt, subtotal, taxRate, taxAmount, totalAmount, notes, terms,
  } = quotation;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Top Navy Banner ── */}
        <View style={s.banner}>
          <View>
            <Text style={s.brandName}>AdERP Media</Text>
            <Text style={s.brandTag}>Outdoor Advertising Solutions</Text>
          </View>
          <View style={s.docTitleWrap}>
            <Text style={s.docTitle}>QUOTATION</Text>
            <Text style={s.docNo}>{quotationNo}</Text>
            <Text style={s.docDate}>Date: {fmtDate(createdAt)}</Text>
          </View>
        </View>
        <View style={s.goldStrip} />

        <View style={s.body}>

          {/* ── Period & Validity ── */}
          <View style={s.metaStrip}>
            {startDate && endDate && (
              <View style={[s.metaBox, { backgroundColor: C.goldLight, borderWidth: 0.5, borderColor: C.gold }]}>
                <Text style={[s.metaLabel, { color: C.gold }]}>Period:</Text>
                <Text style={[s.metaValue, { color: C.navy }]}>{fmtDate(startDate)}  —  {fmtDate(endDate)}</Text>
              </View>
            )}
            <View style={[s.metaBox, { backgroundColor: '#EEF2FF', borderWidth: 0.5, borderColor: '#C7D2FE' }]}>
              <Text style={[s.metaLabel, { color: '#6366F1' }]}>Valid Until:</Text>
              <Text style={[s.metaValue, { color: C.navy }]}>{fmtDate(validUntil)}</Text>
            </View>
          </View>

          {/* ── Client Info ── */}
          <View style={s.infoRow}>
            <View style={s.infoCard}>
              <Text style={s.infoLabel}>Quotation For</Text>
              <Text style={[s.infoValue, s.infoBold]}>{client?.companyName}</Text>
              <Text style={s.infoValue}>{client?.contactPerson}</Text>
              <Text style={s.infoValue}>{client?.phone}</Text>
              <Text style={s.infoValue}>{client?.email}</Text>
            </View>
            <View style={s.infoCard}>
              <Text style={s.infoLabel}>Billing Address</Text>
              <Text style={[s.infoValue, s.infoBold]}>{client?.companyName}</Text>
              <Text style={s.infoValue}>{client?.address}</Text>
              <Text style={s.infoValue}>{client?.city}{client?.state ? `, ${client.state}` : ''}</Text>
              {client?.gstNumber && (
                <Text style={[s.infoValue, { marginTop: 4, fontFamily: 'Helvetica-Bold', fontSize: 8 }]}>GSTIN: {client.gstNumber}</Text>
              )}
            </View>
          </View>

          {/* ── Items Table ── */}
          <View style={s.tableWrap}>
            <View style={s.tableHeader}>
              <Text style={[s.thText, s.colNo]}>#</Text>
              <Text style={[s.thText, s.colDesc]}>Description</Text>
              <Text style={[s.thText, s.colLoc]}>Location</Text>
              <Text style={[s.thText, s.colSize]}>Size</Text>
              <Text style={[s.thText, s.colRate]}>Monthly Rate</Text>
              <Text style={[s.thText, s.colMo]}>Mo.</Text>
              <Text style={[s.thText, s.colAmt]}>Amount</Text>
            </View>

            {items.map((item, i) => (
              <View key={item.id || i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tdText, s.colNo]}>{i + 1}</Text>
                <Text style={[s.tdBold, s.colDesc]}>{item.description}</Text>
                <Text style={[s.tdText, s.colLoc]}>{item.location || '—'}</Text>
                <Text style={[s.tdText, s.colSize]}>{item.size || '—'}</Text>
                <Text style={[s.tdText, s.colRate]}>{fmt(item.monthlyRate)}</Text>
                <Text style={[s.tdText, s.colMo]}>{item.months}</Text>
                <Text style={[s.tdBold, s.colAmt]}>{fmt(item.amount)}</Text>
              </View>
            ))}
          </View>

          {/* ── Totals ── */}
          <View style={s.totalsWrap}>
            <View style={s.totalsBox}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{fmt(subtotal)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>GST ({Number(taxRate)}%)</Text>
                <Text style={s.totalValue}>{fmt(taxAmount)}</Text>
              </View>
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>Total</Text>
                <Text style={s.grandValue}>{fmt(totalAmount)}</Text>
              </View>
            </View>
          </View>

          {/* ── Notes & Terms ── */}
          {(notes || terms) && (
            <View style={s.notesRow}>
              {notes && (
                <View style={s.noteCard}>
                  <Text style={s.noteLabel}>Notes</Text>
                  <Text style={s.noteText}>{notes}</Text>
                </View>
              )}
              {terms && (
                <View style={s.noteCard}>
                  <Text style={s.noteLabel}>Terms & Conditions</Text>
                  <Text style={s.noteText}>{terms}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Signature ── */}
          <View style={s.sigRow}>
            <View style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Client Signature</Text>
            </View>
            <View style={s.sigBlock}>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Authorized Signature</Text>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>AdERP Media</Text>
          <Text style={s.footerText}>This is a computer-generated quotation.</Text>
          <Text style={s.footerText}>{quotationNo}</Text>
        </View>

      </Page>
    </Document>
  );
};

export default QuotationPDF;
