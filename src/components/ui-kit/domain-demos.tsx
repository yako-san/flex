'use client';

import * as React from 'react';
import { RemiseInput, type RemiseType } from '@/components/domain/remise-input';
import { BDCTotaux, type Avance } from '@/components/domain/bdc-totaux';
import { AjoutItemsModal } from '@/components/domain/ajout-items-modal';
import { ArchiveChoiceDialog } from '@/components/domain/archive-choice-dialog';
import {
  ClientAutocomplete,
  type ClientSuggestion,
} from '@/components/domain/client-autocomplete';
import { VeloFormFields, type VeloDraft, type Marque } from '@/components/domain/velo-form-fields';
import { Button } from '@/components/ui/button';

export function DemoRemiseInput() {
  const [val, setVal] = React.useState<{ value: number | null; type: RemiseType }>({
    value: 10,
    type: 'PCT',
  });
  return (
    <div className="flex items-center gap-3">
      <RemiseInput
        value={val.value}
        type={val.type}
        onChange={setVal}
        ariaLabel="Remise services"
      />
      <span className="text-sm text-[var(--text-secondary-70)]">
        → {val.value ?? '—'} {val.type === 'PCT' ? '%' : '$'}
      </span>
    </div>
  );
}

export function DemoBDCTotaux() {
  const [avance, setAvance] = React.useState<Avance | null>(null);
  return (
    <div className="max-w-sm">
      <BDCTotaux
        sousTotalServices={120}
        sousTotalPieces={87.5}
        remiseServicesMontant={12}
        remisePiecesMontant={0}
        tps={9.78}
        tvq={19.51}
        grandTotal={224.79}
        avance={avance}
        onAvanceChange={setAvance}
      />
    </div>
  );
}

const MOCK_SERVICES = [
  { id: 's1', label: 'Mise au point', groupe: 'Atelier', categorie: 'Atelier', prixUnit: 60 },
  { id: 's2', label: 'Tubeless setup', groupe: 'Roues', categorie: 'Roues', prixUnit: 35 },
  { id: 's3', label: 'Saignée freins', groupe: 'Freins', categorie: 'Freins', prixUnit: 55 },
];

const MOCK_PIECES = [
  { id: 'p1', label: 'Shimano Tourney TY21-GS', groupe: 'Transmission', categorie: 'Transmission', prixUnit: 24 },
  { id: 'p2', label: 'Câble freins basics', groupe: 'Freins', categorie: 'Freins', prixUnit: 8 },
  { id: 'p3', label: 'Boulon 8mm', groupe: 'Quincaillerie', categorie: 'Quincaillerie', prixUnit: 1.5 },
  { id: 'p4', label: 'Réflecteurs ensemble', groupe: 'Divers', categorie: 'Divers', prixUnit: 4 },
];

export function DemoAjoutItemsModal() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Ajouter au BDT
      </Button>
      <AjoutItemsModal
        open={open}
        onOpenChange={setOpen}
        services={MOCK_SERVICES}
        pieces={MOCK_PIECES}
        categories={['Atelier', 'Roues', 'Freins', 'Transmission', 'Quincaillerie', 'Divers']}
        onConfirm={({ kind, ids }) => {
          // eslint-disable-next-line no-console
          console.log('[demo] ajouter', { kind, ids });
          setOpen(false);
        }}
      />
    </>
  );
}

export function DemoArchiveChoiceDialog() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Archiver le BDT
      </Button>
      <ArchiveChoiceDialog
        open={open}
        onOpenChange={setOpen}
        resteAPayer={224.79}
        onChoose={async (choice) => {
          // eslint-disable-next-line no-console
          console.log('[demo] archive choice', choice);
          await new Promise((r) => setTimeout(r, 300));
          setOpen(false);
        }}
      />
    </>
  );
}

const MOCK_CLIENTS: ClientSuggestion[] = [
  { id: 'c1', prenom: 'Julie', nom: 'St-Arnault', telephone: '514 555-1111' },
  { id: 'c2', prenom: 'Étienne', nom: 'Mayrand', telephone: '514 555-2222', courriel: 'etienne@ex.ca' },
  { id: 'c3', prenom: 'Paul', nom: 'Lamontagne', courriel: 'paul@ex.ca' },
  { id: 'c4', prenom: 'Louise', nom: 'Bacher', telephone: '438 555-3333' },
];

export function DemoClientAutocomplete() {
  const [client, setClient] = React.useState<ClientSuggestion | null>(null);
  const search = React.useCallback(async (q: string) => {
    await new Promise((r) => setTimeout(r, 80));
    const norm = q.toLowerCase();
    return MOCK_CLIENTS.filter(
      (c) =>
        c.prenom.toLowerCase().includes(norm) ||
        c.nom.toLowerCase().includes(norm) ||
        (c.telephone ?? '').includes(norm) ||
        (c.courriel ?? '').toLowerCase().includes(norm),
    );
  }, []);
  return (
    <div className="max-w-sm space-y-2">
      <ClientAutocomplete value={client} onChange={setClient} search={search} />
      {client ? (
        <p className="text-xs text-[var(--text-secondary-60)]">
          → {client.prenom} {client.nom} ({client.id})
        </p>
      ) : (
        <p className="text-xs text-[var(--text-secondary-50)]">tape « jul » ou « pa »…</p>
      )}
    </div>
  );
}

const MOCK_MARQUES: Marque[] = [
  { id: 'm1', nom: 'Specialized', taillesDisponibles: ['XS', 'S', 'M', 'L', 'XL'] },
  { id: 'm2', nom: 'Trek', taillesDisponibles: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'm3', nom: 'Devinci', taillesDisponibles: ['S', 'M', 'L'] },
  { id: 'm4', nom: 'Custom' },
];

export function DemoVeloFormFields() {
  const [draft, setDraft] = React.useState<VeloDraft>({
    marqueId: null,
    modele: '',
    couleur: '',
    taille: null,
  });
  return (
    <div className="max-w-xl space-y-3">
      <VeloFormFields marques={MOCK_MARQUES} value={draft} onChange={setDraft} />
      <pre className="rounded-md bg-[var(--gris-fond)] p-2 text-xs">
        {JSON.stringify(draft, null, 2)}
      </pre>
    </div>
  );
}
