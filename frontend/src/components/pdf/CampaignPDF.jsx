import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  navy:      '#0F2D52',
  navyLight: '#1A4070',
  gold:      '#C8972A',
  goldBg:    '#FFF8E8',
  white:     '#FFFFFF',
  gray50:    '#F8F9FA',
  gray100:   '#F1F3F5',
  gray200:   '#E9ECEF',
  gray400:   '#868E96',
  gray600:   '#495057',
  gray800:   '#212529',
  green:     '#1A6B35',
  greenBg:   '#EAF5EE',
};

// ─── Type badge colors ────────────────────────────────────────────────────────
const typeBadge = (type) => {
  const map = {
    BILLBOARD: { bg: '#DBEAFE', color: '#1E40AF' },
    UNIPOLE:   { bg: '#E0E7FF', color: '#4338CA' },
    HOARDING:  { bg: '#FEF3C7', color: '#92400E' },
    GANTRY:    { bg: '#D1FAE5', color: '#065F46' },
    OTHER:     { bg: '#F3F4F6', color: '#374151' },
  };
  return map[type] || map.OTHER;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  /* Cover page */
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.gray800,
    backgroundColor: C.white,
  },
  coverHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 50,
  },
  coverBrand: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  coverTag: { fontSize: 9, color: '#A8BDD4', marginTop: 4 },
  coverTitleWrap: {
    marginTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: C.gold,
  },
  coverTitle: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 4 },
  coverSubtitle: { fontSize: 11, color: '#A8BDD4', marginTop: 8, letterSpacing: 1 },
  coverBody: { paddingHorizontal: 40, paddingTop: 40 },
  coverInfoRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
  coverInfoBox: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 6,
    padding: 16,
    borderLeftWidth: 3,
  },
  coverInfoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  coverInfoText: { fontSize: 9, color: C.gray800, marginBottom: 3 },
  coverInfoMuted: { fontSize: 8, color: C.gray600 },
  coverSummaryRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  coverSummaryCard: {
    flex: 1,
    backgroundColor: C.navy,
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
  },
  coverSummaryValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.gold },
  coverSummaryLabel: { fontSize: 7, color: '#A8BDD4', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  coverFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverFooterText: { fontSize: 7, color: '#7FA3C0' },

  /* Asset pages */
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.gray800,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    backgroundColor: C.white,
  },
  assetHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 32,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetCode: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 1 },
  assetName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 2 },
  assetTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3 },
  assetTypeBadgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },

  assetBody: { paddingHorizontal: 32, paddingTop: 16 },

  /* Details grid */
  detailsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  detailBox: {
    flex: 1,
    backgroundColor: C.gray50,
    borderRadius: 4,
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: C.gold,
  },
  detailLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.gray800 },

  rateBox: {
    flex: 1,
    backgroundColor: C.goldBg,
    borderRadius: 4,
    padding: 10,
    borderTopWidth: 2,
    borderTopColor: C.gold,
  },
  rateValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy },

  /* Photo gallery */
  galleryTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: C.gold,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageCard: {
    width: '48%',
    marginBottom: 6,
  },
  assetImage: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: C.gray200,
  },
  imageCaption: { fontSize: 6.5, color: C.gray400, marginTop: 3, textAlign: 'center', fontStyle: 'italic' },
  noPhotos: { fontSize: 9, color: C.gray400, fontStyle: 'italic', textAlign: 'center', paddingVertical: 30 },

  /* Summary page */
  summaryPage: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: C.gray800,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    backgroundColor: C.white,
  },
  summaryHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  summaryTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 2 },
  summarySubtitle: { fontSize: 8, color: C.gold, marginTop: 3 },
  summaryBody: { paddingHorizontal: 32, paddingTop: 20 },

  /* Table */
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeadText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: C.gray200 },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: C.gray200, backgroundColor: C.gray50 },
  tableCell: { fontSize: 8, color: C.gray800 },
  tableCellBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray800 },

  totalRow: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  totalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.gold },

  /* Notes */
  notesBox: {
    marginTop: 20,
    backgroundColor: C.goldBg,
    borderRadius: 5,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
  },
  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 8, color: C.gray600, lineHeight: 1.5 },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.navy,
    paddingHorizontal: 32,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 6.5, color: '#7FA3C0' },
  footerBrand: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gold },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => v ? parseFloat(v).toLocaleString('en-IN') : '—';
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── Cover Page ───────────────────────────────────────────────────────────────
const CoverPage = ({ enquiry }) => {
  const assetCount = enquiry.enquiryAssets?.length || 0;
  const totalMonthly = enquiry.enquiryAssets?.reduce((sum, ea) => sum + parseFloat(ea.asset.monthlyRate || 0), 0) || 0;

  return (
    <Page size="A4" style={s.coverPage}>
      {/* Navy header */}
      <View style={s.coverHeader}>
        <Text style={s.coverBrand}>AdERP Media</Text>
        <Text style={s.coverTag}>Outdoor Advertising Solutions</Text>
        <View style={s.coverTitleWrap}>
          <Text style={s.coverTitle}>CAMPAIGN PROPOSAL</Text>
          <Text style={s.coverSubtitle}>Ref: {enquiry.enquiryNo} | Prepared on {fmtDate(new Date())}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={s.coverBody}>
        {/* Prospect & Campaign info */}
        <View style={s.coverInfoRow}>
          <View style={[s.coverInfoBox, { borderLeftColor: C.gold }]}>
            <Text style={s.coverInfoLabel}>Prepared For</Text>
            <Text style={[s.coverInfoText, { fontSize: 12, fontFamily: 'Helvetica-Bold' }]}>{enquiry.clientName}</Text>
            <Text style={s.coverInfoText}>{enquiry.contactPerson}</Text>
            <Text style={s.coverInfoMuted}>{enquiry.phone}{enquiry.email ? ` | ${enquiry.email}` : ''}</Text>
          </View>
          <View style={[s.coverInfoBox, { borderLeftColor: C.navy }]}>
            <Text style={s.coverInfoLabel}>Campaign Details</Text>
            <Text style={s.coverInfoText}>Period: {fmtDate(enquiry.startDate)} — {fmtDate(enquiry.endDate)}</Text>
            {enquiry.locationPreference && <Text style={s.coverInfoText}>Location: {enquiry.locationPreference}</Text>}
            {enquiry.budget && <Text style={s.coverInfoText}>Budget: Rs. {fmt(enquiry.budget)}</Text>}
            {enquiry.source && <Text style={s.coverInfoMuted}>Source: {enquiry.source}</Text>}
          </View>
        </View>

        {/* Summary cards */}
        <View style={s.coverSummaryRow}>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{assetCount}</Text>
            <Text style={s.coverSummaryLabel}>Locations</Text>
          </View>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>Rs. {fmt(totalMonthly)}</Text>
            <Text style={s.coverSummaryLabel}>Monthly Rate</Text>
          </View>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{fmtDate(enquiry.startDate)}</Text>
            <Text style={s.coverSummaryLabel}>Start Date</Text>
          </View>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{fmtDate(enquiry.endDate)}</Text>
            <Text style={s.coverSummaryLabel}>End Date</Text>
          </View>
        </View>

        {/* Requirement notes */}
        {enquiry.requirementNotes && (
          <View style={[s.notesBox, { marginTop: 24 }]}>
            <Text style={s.notesLabel}>Requirements</Text>
            <Text style={s.notesText}>{enquiry.requirementNotes}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={s.coverFooter}>
        <Text style={s.coverFooterText}>This proposal is confidential and intended solely for the named recipient.</Text>
        <Text style={s.coverFooterText}>Page 1</Text>
      </View>
    </Page>
  );
};

// ─── Asset Page ───────────────────────────────────────────────────────────────
const AssetPage = ({ ea, pageNum }) => {
  const asset = ea.asset;
  const tb = typeBadge(asset.type);
  const images = (asset.images || []).filter((img) => img.base64);

  return (
    <Page size="A4" style={s.page}>
      {/* Asset header bar */}
      <View style={s.assetHeader}>
        <View>
          <Text style={s.assetCode}>{asset.code}</Text>
          <Text style={s.assetName}>{asset.name}</Text>
        </View>
        <View style={[s.assetTypeBadge, { backgroundColor: tb.bg }]}>
          <Text style={[s.assetTypeBadgeText, { color: tb.color }]}>{asset.type}</Text>
        </View>
      </View>

      <View style={s.assetBody}>
        {/* Details grid - row 1 */}
        <View style={s.detailsRow}>
          <View style={s.detailBox}>
            <Text style={s.detailLabel}>Size (ft)</Text>
            <Text style={s.detailValue}>
              {asset.sizeWidth && asset.sizeHeight ? `${asset.sizeWidth} × ${asset.sizeHeight}` : '—'}
            </Text>
          </View>
          <View style={s.detailBox}>
            <Text style={s.detailLabel}>Location</Text>
            <Text style={s.detailValue}>{asset.locationCity || '—'}</Text>
            {asset.locationAddress && <Text style={{ fontSize: 7, color: C.gray600, marginTop: 2 }}>{asset.locationAddress}</Text>}
          </View>
          <View style={s.detailBox}>
            <Text style={s.detailLabel}>Zone</Text>
            <Text style={s.detailValue}>{asset.zone?.name || '—'}</Text>
          </View>
        </View>

        {/* Details grid - row 2 */}
        <View style={s.detailsRow}>
          <View style={s.detailBox}>
            <Text style={s.detailLabel}>Illumination</Text>
            <Text style={s.detailValue}>{asset.illumination || '—'}</Text>
          </View>
          <View style={s.detailBox}>
            <Text style={s.detailLabel}>Condition</Text>
            <Text style={s.detailValue}>{asset.condition || '—'}</Text>
          </View>
          <View style={s.rateBox}>
            <Text style={s.detailLabel}>Monthly Rate</Text>
            <Text style={s.rateValue}>Rs. {fmt(asset.monthlyRate)}</Text>
          </View>
        </View>

        {/* Photo gallery */}
        <Text style={s.galleryTitle}>Photo Gallery ({images.length} {images.length === 1 ? 'photo' : 'photos'})</Text>

        {images.length > 0 ? (
          <View style={s.imageGrid}>
            {images.map((img) => (
              <View key={img.id} style={s.imageCard}>
                <Image src={img.base64} style={s.assetImage} />
                {img.caption && <Text style={s.imageCaption}>{img.caption}</Text>}
                {img.isPrimary && <Text style={{ fontSize: 6, color: C.gold, fontFamily: 'Helvetica-Bold', marginTop: 1 }}>PRIMARY</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.noPhotos}>No photos available for this asset.</Text>
        )}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerBrand}>AdERP Media</Text>
        <Text style={s.footerText}>{asset.code} — {asset.name}</Text>
        <Text style={s.footerText}>Page {pageNum}</Text>
      </View>
    </Page>
  );
};

// ─── Summary Page ─────────────────────────────────────────────────────────────
const SummaryPage = ({ enquiry, pageNum }) => {
  const assets = enquiry.enquiryAssets || [];
  const totalMonthly = assets.reduce((sum, ea) => sum + parseFloat(ea.asset.monthlyRate || 0), 0);

  return (
    <Page size="A4" style={s.summaryPage}>
      <View style={s.summaryHeader}>
        <Text style={s.summaryTitle}>PRICING SUMMARY</Text>
        <Text style={s.summarySubtitle}>Campaign: {enquiry.enquiryNo} | {enquiry.clientName}</Text>
      </View>

      <View style={s.summaryBody}>
        {/* Table */}
        <View style={s.tableHead}>
          <Text style={[s.tableHeadText, { width: '8%' }]}>#</Text>
          <Text style={[s.tableHeadText, { width: '14%' }]}>Code</Text>
          <Text style={[s.tableHeadText, { width: '22%' }]}>Name</Text>
          <Text style={[s.tableHeadText, { width: '12%' }]}>Type</Text>
          <Text style={[s.tableHeadText, { width: '12%' }]}>Size (ft)</Text>
          <Text style={[s.tableHeadText, { width: '16%' }]}>Location</Text>
          <Text style={[s.tableHeadText, { width: '16%', textAlign: 'right' }]}>Rate/Month</Text>
        </View>

        {assets.map((ea, i) => {
          const a = ea.asset;
          const rowStyle = i % 2 === 1 ? s.tableRowAlt : s.tableRow;
          return (
            <View key={a.id} style={rowStyle}>
              <Text style={[s.tableCell, { width: '8%' }]}>{i + 1}</Text>
              <Text style={[s.tableCellBold, { width: '14%', color: C.navy }]}>{a.code}</Text>
              <Text style={[s.tableCell, { width: '22%' }]}>{a.name}</Text>
              <Text style={[s.tableCell, { width: '12%' }]}>{a.type}</Text>
              <Text style={[s.tableCell, { width: '12%' }]}>
                {a.sizeWidth && a.sizeHeight ? `${a.sizeWidth}×${a.sizeHeight}` : '—'}
              </Text>
              <Text style={[s.tableCell, { width: '16%' }]}>{a.locationCity || '—'}</Text>
              <Text style={[s.tableCellBold, { width: '16%', textAlign: 'right' }]}>Rs. {fmt(a.monthlyRate)}</Text>
            </View>
          );
        })}

        {/* Total row */}
        <View style={s.totalRow}>
          <Text style={[s.totalLabel, { flex: 1 }]}>Total Monthly Rate</Text>
          <Text style={s.totalValue}>Rs. {fmt(totalMonthly)}</Text>
        </View>

        {/* Notes */}
        {(enquiry.requirementNotes || enquiry.notes) && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notes</Text>
            {enquiry.requirementNotes && <Text style={s.notesText}>{enquiry.requirementNotes}</Text>}
            {enquiry.notes && <Text style={[s.notesText, { marginTop: 4 }]}>{enquiry.notes}</Text>}
          </View>
        )}

        {/* Terms */}
        <View style={{ marginTop: 20 }}>
          <Text style={[s.notesLabel, { marginBottom: 6 }]}>Terms & Conditions</Text>
          {[
            'Rates are exclusive of applicable taxes (GST @ 18%).',
            'Campaign dates are subject to asset availability at the time of confirmation.',
            'This proposal is valid for 15 days from the date of issue.',
            'Printing, mounting, and installation charges may apply separately.',
            'Advance payment required as per company policy before campaign commencement.',
          ].map((term, i) => (
            <Text key={i} style={{ fontSize: 7, color: C.gray600, marginBottom: 3, lineHeight: 1.4 }}>
              {i + 1}. {term}
            </Text>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerBrand}>AdERP Media</Text>
        <Text style={s.footerText}>Campaign Proposal — {enquiry.enquiryNo}</Text>
        <Text style={s.footerText}>Page {pageNum}</Text>
      </View>
    </Page>
  );
};

// ─── Main Document ────────────────────────────────────────────────────────────
const CampaignPDF = ({ enquiry }) => {
  const assets = enquiry.enquiryAssets || [];

  return (
    <Document>
      <CoverPage enquiry={enquiry} />
      {assets.map((ea, i) => (
        <AssetPage key={ea.asset.id} ea={ea} pageNum={i + 2} />
      ))}
      <SummaryPage enquiry={enquiry} pageNum={assets.length + 2} />
    </Document>
  );
};

export default CampaignPDF;
