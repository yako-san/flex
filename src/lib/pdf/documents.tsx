import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

// =============================================================================
// Inter font : open-source, full Unicode coverage (▸ ◆ 🚴 ⛑️ 💛 etc.) —
// la "Helvetica" par défaut de react-pdf est PDF Type 1 et ne supporte que
// les caractères Latin-1, ce qui casse les bullets et emojis.
// CDN rsms.me, fetched au runtime puis caché en mémoire.
// =============================================================================
Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://rsms.me/inter/font-files/Inter-Regular.otf',
      fontWeight: 400,
    },
    {
      src: 'https://rsms.me/inter/font-files/Inter-SemiBold.otf',
      fontWeight: 600,
    },
    {
      src: 'https://rsms.me/inter/font-files/Inter-Bold.otf',
      fontWeight: 700,
    },
    {
      src: 'https://rsms.me/inter/font-files/Inter-Italic.otf',
      fontStyle: 'italic',
    },
  ],
});

export type WorkshopInfo = {
  name: string;
  logoBase64?: string | null;
  fiscalEntity?: {
    raisonSociale?: string;
    tagline?: string;
    adresseLigne1?: string;
    adresseLigne2?: string;
    ville?: string;
    province?: string;
    codePostal?: string;
    pays?: string;
    telephone?: string;
    courriel?: string;
    siteWeb?: string;
    neq?: string;
    tps?: string;
    tvq?: string;
    footerText?: string;
  } | null;
};

export type ClientInfo = {
  prenom: string;
  nom: string;
  telephone: string | null;
  indicatif: string | null;
  courriel: string | null;
};

export type VeloInfo = {
  veloNumero: number;
  marque: string | null;
  modele: string | null;
  couleur: string | null;
  taille: string | null;
  numeroSerie: string | null;
};

export type ItemRow = {
  position: number;
  kind: 'SERVICE' | 'PIECE' | 'FORFAIT';
  label: string;
  sku: string | null;
  qty: number;
  unitPrice: number;
  total: number;
};

const COLORS = {
  text: '#1a1a1a',
  muted: '#666',
  light: '#999',
  border: '#1a1a1a',
  borderLight: '#dadada',
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 36,
    fontSize: 9,
    fontFamily: 'Inter',
    color: COLORS.text,
  },

  // === Header (logo + meta) ===
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoBlock: { width: 110 },
  logoImage: { width: 90, height: 90, objectFit: 'contain' },
  metaBlock: { textAlign: 'right' },
  metaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 4,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 1,
  },

  // === Workshop info under logo ===
  workshopBlock: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workshopBlockLeft: { flex: 1 },
  workshopName: { fontSize: 9.5, fontWeight: 700, color: COLORS.text },
  workshopTagline: { fontSize: 9, color: COLORS.muted, marginBottom: 8 },
  workshopAddrLine: { fontSize: 9, marginTop: 1 },

  // === Items sections ===
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 6,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    fontSize: 7.5,
    color: COLORS.muted,
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: `0.3pt solid ${COLORS.borderLight}`,
    fontSize: 9,
    alignItems: 'flex-start',
  },
  bullet: { width: 10, fontSize: 8 },
  itemLabel: { flex: 1, paddingRight: 8 },
  itemSku: { fontSize: 7.5, color: COLORS.muted, marginTop: 1 },
  numCol: { width: 50, textAlign: 'right' },
  qtyCol: { width: 32, textAlign: 'right' },

  // === Footer 2 cols (text left + totals right) ===
  footerBlock: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
  },
  footerLeft: { flex: 2 },
  footerRight: { width: 200 },
  footerText: { fontSize: 7, color: COLORS.muted, lineHeight: 1.35, marginTop: 4 },
  footerImportant: { fontSize: 8.5, color: COLORS.text, marginTop: 8 },
  footerSmall: { fontSize: 7, color: COLORS.muted, marginTop: 2 },

  // === Totals ===
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
    fontSize: 9,
  },
  totalLabel: { color: COLORS.text },
  totalValue: { fontFamily: 'Inter' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 4,
    marginTop: 4,
    borderTop: `0.5pt solid ${COLORS.text}`,
    fontSize: 11,
    fontWeight: 700,
  },

  // === Bottom corners ===
  versionLabel: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    fontSize: 6.5,
    color: COLORS.light,
  },
  thanksLabel: {
    position: 'absolute',
    bottom: 16,
    right: 36,
    fontSize: 8,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
});

// =============================================================================
// Composants partagés
// =============================================================================

function LogoBox({ workshop }: { workshop: WorkshopInfo }) {
  if (workshop.logoBase64) {
    return (
      <View style={styles.logoBlock}>
        <Image src={workshop.logoBase64} style={styles.logoImage} />
      </View>
    );
  }
  // Fallback : carré jaune avec nom workshop (placeholder en l'absence de logo)
  return (
    <View
      style={{
        width: 90,
        height: 90,
        backgroundColor: '#fcd900',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
        {workshop.name}
      </Text>
    </View>
  );
}

function MetaBlock({
  docLabel,
  docDate,
  docNumberLabel,
  docNumber,
  client,
  velo,
}: {
  docLabel: string;
  docDate: string;
  docNumberLabel: string;
  docNumber: string;
  client: ClientInfo;
  velo: VeloInfo | null;
}) {
  const veloLine = velo
    ? [velo.marque, velo.modele, velo.couleur, velo.taille].filter(Boolean).join(', ') || '—'
    : null;
  const clientLine = `${client.prenom} ${client.nom}`.trim() || '—';
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.metaLabel}>{docLabel}</Text>
      <Text style={styles.metaValue}>{docDate}</Text>

      <Text style={styles.metaLabel}>{docNumberLabel}</Text>
      <Text style={styles.metaValue}>{docNumber}</Text>

      {veloLine ? (
        <>
          <Text style={styles.metaLabel}>vélo</Text>
          <Text style={styles.metaValue}>{veloLine}</Text>
        </>
      ) : null}

      <Text style={styles.metaLabel}>client</Text>
      <Text style={styles.metaValue}>{clientLine}</Text>

      {client.courriel ? (
        <>
          <Text style={styles.metaLabel}>contact</Text>
          <Text style={styles.metaValue}>{client.courriel}</Text>
        </>
      ) : null}
    </View>
  );
}

function WorkshopBlock({ workshop }: { workshop: WorkshopInfo }) {
  const f = workshop.fiscalEntity ?? {};
  const cityLine = [f.ville, f.province, f.codePostal].filter(Boolean).join(' ');
  return (
    <View style={styles.workshopBlock}>
      <View style={styles.workshopBlockLeft}>
        {f.raisonSociale ? <Text style={styles.workshopName}>{f.raisonSociale}</Text> : null}
        {f.tagline ? <Text style={styles.workshopTagline}>{f.tagline}</Text> : null}
        {f.adresseLigne1 ? <Text style={styles.workshopAddrLine}>{f.adresseLigne1}</Text> : null}
        {f.adresseLigne2 ? <Text style={styles.workshopAddrLine}>{f.adresseLigne2}</Text> : null}
        {cityLine ? <Text style={styles.workshopAddrLine}>{cityLine}</Text> : null}
        {f.courriel ? (
          <Text style={[styles.workshopAddrLine, { marginTop: 6 }]}>{f.courriel}</Text>
        ) : null}
        {f.telephone ? <Text style={styles.workshopAddrLine}>{f.telephone}</Text> : null}
      </View>
    </View>
  );
}

function ItemSection({
  title,
  bullet,
  items,
  hidePrices,
}: {
  title: string;
  bullet: string;
  items: ItemRow[];
  hidePrices?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.bullet}> </Text>
        <Text style={styles.itemLabel}> </Text>
        {!hidePrices ? <Text style={styles.numCol}>unitaire</Text> : null}
        {!hidePrices ? <Text style={styles.qtyCol}>qté</Text> : null}
        {!hidePrices ? <Text style={styles.numCol}>prix</Text> : null}
      </View>
      {items.map((it, i) => (
        <View key={i} style={styles.itemRow}>
          <Text style={styles.bullet}>{bullet}</Text>
          <View style={styles.itemLabel}>
            <Text>{it.label}</Text>
            {it.sku ? <Text style={styles.itemSku}>SKU {it.sku}</Text> : null}
          </View>
          {!hidePrices ? (
            <Text style={styles.numCol}>{it.unitPrice.toFixed(2)} $</Text>
          ) : null}
          {!hidePrices ? <Text style={styles.qtyCol}>{it.qty}</Text> : null}
          {!hidePrices ? (
            <Text style={styles.numCol}>{it.total.toFixed(2)} $</Text>
          ) : null}
        </View>
      ))}
    </>
  );
}

function FooterTextLeft({
  workshop,
  modePaiement,
}: {
  workshop: WorkshopInfo;
  modePaiement?: string | null;
}) {
  const f = workshop.fiscalEntity ?? {};
  return (
    <View>
      <Text style={styles.footerText}>
        Les retours considérés dans les trente jours suivant l&apos;achat. Retours pour
        crédit seulement. Les articles retournés seront crédités moyennant des frais de
        15 % de remise en stock. Les items ouverts ou utilisés ne peuvent être retournés.
        Les articles soldés ne peuvent être retournés. Le prix des articles en commande
        spéciale est sujet à changer entre la date de la commande et de la réception de
        l&apos;article et sera facturé au prix le plus récent.
      </Text>
      <Text style={[styles.footerText, { marginTop: 8 }]}>
        Returns must be made within thirty days of purchase. Returns are accepted for
        store credit only. Returned items will be credited minus a 15 % restocking fee.
        Opened or used items cannot be returned. Sale items cannot be returned. The price
        of special-order items is subject to change between the date of order and the
        date of receipt, and will be billed at the most recent price.
      </Text>
      <Text style={[styles.footerText, { marginTop: 10 }]}>
        T.P.S : {f.tps ?? '...'}
      </Text>
      <Text style={styles.footerText}>T.V.Q : {f.tvq ?? '...'}</Text>

      {f.footerText ? (
        <Text style={styles.footerImportant}>{f.footerText}</Text>
      ) : (
        <>
          <Text style={styles.footerImportant}>
            Le paiement se fera lors du retrait ou avant
            {f.telephone ? `, par interac* au ${f.telephone}` : ''}. merci 💛
          </Text>
          <Text style={styles.footerSmall}>
            * (comptant ou Interac) sont les deux seules méthodes pour éviter les frais
            de service. Les pourboires sont acceptés.
          </Text>
        </>
      )}

      {modePaiement ? (
        <Text style={[styles.footerText, { marginTop: 8 }]}>
          Mode de paiement : {modePaiement.toLowerCase()}.
        </Text>
      ) : null}
    </View>
  );
}

// =============================================================================
// Évaluation : devis à approuver, totaux HT, sans taxes
// =============================================================================
export function EvalPdf({
  workshop,
  client,
  velo,
  bdcId,
  date,
  items,
  totalServices,
  totalPieces,
  remises = 0,
  notes,
}: {
  workshop: WorkshopInfo;
  client: ClientInfo;
  velo: VeloInfo;
  bdcId: string;
  date: Date;
  items: ItemRow[];
  totalServices: number;
  totalPieces: number;
  remises?: number;
  notes: string | null;
}): ReactElement {
  const services = items.filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT');
  const pieces = items.filter((it) => it.kind === 'PIECE');
  const sousTotal = totalServices + totalPieces - remises;
  const dateStr = date.toLocaleDateString('fr-CA');
  const bdcShort = bdcId.slice(-4);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <LogoBox workshop={workshop} />
          <MetaBlock
            docLabel="évaluation"
            docDate={dateStr}
            docNumberLabel="bon de travail"
            docNumber={bdcShort}
            client={client}
            velo={velo}
          />
        </View>

        <WorkshopBlock workshop={workshop} />

        <ItemSection title="Services" bullet="▸" items={services} />
        <ItemSection title="Pièces" bullet="◆" items={pieces} />

        <View style={styles.footerBlock}>
          <View style={styles.footerLeft}>
            {notes ? (
              <Text style={[styles.footerText, { marginBottom: 8 }]}>{notes}</Text>
            ) : null}
            <Text style={styles.footerImportant}>
              Cette évaluation est valable 30 jours. Les taxes seront ajoutées à la
              facturation finale.
            </Text>
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 8 }}>Approuvé par le client (signature) :</Text>
              <View
                style={{
                  borderBottom: `0.5pt solid ${COLORS.text}`,
                  height: 22,
                  marginTop: 6,
                  width: 240,
                }}
              />
            </View>
          </View>
          <View style={styles.footerRight}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total services</Text>
              <Text style={styles.totalValue}>{totalServices.toFixed(2)} $</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total pièces</Text>
              <Text style={styles.totalValue}>{totalPieces.toFixed(2)} $</Text>
            </View>
            {remises > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remises</Text>
                <Text style={styles.totalValue}>−{remises.toFixed(2)} $</Text>
              </View>
            ) : null}
            <View style={styles.grandTotalRow}>
              <Text>Total estimé HT</Text>
              <Text>{sousTotal.toFixed(2)} $</Text>
            </View>
          </View>
        </View>

        <Text style={styles.versionLabel} fixed>
          modèle v2,5
        </Text>
        <Text style={styles.thanksLabel} fixed>
          Merci et bonne route 🚴
        </Text>
      </Page>
    </Document>
  );
}

// =============================================================================
// Bon de sortie : version interne avec sous-tâches DONE
// =============================================================================
export function BonSortiePdf({
  workshop,
  client,
  velo,
  bdcId,
  date,
  items,
  tasksByItem,
}: {
  workshop: WorkshopInfo;
  client: ClientInfo;
  velo: VeloInfo;
  bdcId: string;
  date: Date;
  items: ItemRow[];
  tasksByItem: Record<number, { label: string; status: string }[]>;
}): ReactElement {
  const services = items.filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT');
  const pieces = items.filter((it) => it.kind === 'PIECE');

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <LogoBox workshop={workshop} />
          <MetaBlock
            docLabel="récap atelier"
            docDate={date.toLocaleDateString('fr-CA')}
            docNumberLabel="bon de travail"
            docNumber={bdcId.slice(-4)}
            client={client}
            velo={velo}
          />
        </View>

        <WorkshopBlock workshop={workshop} />

        <ItemSection title="Services" bullet="▸" items={services} hidePrices />
        <ItemSection title="Pièces" bullet="◆" items={pieces} hidePrices />

        {items
          .filter((it) => (tasksByItem[it.position] ?? []).length > 0)
          .map((it) => (
            <View key={it.position} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: 700 }}>{it.label}</Text>
              {(tasksByItem[it.position] ?? []).map((t, idx) => (
                <Text key={idx} style={{ fontSize: 8, color: COLORS.muted, marginTop: 1 }}>
                  {t.status === 'DONE' ? '✓' : t.status === 'SKIPPED' ? '−' : '○'}{' '}
                  {t.label}
                </Text>
              ))}
            </View>
          ))}

        <Text style={styles.versionLabel} fixed>
          modèle v2,5
        </Text>
        <Text style={styles.thanksLabel} fixed>
          Merci et bonne route 🚴
        </Text>
      </Page>
    </Document>
  );
}

// =============================================================================
// Facture : avec TPS/TVQ Québec, immutable, factureNumero séquentiel
// =============================================================================
export function FacturePdf({
  workshop,
  client,
  velo,
  factureNumero,
  date,
  items,
  totals,
  modePaiement,
  notes,
}: {
  workshop: WorkshopInfo;
  client: ClientInfo;
  velo: VeloInfo | null;
  factureNumero: string;
  date: Date;
  items: ItemRow[];
  totals: {
    totalServices: number;
    totalPieces: number;
    remises?: number;
    sousTotal: number;
    tps: number;
    tvq: number;
    grandTotal: number;
  };
  modePaiement: string | null;
  notes: string | null;
}): ReactElement {
  const services = items.filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT');
  const pieces = items.filter((it) => it.kind === 'PIECE');
  const dateStr = date.toLocaleDateString('fr-CA');
  const remises = totals.remises ?? 0;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <LogoBox workshop={workshop} />
          <MetaBlock
            docLabel="reçu de vente"
            docDate={dateStr}
            docNumberLabel="facture"
            docNumber={factureNumero}
            client={client}
            velo={velo}
          />
        </View>

        <WorkshopBlock workshop={workshop} />

        <ItemSection title="Services" bullet="▸" items={services} />
        <ItemSection title="Pièces" bullet="◆" items={pieces} />

        <View style={styles.footerBlock}>
          <View style={styles.footerLeft}>
            <FooterTextLeft workshop={workshop} modePaiement={modePaiement} />
            {notes ? (
              <Text style={[styles.footerText, { marginTop: 8 }]}>{notes}</Text>
            ) : null}
          </View>
          <View style={styles.footerRight}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>{totals.sousTotal.toFixed(2)} $</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Remises</Text>
              <Text style={styles.totalValue}>{remises.toFixed(2)} $</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>T.P.S (5 %)</Text>
              <Text style={styles.totalValue}>{totals.tps.toFixed(2)} $</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>T.V.Q (9,975 %)</Text>
              <Text style={styles.totalValue}>{totals.tvq.toFixed(2)} $</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: COLORS.muted }]}>
                Total des taxes
              </Text>
              <Text style={styles.totalValue}>
                {(totals.tps + totals.tvq).toFixed(2)} $
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text>Total</Text>
              <Text>{totals.grandTotal.toFixed(2)} $</Text>
            </View>
          </View>
        </View>

        <Text style={styles.versionLabel} fixed>
          modèle v2,5
        </Text>
        <Text style={styles.thanksLabel} fixed>
          Merci et bonne route 🚴
        </Text>
      </Page>
    </Document>
  );
}
