'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function UiKitCheckboxes() {
  const [evalEnvoye, setEvalEnvoye] = useState(true);
  const [bonSortie, setBonSortie] = useState(false);
  const [archiver, setArchiver] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Checkbox
          id="cb-eval"
          checked={evalEnvoye}
          onCheckedChange={(v) => setEvalEnvoye(v === true)}
        />
        <Label htmlFor="cb-eval" className="!normal-case !text-sm !font-normal !text-[var(--dark)]">
          Évaluation envoyée
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="cb-sortie"
          checked={bonSortie}
          onCheckedChange={(v) => setBonSortie(v === true)}
        />
        <Label htmlFor="cb-sortie" className="!normal-case !text-sm !font-normal !text-[var(--dark)]">
          Bon de sortie remis
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="cb-archiver"
          checked={archiver}
          onCheckedChange={(v) => setArchiver(v === true)}
        />
        <Label htmlFor="cb-archiver" className="!normal-case !text-sm !font-normal !text-[var(--dark)]">
          Archiver le BDT
        </Label>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Checkbox id="cb-disabled" disabled />
        <Label htmlFor="cb-disabled" className="!normal-case !text-sm !font-normal !text-[var(--text-secondary-50)]">
          Disabled
        </Label>
      </div>
    </div>
  );
}
