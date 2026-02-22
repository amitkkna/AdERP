import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, padding: 36, color: '#1e293b' },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyBlock: {},
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#4f46e5', marginBottom: 2 },
  companyTagline: { fontSize: 8, color: '#64748b' },
  docBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#4f46e5', letterSpacing: 2 },
  docNo: { fontSize: 10, color: '#475569', marginTop: 4 },
  docDate: { fontSize: 8, color: '#94a3b8', marginTop: 2 },
  // Divider
  divider: { borderBottom: '1pt solid #e2e8f0', marginVertical: 12 },
  // Two-col info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infoBlock: { width: '48%' },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoValue: { fontSize: 9, color: '#1e293b', lineHeight: 1.5 },
  infoBold: { fontFamily: 'Helvetica-Bold' },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: '#4f46e5', color: '#fff', padding: '6 8', borderRadius: 3 },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottom: '0.5pt solid #f1f5f9' },
  tableRowAlt: { flexDirection: 'row', padding: '5 8', borderBottom: '0.5pt solid #f1f5f9', backgroundColor: '#f8fafc' },
  colNo:    { width: '5%' },
  colDesc:  { width: '35%' },
  colLoc:   { width: '20%' },
  colSize:  { width: '12%' },
  colRate:  { width: '13%', textAlign: 'right' },
  colMo:    { width: '7%', textAlign: 'center' },
  colAmt:   { width: '8%', textAlign: 'right' },
  thText:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' },
  tdText:   { fontSize: 8.5, color: '#334155' },
  // Totals
  totalsBlock: { alignItems: 'flex-end', marginTop: 12 },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { width: 100, fontSize: 8.5, color: '#64748b', textAlign: 'right', marginRight: 8 },
  totalValue: { width: 80, fontSize: 8.5, color: '#1e293b', textAlign: 'right' },
  grandRow: { flexDirection: 'row', backgroundColor: '#4f46e5', padding: '5 8', borderRadius: 3, marginTop: 4 },
  grandLabel: { width: 100, fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right', marginRight: 8 },
  grandValue: { width: 80, fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right' },
  // Notes / Terms
  sectionLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  sectionText:  { fontSize: 8.5, color: '#475569', lineHeight: 1.6 },
  // Footer
  footer: { position: 'absolute', bottom: 28, left: 36, right: 36, borderTop: '0.5pt solid #e2e8f0', paddingTop: 6 },
  footerText: { fontSize: 7, color: '#94a3b8', textAlign: 'center' },
  validityBadge: {
    backgroundColor: '#fef3c7', borderRadius: 4, padding: '4 10',
    marginBottom: 16, alignSelf: 'flex-start',
  },
  validityText: { fontSize: 8, color: '#92400e' },
});

const fmt = (n) => `Rs. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const QuotationPDF = ({ quotation }) => {
  const { client, items = [], quotationNo, validUntil, createdAt, subtotal, taxRate, taxAmount, totalAmount, notes, terms } = quotation;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>AdERP</Text>
            <Text style={styles.companyTagline}>Advertisement & Outdoor Media Management</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitle}>QUOTATION</Text>
            <Text style={styles.docNo}>{quotationNo}</Text>
            <Text style={styles.docDate}>Date: {fmtDate(createdAt)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Validity badge */}
        <View style={styles.validityBadge}>
          <Text style={styles.validityText}>
            Valid Until: {fmtDate(validUntil)}
          </Text>
        </View>

        {/* Client info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Quotation For</Text>
            <Text style={[styles.infoValue, styles.infoBold]}>{client?.companyName}</Text>
            <Text style={styles.infoValue}>{client?.contactPerson}</Text>
            <Text style={styles.infoValue}>{client?.phone}</Text>
            <Text style={styles.infoValue}>{client?.email}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Billing Address</Text>
            <Text style={styles.infoValue}>{client?.address}</Text>
            <Text style={styles.infoValue}>{client?.city}, {client?.state}</Text>
            {client?.gstNumber && <Text style={styles.infoValue}>GSTIN: {client.gstNumber}</Text>}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.colNo]}>#</Text>
          <Text style={[styles.thText, styles.colDesc]}>Description</Text>
          <Text style={[styles.thText, styles.colLoc]}>Location</Text>
          <Text style={[styles.thText, styles.colSize]}>Size</Text>
          <Text style={[styles.thText, styles.colRate]}>Monthly Rate</Text>
          <Text style={[styles.thText, styles.colMo]}>Mo.</Text>
          <Text style={[styles.thText, styles.colAmt]}>Amount</Text>
        </View>

        {items.map((item, i) => (
          <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tdText, styles.colNo]}>{i + 1}</Text>
            <Text style={[styles.tdText, styles.colDesc]}>{item.description}</Text>
            <Text style={[styles.tdText, styles.colLoc]}>{item.location || '—'}</Text>
            <Text style={[styles.tdText, styles.colSize]}>{item.size || '—'}</Text>
            <Text style={[styles.tdText, styles.colRate]}>{fmt(item.monthlyRate)}</Text>
            <Text style={[styles.tdText, styles.colMo]}>{item.months}</Text>
            <Text style={[styles.tdText, styles.colAmt]}>{fmt(item.amount)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>GST ({taxRate}%)</Text>
            <Text style={styles.totalValue}>{fmt(taxAmount)}</Text>
          </View>
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{fmt(totalAmount)}</Text>
          </View>
        </View>

        {/* Notes & Terms */}
        {(notes || terms) && (
          <View style={{ marginTop: 20, flexDirection: 'row', gap: 20 }}>
            {notes && (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Notes</Text>
                <Text style={styles.sectionText}>{notes}</Text>
              </View>
            )}
            {terms && (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Terms & Conditions</Text>
                <Text style={styles.sectionText}>{terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This is a computer-generated quotation. For queries, please contact us. | AdERP — Advertisement ERP System
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuotationPDF;
