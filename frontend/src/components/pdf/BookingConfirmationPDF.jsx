import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const PRIMARY = '#4f46e5';
const PRIMARY_LIGHT = '#e0e7ff';
const GRAY_50 = '#f9fafb';
const GRAY_100 = '#f3f4f6';
const GRAY_300 = '#d1d5db';
const GRAY_500 = '#6b7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';
const GREEN = '#059669';
const AMBER = '#d97706';
const RED = '#dc2626';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: GRAY_700,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: PRIMARY,
  },
  brandName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 7,
    color: GRAY_500,
    marginTop: 4,
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
    letterSpacing: 0.5,
  },
  bookingCode: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    marginTop: 2,
  },
  dateText: {
    fontSize: 7,
    color: GRAY_500,
    marginTop: 1,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: PRIMARY_LIGHT,
  },
  // Client details
  clientSection: {
    padding: 8,
    backgroundColor: GRAY_50,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: GRAY_100,
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  fieldLabel: {
    width: 65,
    fontSize: 7,
    color: GRAY_500,
  },
  fieldValue: {
    flex: 1,
    fontSize: 8,
    color: GRAY_900,
    fontFamily: 'Helvetica-Bold',
  },
  fieldValueNormal: {
    flex: 1,
    fontSize: 8,
    color: GRAY_700,
  },
  // Asset table
  assetTableHeader: {
    flexDirection: 'row',
    backgroundColor: GRAY_100,
    padding: 4,
    borderRadius: 2,
    marginBottom: 1,
  },
  assetTableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  thText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tdText: {
    fontSize: 7,
    color: GRAY_700,
  },
  tdBold: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
  },
  // Campaign
  campaignBox: {
    flexDirection: 'row',
    backgroundColor: PRIMARY_LIGHT,
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  campaignItem: {
    alignItems: 'center',
  },
  campaignLabel: {
    fontSize: 6,
    color: PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  campaignValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: GRAY_900,
  },
  // Financial
  financeTable: {
    marginBottom: 8,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  financeRowAlt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: GRAY_50,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  financeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: PRIMARY,
    borderRadius: 3,
    marginTop: 2,
  },
  financeLabel: { fontSize: 8, color: GRAY_700 },
  financeValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GRAY_900 },
  financeTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: 'white' },
  financeTotalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: 'white' },
  // Terms
  termsSection: { marginTop: 4, marginBottom: 10 },
  termsTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY_500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  termItem: { fontSize: 6, color: GRAY_500, marginBottom: 1, lineHeight: 1.5 },
  // Signature
  signatureSection: { marginTop: 10, marginBottom: 10 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
  signatureBlock: { flex: 1, alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: GRAY_300, marginBottom: 4, height: 30 },
  signatureName: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY_900, textAlign: 'center' },
  signatureDesignation: { fontSize: 6, color: GRAY_500, textAlign: 'center', marginTop: 1 },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: GRAY_300,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: GRAY_500 },
});

const formatCurrency = (v) => {
  const num = parseFloat(v || 0);
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getMonthsDiff = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() >= s.getDate()) months += 1;
  return Math.max(1, months);
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'ACTIVE': return { backgroundColor: '#d1fae5', color: GREEN };
    case 'CONFIRMED': return { backgroundColor: '#dbeafe', color: '#2563eb' };
    case 'PENDING': return { backgroundColor: '#fef3c7', color: AMBER };
    case 'COMPLETED': return { backgroundColor: GRAY_100, color: GRAY_700 };
    case 'CANCELLED': return { backgroundColor: '#fee2e2', color: RED };
    default: return { backgroundColor: GRAY_100, color: GRAY_700 };
  }
};

const BookingConfirmationPDF = ({ booking }) => {
  const b = booking;
  const client = b.client || {};
  const bookingAssets = b.bookingAssets || [];
  const totalMonthlyRate = bookingAssets.reduce((sum, ba) => sum + parseFloat(ba.monthlyRate || 0), 0);
  const months = getMonthsDiff(b.startDate, b.endDate);
  const statusStyle = getStatusStyle(b.status);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>AdERP</Text>
            <Text style={styles.brandTagline}>Billboard & Unipole Management System</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>BOOKING CONFIRMATION</Text>
            <Text style={styles.bookingCode}>{b.bookingCode}</Text>
            <Text style={styles.dateText}>Generated: {formatDate(new Date())}</Text>
            <View style={[styles.statusBadge, statusStyle]}>
              <Text>{b.status}</Text>
            </View>
          </View>
        </View>

        {/* Client Details */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionHeader}>Client Details</Text>
          <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Company</Text>
                <Text style={styles.fieldValue}>{client.companyName}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Contact</Text>
                <Text style={styles.fieldValueNormal}>{client.contactPerson}</Text>
              </View>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <Text style={styles.fieldValueNormal}>{client.phone}</Text>
              </View>
              {client.email && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.fieldValueNormal}>{client.email}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              {client.address && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Address</Text>
                  <Text style={styles.fieldValueNormal}>{client.address}</Text>
                </View>
              )}
              {client.city && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>City / State</Text>
                  <Text style={styles.fieldValueNormal}>{client.city}, {client.state} {client.pincode || ''}</Text>
                </View>
              )}
              {client.gstNumber && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>GST No.</Text>
                  <Text style={styles.fieldValueNormal}>{client.gstNumber}</Text>
                </View>
              )}
              {client.panNumber && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>PAN No.</Text>
                  <Text style={styles.fieldValueNormal}>{client.panNumber}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Asset Details Table */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Asset Details ({bookingAssets.length} Asset{bookingAssets.length > 1 ? 's' : ''})</Text>
          <View style={styles.assetTableHeader}>
            <Text style={[styles.thText, { width: '14%' }]}>CODE</Text>
            <Text style={[styles.thText, { width: '22%' }]}>NAME</Text>
            <Text style={[styles.thText, { width: '12%' }]}>TYPE</Text>
            <Text style={[styles.thText, { width: '10%' }]}>SIZE</Text>
            <Text style={[styles.thText, { width: '18%' }]}>LOCATION</Text>
            <Text style={[styles.thText, { width: '10%' }]}>ZONE</Text>
            <Text style={[styles.thText, { width: '14%', textAlign: 'right' }]}>RATE/MO</Text>
          </View>
          {bookingAssets.map((ba, idx) => {
            const asset = ba.asset || {};
            const zone = asset.zone || {};
            return (
              <View key={idx} style={styles.assetTableRow}>
                <Text style={[styles.tdBold, { width: '14%' }]}>{asset.code}</Text>
                <Text style={[styles.tdText, { width: '22%' }]}>{asset.name}</Text>
                <Text style={[styles.tdText, { width: '12%' }]}>{asset.type}</Text>
                <Text style={[styles.tdText, { width: '10%' }]}>{asset.sizeWidth && asset.sizeHeight ? `${asset.sizeWidth}x${asset.sizeHeight}` : '-'}</Text>
                <Text style={[styles.tdText, { width: '18%' }]}>{asset.locationCity || '-'}</Text>
                <Text style={[styles.tdText, { width: '10%' }]}>{zone.name || '-'}</Text>
                <Text style={[styles.tdBold, { width: '14%', textAlign: 'right' }]}>{formatCurrency(ba.monthlyRate)}</Text>
              </View>
            );
          })}
        </View>

        {/* Campaign Period */}
        <View style={styles.campaignBox}>
          <View style={styles.campaignItem}>
            <Text style={styles.campaignLabel}>Start Date</Text>
            <Text style={styles.campaignValue}>{formatDate(b.startDate)}</Text>
          </View>
          <View style={styles.campaignItem}>
            <Text style={styles.campaignLabel}>End Date</Text>
            <Text style={styles.campaignValue}>{formatDate(b.endDate)}</Text>
          </View>
          <View style={styles.campaignItem}>
            <Text style={styles.campaignLabel}>Duration</Text>
            <Text style={styles.campaignValue}>{months} Month{months > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Financial Summary</Text>
          <View style={styles.financeTable}>
            {bookingAssets.map((ba, idx) => (
              <View key={idx} style={idx % 2 === 0 ? styles.financeRow : styles.financeRowAlt}>
                <Text style={styles.financeLabel}>{ba.asset?.code} - Monthly Rate</Text>
                <Text style={styles.financeValue}>{formatCurrency(ba.monthlyRate)}</Text>
              </View>
            ))}
            {bookingAssets.length > 1 && (
              <View style={styles.financeRow}>
                <Text style={[styles.financeLabel, { fontFamily: 'Helvetica-Bold' }]}>Combined Monthly Rate</Text>
                <Text style={styles.financeValue}>{formatCurrency(totalMonthlyRate)}</Text>
              </View>
            )}
            <View style={styles.financeRowAlt}>
              <Text style={styles.financeLabel}>Duration</Text>
              <Text style={styles.financeValue}>{months} Month{months > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Subtotal ({formatCurrency(totalMonthlyRate)} x {months})</Text>
              <Text style={styles.financeValue}>{formatCurrency(b.totalAmount)}</Text>
            </View>
            <View style={styles.financeRowAlt}>
              <Text style={styles.financeLabel}>GST @ 18%</Text>
              <Text style={styles.financeValue}>{formatCurrency(parseFloat(b.totalAmount || 0) * 0.18)}</Text>
            </View>
            <View style={styles.financeTotalRow}>
              <Text style={styles.financeTotalLabel}>Grand Total (incl. GST)</Text>
              <Text style={styles.financeTotalValue}>{formatCurrency(parseFloat(b.totalAmount || 0) * 1.18)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {b.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Notes</Text>
            <Text style={{ fontSize: 7, color: GRAY_700 }}>{b.notes}</Text>
          </View>
        )}

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termItem}>1. This booking confirmation is subject to full payment as per the agreed schedule.</Text>
          <Text style={styles.termItem}>2. Cancellation must be communicated in writing at least 30 days prior to the campaign start date.</Text>
          <Text style={styles.termItem}>3. The advertising content/creative must be provided at least 7 days before the campaign start date.</Text>
          <Text style={styles.termItem}>4. GST @ 18% is applicable on all bookings as per Government of India regulations.</Text>
          <Text style={styles.termItem}>5. The company reserves the right to remove content that violates local advertising regulations.</Text>
          <Text style={styles.termItem}>6. Payment terms: 100% advance or as per mutually agreed payment schedule.</Text>
        </View>

        {/* Signature Block */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Prepared By</Text>
              <Text style={styles.signatureDesignation}>Sales Executive</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Approved By</Text>
              <Text style={styles.signatureDesignation}>Manager / Director</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Client Acceptance</Text>
              <Text style={styles.signatureDesignation}>{client.contactPerson || 'Authorized Signatory'}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>This is a system-generated document from AdERP — Billboard & Unipole Management</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};

export default BookingConfirmationPDF;
