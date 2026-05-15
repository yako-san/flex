import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  AjoutItemsModal,
  type SelectableItem,
} from './ajout-items-modal';

afterEach(() => cleanup());

const SERVICES: SelectableItem[] = [
  { id: 's1', label: 'Mise au point', groupe: 'Tune-up', categorie: 'Service' },
  { id: 's2', label: 'Réglage dérailleur', groupe: 'Tune-up', categorie: 'Service' },
  { id: 's3', label: 'Pose pneu', groupe: 'Montage', categorie: 'Service' },
];

const PIECES: SelectableItem[] = [
  {
    id: 'p1',
    label: 'Chambre à air 700C',
    groupe: 'Pneu',
    categorie: 'Roue',
    prixUnit: 8.99,
  },
  {
    id: 'p2',
    label: 'Câble dérailleur',
    groupe: 'Cable',
    categorie: 'Transmission',
    prixUnit: 4.5,
  },
];

describe('AjoutItemsModal', () => {
  it("fermé → DialogTitle pas dans le DOM", () => {
    render(
      <AjoutItemsModal
        open={false}
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByText('Ajouter au BDT')).toBeNull();
  });

  it("ouvert → DialogTitle + toggle + recherche + liste", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText('Ajouter au BDT')).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: /Type d'item/i })).toBeTruthy();
    expect(screen.getByLabelText('Rechercher')).toBeTruthy();
  });

  it("kind par défaut = SERVICE → liste services affichée", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText('Mise au point')).toBeTruthy();
    expect(screen.queryByText('Chambre à air 700C')).toBeNull();
  });

  it("initialKind='PIECE' → liste pièces affichée", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
        initialKind="PIECE"
      />,
    );
    expect(screen.getByText('Chambre à air 700C')).toBeTruthy();
    expect(screen.queryByText('Mise au point')).toBeNull();
  });

  it("toggle PIECE switche la liste", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: /Pièces/i }));
    expect(screen.getByText('Chambre à air 700C')).toBeTruthy();
    expect(screen.queryByText('Mise au point')).toBeNull();
  });

  it("recherche filtre les items (case-insensitive)", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('Rechercher'), {
      target: { value: 'PNEU' },
    });
    expect(screen.getByText('Pose pneu')).toBeTruthy();
    expect(screen.queryByText('Mise au point')).toBeNull();
  });

  it("recherche cherche aussi dans groupe + categorie", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('Rechercher'), {
      target: { value: 'tune-up' },
    });
    expect(screen.getByText('Mise au point')).toBeTruthy();
    expect(screen.getByText('Réglage dérailleur')).toBeTruthy();
    expect(screen.queryByText('Pose pneu')).toBeNull();
  });

  it("aucun résultat → message", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('Rechercher'), {
      target: { value: 'xyz-introuvable' },
    });
    expect(screen.getByText('Aucun résultat.')).toBeTruthy();
  });

  it("dropdown catégorie filtre", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        categories={['Service', 'Autre']}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByLabelText('Filtrer par catégorie')).toBeTruthy();
  });

  it("dropdown catégorie pas affiché si categories vide", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    expect(screen.queryByLabelText('Filtrer par catégorie')).toBeNull();
  });

  it("items groupés par 'groupe' (header sticky sous-catégorie)", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText('Tune-up')).toBeTruthy();
    expect(screen.getByText('Montage')).toBeTruthy();
  });

  it("checkbox item cochable → compteur 'sélectionné(s)' incrémente", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText('0 sélectionné')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Mise au point'));
    expect(screen.getByText('1 sélectionné')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Pose pneu'));
    expect(screen.getByText('2 sélectionnés')).toBeTruthy(); // pluriel
  });

  it("clic 'Ajouter' désactivé si rien coché", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    const addBtn = screen.getByRole('button', { name: /Ajouter \(0\)/i });
    expect((addBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("clic 'Ajouter' avec items cochés → onConfirm({kind, ids})", () => {
    const onConfirm = vi.fn();
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByLabelText('Mise au point'));
    fireEvent.click(screen.getByLabelText('Pose pneu'));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter \(2\)/i }));
    expect(onConfirm).toHaveBeenCalledWith({
      kind: 'SERVICE',
      ids: ['s1', 's3'],
    });
  });

  it("prix unitaire affiché en français avec virgule + $", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
        initialKind="PIECE"
      />,
    );
    expect(screen.getByText(/8,99 \$/)).toBeTruthy();
    expect(screen.getByText(/4,50 \$/)).toBeTruthy();
  });

  it("re-toggle item coché → décocher", () => {
    render(
      <AjoutItemsModal
        open
        onOpenChange={() => {}}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    const cb = screen.getByLabelText('Mise au point');
    fireEvent.click(cb);
    expect(screen.getByText('1 sélectionné')).toBeTruthy();
    fireEvent.click(cb);
    expect(screen.getByText('0 sélectionné')).toBeTruthy();
  });

  it("Annuler ferme via DialogClose onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(
      <AjoutItemsModal
        open
        onOpenChange={onOpenChange}
        services={SERVICES}
        pieces={PIECES}
        onConfirm={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
