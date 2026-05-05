import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

export type WorkshopInfo = {
  name: string;
  logoBase64?: string | null;
  fiscalEntity?: {
    raisonSociale?: string;
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

// =============================================================================
// Styles — inspiré du modèle v1 yako-cyclo (header logo+meta, sections SERVICES
// et PIÈCES avec puces, totaux right-aligned)
// =============================================================================
const COLORS = {
  text: '#1a1a1a',
  muted: '#666',
  light: '#999',
  border: '#ccc',
  borderLight: '#eee',
  bg: '#fafafa',
  accent: '#fcd900', // jaune yako (à remplacer par couleur de marque user)
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: COLORS.text },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoBox: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoText: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    color: COLORS.text,
  },
  logoSub: {
    fontSize: 5,
    textAlign: 'center',
    color: COLORS.text,
    marginTop: 2,
  },
  metaBlock: { textAlign: 'right' },
  metaLabel: {
    fontSize: 7.5,
    color: COLORS.muted,
    textTransform: 'lowercase',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
  },
  metaValueSmall: { fontSize: 9, fontWeight: 700, marginBottom: 6 },
  addressBlock: { marginTop: 12, marginBottom: 18 },
  addressLine: { fontSize: 8.5, color: COLORS.text, marginBottom: 1 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 3,
    fontSize: 7.5,
    color: COLORS.muted,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottom: `0.3pt solid ${COLORS.borderLight}`,
    fontSize: 9,
    alignItems: 'flex-start',
  },
  bullet: { width: 12, fontSize: 7 },
  itemLabel: { flex: 1, paddingRight: 8 },
  itemSku: { fontSize: 7, color: COLORS.muted, marginTop: 1 },
  numCol: { width: 50, textAlign: 'right' },
  qtyCol: { width: 30, textAlign: 'right' },
  totalsBlock: { marginTop: 16, alignSelf: 'flex-end', minWidth: 220 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 9,
  },
  totalLabel: { color: COLORS.text },
  totalValue: { fontFamily: 'Helvetica' },
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
  footer: {
    marginTop: 28,
    paddingTop: 8,
    fontSize: 7,
    color: COLORS.light,
  },
  footerLine: { marginTop: 2 },
  versionLabel: {
    position: 'absolute',
    bottom: 16,
    right: 36,
    fontSize: 6.5,
    color: COLORS.light,
  },
});

// =============================================================================
// Composants partagés
// =============================================================================

function LogoBox({ workshop }: { workshop: WorkshopInfo }) {
  if (workshop.logoBase64) {
    return (
      <View style={{ width: 80, height: 80 }}>
        <Image
          src={workshop.logoBase64}
          style={{ width: 80, height: 80, objectFit: 'contain' }}
        />
      </View>
    );
  }
  // Fallback : carré jaune avec nom de workshop (placeholder en l'absence de logo)
  return (
    <View style={styles.logoBox}>
      <Text style={styles.logoText}>{workshop.name}</Text>
      {workshop.fiscalEntity?.raisonSociale ? (
        <Text style={styles.logoSub} wrap={false}>
          {workshop.fiscalEntity.raisonSociale}
        </Text>
      ) : null}
    </View>
  );
}

function MetaBlock({
  docLabel,
  docDate,
  bdcLabel,
  bdcId,
  client,
  velo,
}: {
  docLabel: string;
  docDate: string;
  bdcLabel: string;
  bdcId: string;
  client: ClientInfo;
  velo: VeloInfo | null;
}) {
  const veloLine = velo
    ? [velo.marque, velo.modele, velo.couleur, velo.taille].filter(Boolean).join(', ') || '—'
    : null;
  return (
    <View style={styles.metaBlock}>
      <Text style={styles.metaLabel}>{docLabel}</Text>
      <Text style={styles.metaValueSmall}>{docDate}</Text>

      <Text style={styles.metaLabel}>{bdcLabel}</Text>
      <Text style={styles.metaValue}>{bdcId}</Text>

      <Text style={styles.metaLabel}>client</Text>
      <Text style={styles.metaValueSmall}>
        {client.prenom} {client.nom}
      </Text>

      {client.courriel ? (
        <>
          <Text style={styles.metaLabel}>contact</Text>
          <Text style={styles.metaValueSmall}>{client.courriel}</Text>
        </>
      ) : null}

      {veloLine ? (
        <>
          <Text style={styles.metaLabel}>vélo</Text>
          <Text style={styles.metaValueSmall}>{veloLine}</Text>
        </>
      ) : null}
    </View>
  );
}

function AddressBlock({ workshop }: { workshop: WorkshopInfo }) {
  const f = workshop.fiscalEntity ?? {};
  const lignes: string[] = [];
  if (f.adresseLigne1) lignes.push(f.adresseLigne1);
  if (f.adresseLigne2) lignes.push(f.adresseLigne2);
  const cityLine = [f.ville, f.province, f.codePostal].filter(Boolean).join(' ');
  if (cityLine) lignes.push(cityLine);
  if (f.courriel) lignes.push(f.courriel);
  if (f.telephone) lignes.push(f.telephone);

  if (lignes.length === 0) return null;
  return (
    <View style={styles.addressBlock}>
      {lignes.map((line, i) => (
        <Text key={i} style={styles.addressLine}>
          {line}
        </Text>
      ))}
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

function FiscalFooter({
  workshop,
  modePaiement,
}: {
  workshop: WorkshopInfo;
  modePaiement?: string | null;
}) {
  const f = workshop.fiscalEntity ?? {};
  return (
    <View style={styles.footer}>
      <Text style={styles.footerLine}>
        Returns must be made within thirty days of purchase. Returns are accepted for
        store credit only. Returned items will be credited minus a 15% restocking fee.
        Opened or used items cannot be returned. Sale items cannot be returned. The price
        of special-order items is subject to change between the date of order and the date
        of receipt, and will be billed at the most recent price.
      </Text>
      <Text style={[styles.footerLine, { marginTop: 8 }]}>
        T.P.S : {f.tps ?? '...'}
      </Text>
      <Text style={styles.footerLine}>T.V.Q : {f.tvq ?? '...'}</Text>
      {modePaiement ? (
        <Text style={[styles.footerLine, { marginTop: 6 }]}>
          Paiement par {modePaiement.toLowerCase()}.
        </Text>
      ) : null}
      {f.footerText ? (
        <Text style={[styles.footerLine, { marginTop: 6 }]}>{f.footerText}</Text>
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
  notes: string | null;
}): ReactElement {
  const services = items.filter((it) => it.kind === 'SERVICE' || it.kind === 'FORFAIT');
  const pieces = items.filter((it) => it.kind === 'PIECE');
  const total = totalServices + totalPieces;
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
            bdcLabel="bon de travail"
            bdcId={bdcShort}
            client={client}
            velo={velo}
          />
        </View>

        <AddressBlock workshop={workshop} />

        <ItemSection title="Services" bullet="▸" items={services} />
        <ItemSection title="Pièces" bullet="◆" items={pieces} />

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total services</Text>
            <Text style={styles.totalValue}>{totalServices.toFixed(2)} $</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total pièces</Text>
            <Text style={styles.totalValue}>{totalPieces.toFixed(2)} $</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Total estimé HT</Text>
            <Text>{total.toFixed(2)} $</Text>
          </View>
          <Text
            style={{ fontSize: 7, color: COLORS.muted, marginTop: 4, textAlign: 'right' }}
          >
            Les taxes seront ajoutées à la facturation.
          </Text>
        </View>

        {notes ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 8, color: COLORS.muted }}>{notes}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 8 }}>Approuvé par le client (signature) :</Text>
          <View
            style={{ borderBottom: `0.5pt solid ${COLORS.text}`, height: 24, marginTop: 6 }}
          />
        </View>

        <FiscalFooter workshop={workshop} />

        <Text style={styles.versionLabel} fixed>
          modèle éval. v1 (Flex v2)
        </Text>
      </Page>
    </Document>
  );
}

// =============================================================================
// Bon de sortie : version interne avec sous-tâches DONE
// (pas envoyé au client en v1 — gardé optionnel pour usage atelier)
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
            bdcLabel="bon de travail"
            bdcId={bdcId.slice(-4)}
            client={client}
            velo={velo}
          />
        </View>

        <AddressBlock workshop={workshop} />

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

        <FiscalFooter workshop={workshop} />

        <Text style={styles.versionLabel} fixed>
          modèle récap. v1 (Flex v2)
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

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <LogoBox workshop={workshop} />
          <MetaBlock
            docLabel="reçu de vente"
            docDate={dateStr}
            bdcLabel="facture"
            bdcId={factureNumero}
            client={client}
            velo={velo}
          />
        </View>

        <AddressBlock workshop={workshop} />

        <ItemSection title="Services" bullet="▸" items={services} />
        <ItemSection title="Pièces" bullet="◆" items={pieces} />

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{totals.sousTotal.toFixed(2)} $</Text>
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

        {notes ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 8, color: COLORS.muted }}>{notes}</Text>
          </View>
        ) : null}

        <FiscalFooter workshop={workshop} modePaiement={modePaiement} />

        <Text style={styles.versionLabel} fixed>
          modèle facture v1 (Flex v2)
        </Text>
      </Page>
    </Document>
  );
}
