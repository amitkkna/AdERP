import {
  Document, Page, Text, View, Image, StyleSheet,
} from '@react-pdf/renderer';

const C = {
  navy: '#0F2D52', navyLight: '#1A4070', gold: '#C8972A', goldBg: '#FFF8E8',
  white: '#FFFFFF', gray50: '#F8F9FA', gray100: '#F1F3F5', gray200: '#E9ECEF',
  gray400: '#868E96', gray600: '#495057', gray800: '#212529',
};

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

const s = StyleSheet.create({
  /* Cover page */
  coverPage: { fontFamily: 'Helvetica', fontSize: 9, color: C.gray800, backgroundColor: C.white },
  coverHeader: { backgroundColor: C.navy, paddingHorizontal: 40, paddingTop: 60, paddingBottom: 50 },
  coverBrand: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1 },
  coverTag: { fontSize: 9, color: '#A8BDD4', marginTop: 4 },
  coverTitleWrap: { marginTop: 30, paddingBottom: 20, borderBottomWidth: 3, borderBottomColor: C.gold },
  coverTitle: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 4 },
  coverSubtitle: { fontSize: 11, color: '#A8BDD4', marginTop: 8, letterSpacing: 1 },
  coverBody: { paddingHorizontal: 40, paddingTop: 40 },
  coverSummaryRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  coverSummaryCard: { flex: 1, backgroundColor: C.navy, borderRadius: 6, padding: 14, alignItems: 'center' },
  coverSummaryValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.gold },
  coverSummaryLabel: { fontSize: 7, color: '#A8BDD4', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  coverFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.navy, paddingHorizontal: 40, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between' },
  coverFooterText: { fontSize: 7, color: '#7FA3C0' },

  /* Asset page */
  page: { fontFamily: 'Helvetica', fontSize: 8, color: C.gray800, paddingTop: 0, paddingBottom: 36, paddingHorizontal: 0, backgroundColor: C.white },
  assetHeader: { backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetCode: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 1 },
  assetName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white, marginTop: 1 },
  assetTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  assetTypeBadgeText: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  assetBody: { paddingHorizontal: 24, paddingTop: 10 },

  /* Compact details — single row of 5 boxes */
  detailStrip: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  detailMini: { flex: 1, backgroundColor: C.gray50, borderRadius: 3, padding: 6, borderTopWidth: 1.5, borderTopColor: C.gold },
  detailLabel: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: C.gray400, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  detailValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray800 },

  /* 2x2 Photo Grid — bordered cells */
  gridRow: { flexDirection: 'row' },
  gridCell: { width: '50%', borderWidth: 1, borderColor: C.gray200 },
  gridImage: { width: '100%', height: 220, objectFit: 'cover' },
  gridCaption: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, paddingVertical: 6, paddingHorizontal: 8 },
  noPhotos: { fontSize: 9, color: C.gray400, fontStyle: 'italic', textAlign: 'center', paddingVertical: 30 },

  /* Footer */
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.navy, paddingHorizontal: 24, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 6, color: '#7FA3C0' },
  footerBrand: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.gold },
});

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CoverPage = ({ assets, campaignInfo }) => {
  return (
    <Page size="A4" style={s.coverPage}>
      <View style={s.coverHeader}>
        <Text style={s.coverBrand}>AdERP Media</Text>
        <Text style={s.coverTag}>Outdoor Advertising Solutions</Text>
        <View style={s.coverTitleWrap}>
          <Text style={s.coverTitle}>CAMPAIGN PROPOSAL</Text>
          <Text style={s.coverSubtitle}>Prepared on {fmtDate(new Date())}</Text>
        </View>
      </View>

      <View style={s.coverBody}>
        {campaignInfo?.clientName && (
          <View style={{ backgroundColor: C.gray50, borderRadius: 6, padding: 16, borderLeftWidth: 3, borderLeftColor: C.gold, marginBottom: 24 }}>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Prepared For</Text>
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.gray800 }}>{campaignInfo.clientName}</Text>
          </View>
        )}

        <View style={s.coverSummaryRow}>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{assets.length}</Text>
            <Text style={s.coverSummaryLabel}>Locations</Text>
          </View>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{assets.filter(a => a.type === 'BILLBOARD' || a.type === 'HOARDING').length}</Text>
            <Text style={s.coverSummaryLabel}>Billboards</Text>
          </View>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{[...new Set(assets.map(a => a.locationCity))].length}</Text>
            <Text style={s.coverSummaryLabel}>Cities</Text>
          </View>
          <View style={s.coverSummaryCard}>
            <Text style={s.coverSummaryValue}>{[...new Set(assets.map(a => a.zone?.name).filter(Boolean))].length}</Text>
            <Text style={s.coverSummaryLabel}>Zones</Text>
          </View>
        </View>
      </View>

      <View style={s.coverFooter}>
        <Text style={s.coverFooterText}>This proposal is confidential and intended solely for the named recipient.</Text>
        <Text style={s.coverFooterText}>Page 1</Text>
      </View>
    </Page>
  );
};

const AssetPage = ({ asset, pageNum }) => {
  const tb = typeBadge(asset.type);
  const images = (asset.images || []).filter((img) => img.base64).slice(0, 4);

  const row1 = images.slice(0, 2);
  const row2 = images.slice(2, 4);

  const defaultLabels = ['Front View', 'Left Angle', 'Right Angle', 'Close-up'];

  return (
    <Page size="A4" style={s.page}>
      {/* Compact header bar */}
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
        {/* Single row of compact detail boxes */}
        <View style={s.detailStrip}>
          <View style={s.detailMini}>
            <Text style={s.detailLabel}>Size (ft)</Text>
            <Text style={s.detailValue}>
              {asset.sizeWidth && asset.sizeHeight ? `${asset.sizeWidth} × ${asset.sizeHeight}` : '—'}
            </Text>
          </View>
          <View style={s.detailMini}>
            <Text style={s.detailLabel}>Location</Text>
            <Text style={s.detailValue}>{asset.locationCity || '—'}</Text>
          </View>
          <View style={s.detailMini}>
            <Text style={s.detailLabel}>Zone</Text>
            <Text style={s.detailValue}>{asset.zone?.name || '—'}</Text>
          </View>
          <View style={s.detailMini}>
            <Text style={s.detailLabel}>Illumination</Text>
            <Text style={s.detailValue}>{asset.illumination || '—'}</Text>
          </View>
          <View style={s.detailMini}>
            <Text style={s.detailLabel}>Facing</Text>
            <Text style={s.detailValue}>{asset.facing || '—'}</Text>
          </View>
        </View>

        {/* 2x2 Photo Grid */}
        {images.length > 0 ? (
          <View>
            {/* Row 1 */}
            <View style={s.gridRow}>
              <View style={s.gridCell}>
                <Image src={row1[0].base64} style={s.gridImage} />
                <Text style={s.gridCaption}>Description : {row1[0].caption || defaultLabels[0]}</Text>
              </View>
              <View style={s.gridCell}>
                {row1[1] ? (
                  <>
                    <Image src={row1[1].base64} style={s.gridImage} />
                    <Text style={s.gridCaption}>Description : {row1[1].caption || defaultLabels[1]}</Text>
                  </>
                ) : (
                  <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 8, color: C.gray400 }}>No image</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Row 2 */}
            <View style={s.gridRow}>
              <View style={s.gridCell}>
                {row2[0] ? (
                  <>
                    <Image src={row2[0].base64} style={s.gridImage} />
                    <Text style={s.gridCaption}>Description : {row2[0].caption || defaultLabels[2]}</Text>
                  </>
                ) : (
                  <>
                    <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 8, color: C.gray400 }}>No image</Text>
                    </View>
                    <Text style={s.gridCaption}>Description :</Text>
                  </>
                )}
              </View>
              <View style={s.gridCell}>
                {row2[1] ? (
                  <>
                    <Image src={row2[1].base64} style={s.gridImage} />
                    <Text style={s.gridCaption}>Description : {row2[1].caption || defaultLabels[3]}</Text>
                  </>
                ) : (
                  <>
                    <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 8, color: C.gray400 }}>No image</Text>
                    </View>
                    <Text style={s.gridCaption}>Description :</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        ) : (
          <Text style={s.noPhotos}>No photos available for this asset.</Text>
        )}
      </View>

      <View style={s.footer}>
        <Text style={s.footerBrand}>AdERP Media</Text>
        <Text style={s.footerText}>{asset.code} — {asset.name}</Text>
        <Text style={s.footerText}>Page {pageNum}</Text>
      </View>
    </Page>
  );
};

const AssetCampaignPDF = ({ assets, campaignInfo }) => (
  <Document>
    <CoverPage assets={assets} campaignInfo={campaignInfo} />
    {assets.map((asset, i) => (
      <AssetPage key={asset.id} asset={asset} pageNum={i + 2} />
    ))}
  </Document>
);

export default AssetCampaignPDF;
