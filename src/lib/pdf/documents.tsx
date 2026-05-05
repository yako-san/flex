import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

export type WorkshopInfo = {
  name: string;
  fiscalEntity?: {
    raisonSociale?: string;
    neq?: string;
    tps?: string;
    tvq?: string;
    adresse?: string;
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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    borderBottom: '1pt solid #ccc',
    paddingBottom: 12,
  },
  workshopBox: { flex: 1 },
  workshopName: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  smallText: { fontSize: 9, color: '#555' },
  docTitle: { fontSize: 18, fontWeight: 700, textAlign: 'right' },
  docMeta: { fontSize: 9, color: '#555', textAlign: 'right', marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 9,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  fieldLabel: { fontSize: 9, color: '#666' },
  fieldValue: { fontSize: 11, marginTop: 1 },
  table: { marginTop: 16, borderTop: '1pt solid #ccc' },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #eee',
    paddingVertical: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontWeight: 700,
    fontSize: 9,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cell: { paddingHorizontal: 4 },
  cellPos: { width: 20 },
  cellKind: { width: 50 },
  cellLabel: { flex: 1 },
  cellQty: { width: 40, textAlign: 'right' },
  cellPrice: { width: 60, textAlign: 'right' },
  cellTotal: { width: 60, textAlign: 'right', fontWeight: 700 },
  totals: { marginTop: 12, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginTop: 2 },
  totalLabel: { width: 120, textAlign: 'right', color: '#666', paddingRight: 8 },
  totalValue: { width: 80, textAlign: 'right', fontWeight: 700 },
  grandTotal: {
    fontSize: 13,
    fontWeight: 700,
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  notes: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#fafafa',
    fontSize: 9,
    color: '#444',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
    borderTop: '0.5pt solid #ddd',
    paddingTop: 6,
  },
});

function PdfHeader({
  workshop,
  docTitle,
  docMeta,
}: {
  workshop: WorkshopInfo;
  docTitle: string;
  docMeta: string;
}) {
  const f = workshop.fiscalEntity ?? {};
  return (
    <View style={styles.header}>
      <View style={styles.workshopBox}>
        <Text style={styles.workshopName}>{workshop.name}</Text>
        {f.raisonSociale ? <Text style={styles.smallText}>{f.raisonSociale}</Text> : null}
        {f.adresse ? <Text style={styles.smallText}>{f.adresse}</Text> : null}
        {f.neq ? <Text style={styles.smallText}>NEQ : {f.neq}</Text> : null}
        {f.tps ? <Text style={styles.smallText}>TPS : {f.tps}</Text> : null}
        {f.tvq ? <Text style={styles.smallText}>TVQ : {f.tvq}</Text> : null}
      </View>
      <View>
        <Text style={styles.docTitle}>{docTitle}</Text>
        <Text style={styles.docMeta}>{docMeta}</Text>
      </View>
    </View>
  );
}

function VeloClientBlock({
  client,
  velo,
}: {
  client: ClientInfo;
  velo: VeloInfo;
}) {
  const veloLine = [velo.marque, velo.modele, velo.couleur, velo.taille].filter(Boolean).join(', ') || '—';
  return (
    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.sectionTitle}>Client</Text>
        <Text style={styles.fieldValue}>
          {client.prenom} {client.nom}
        </Text>
        {client.telephone ? (
          <Text style={styles.smallText}>
            {client.indicatif ?? ''} {client.telephone}
          </Text>
        ) : null}
        {client.courriel ? <Text style={styles.smallText}>{client.courriel}</Text> : null}
      </View>
      <View style={styles.col}>
        <Text style={styles.sectionTitle}>Vélo n° {String(velo.veloNumero).padStart(4, '0')}</Text>
        <Text style={styles.fieldValue}>{veloLine}</Text>
        {velo.numeroSerie ? <Text style={styles.smallText}>S/N : {velo.numeroSerie}</Text> : null}
      </View>
    </View>
  );
}

function ItemsTable({ items, hideTotal = false }: { items: ItemRow[]; hideTotal?: boolean }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.cellPos]}>#</Text>
        <Text style={[styles.cell, styles.cellKind]}>Type</Text>
        <Text style={[styles.cell, styles.cellLabel]}>Description</Text>
        <Text style={[styles.cell, styles.cellQty]}>Qté</Text>
        {!hideTotal ? <Text style={[styles.cell, styles.cellPrice]}>P.U.</Text> : null}
        {!hideTotal ? <Text style={[styles.cell, styles.cellTotal]}>Total</Text> : null}
      </View>
      {items.map((it) => (
        <View key={it.position} style={styles.tableRow}>
          <Text style={[styles.cell, styles.cellPos]}>{it.position}</Text>
          <Text style={[styles.cell, styles.cellKind]}>{it.kind}</Text>
          <View style={[styles.cell, styles.cellLabel]}>
            <Text>{it.label}</Text>
            {it.sku ? <Text style={styles.smallText}>SKU {it.sku}</Text> : null}
          </View>
          <Text style={[styles.cell, styles.cellQty]}>{it.qty}</Text>
          {!hideTotal ? <Text style={[styles.cell, styles.cellPrice]}>{it.unitPrice.toFixed(2)}</Text> : null}
          {!hideTotal ? <Text style={[styles.cell, styles.cellTotal]}>{it.total.toFixed(2)}</Text> : null}
        </View>
      ))}
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
  const total = totalServices + totalPieces;
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          workshop={workshop}
          docTitle="Évaluation"
          docMeta={`BDT ${bdcId.slice(-6)} · ${date.toLocaleDateString('fr-CA')}`}
        />
        <VeloClientBlock client={client} velo={velo} />
        <ItemsTable items={items} />
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Services</Text>
            <Text style={styles.totalValue}>{totalServices.toFixed(2)} $</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pièces</Text>
            <Text style={styles.totalValue}>{totalPieces.toFixed(2)} $</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total estimé HT : {total.toFixed(2)} $</Text>
          </View>
        </View>
        {notes ? (
          <View style={styles.notes}>
            <Text>{notes}</Text>
          </View>
        ) : null}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.smallText}>
            Cette évaluation est valable 30 jours. Les taxes seront appliquées à la facturation.
          </Text>
          <Text style={[styles.smallText, { marginTop: 12 }]}>Approuvé par le client (signature) :</Text>
          <View style={{ borderBottom: '1pt solid #999', height: 30, marginTop: 8 }} />
        </View>
        <Text style={styles.footer} fixed>
          {workshop.name} · Évaluation {bdcId.slice(-6)}
        </Text>
      </Page>
    </Document>
  );
}

// =============================================================================
// Bon de sortie : récap travaux effectués, sous-tâches DONE
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
  tasksByItem: Record<number, { label: string; status: string }[]>; // keyed by position
}): ReactElement {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          workshop={workshop}
          docTitle="Bon de sortie"
          docMeta={`BDT ${bdcId.slice(-6)} · ${date.toLocaleDateString('fr-CA')}`}
        />
        <VeloClientBlock client={client} velo={velo} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travaux réalisés</Text>
        </View>
        <ItemsTable items={items} hideTotal />

        <View style={styles.section}>
          {items
            .filter((it) => (tasksByItem[it.position] ?? []).length > 0)
            .map((it) => (
              <View key={it.position} style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 700 }}>{it.label}</Text>
                {(tasksByItem[it.position] ?? []).map((t, idx) => (
                  <Text key={idx} style={styles.smallText}>
                    {t.status === 'DONE' ? '✓' : t.status === 'SKIPPED' ? '−' : '○'} {t.label}
                  </Text>
                ))}
              </View>
            ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.smallText}>
            Vélo prêt à être récupéré. Vérifiez l&apos;état avant de quitter l&apos;atelier.
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          {workshop.name} · Bon de sortie {bdcId.slice(-6)}
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
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          workshop={workshop}
          docTitle="Facture"
          docMeta={`${factureNumero} · ${date.toLocaleDateString('fr-CA')}`}
        />
        {velo ? (
          <VeloClientBlock client={client} velo={velo} />
        ) : (
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Client</Text>
              <Text style={styles.fieldValue}>
                {client.prenom} {client.nom}
              </Text>
              {client.courriel ? <Text style={styles.smallText}>{client.courriel}</Text> : null}
            </View>
          </View>
        )}
        <ItemsTable items={items} />
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Services</Text>
            <Text style={styles.totalValue}>{totals.totalServices.toFixed(2)} $</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pièces</Text>
            <Text style={styles.totalValue}>{totals.totalPieces.toFixed(2)} $</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{totals.sousTotal.toFixed(2)} $</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TPS (5 %)</Text>
            <Text style={styles.totalValue}>{totals.tps.toFixed(2)} $</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVQ (9,975 %)</Text>
            <Text style={styles.totalValue}>{totals.tvq.toFixed(2)} $</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total TTC : {totals.grandTotal.toFixed(2)} $</Text>
          </View>
        </View>
        {modePaiement ? (
          <View style={styles.section}>
            <Text style={styles.smallText}>Mode de paiement : {modePaiement}</Text>
          </View>
        ) : null}
        {notes ? (
          <View style={styles.notes}>
            <Text>{notes}</Text>
          </View>
        ) : null}
        <Text style={styles.footer} fixed>
          {workshop.name} · Facture {factureNumero}
        </Text>
      </Page>
    </Document>
  );
}
