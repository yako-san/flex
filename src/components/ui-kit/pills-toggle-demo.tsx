'use client';

import { useState } from 'react';
import { PillsToggle } from '@/components/ui/pills-toggle';

export function UiKitPillsToggle() {
  const [tab, setTab] = useState<'client' | 'velo'>('client');
  const [paiement, setPaiement] = useState<'comptant' | 'interac' | 'cartes'>('interac');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-[var(--text-secondary-60)]">Onglet :</span>
        <PillsToggle
          aria-label="Onglet fiche"
          options={[
            { value: 'client', label: 'Client' },
            { value: 'velo', label: 'Vélo' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <span className="text-sm text-[var(--text-secondary-70)]">→ {tab}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-[var(--text-secondary-60)]">Mode paiement :</span>
        <PillsToggle
          aria-label="Mode de paiement"
          options={[
            { value: 'comptant', label: 'Comptant' },
            { value: 'interac', label: 'Interac' },
            { value: 'cartes', label: 'Cartes' },
          ]}
          value={paiement}
          onChange={setPaiement}
          size="sm"
        />
        <span className="text-sm text-[var(--text-secondary-70)]">→ {paiement}</span>
      </div>
    </div>
  );
}
