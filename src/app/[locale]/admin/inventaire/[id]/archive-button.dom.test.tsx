import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../../bdcs/actions', () => ({
  archiveBdtWithChoiceAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/lib/utils/toast', () => ({ toast: vi.fn() }));

import { ArchiveBdtButton } from './archive-button';

describe('ArchiveBdtButton', () => {
  it("rend un bouton 'Archiver'", () => {
    render(<ArchiveBdtButton bdcId="b1" resteAPayer={0} />);
    expect(screen.getByRole('button', { name: /Archiver/i })).toBeTruthy();
  });

  it("dialog fermé par défaut → titre absent du DOM", () => {
    render(<ArchiveBdtButton bdcId="b1" resteAPayer={0} />);
    // ArchiveChoiceDialog ne devrait pas être ouvert au mount
    expect(screen.queryByText(/comptant/i)).toBeNull();
  });

  it("clic sur 'Archiver' ouvre le dialog (boutons supplémentaires apparaissent)", () => {
    render(<ArchiveBdtButton bdcId="b1" resteAPayer={42} />);
    const before = screen.getAllByRole('button').length;
    fireEvent.click(screen.getAllByRole('button', { name: /Archiver/i })[0]!);
    const after = screen.getAllByRole('button').length;
    expect(after).toBeGreaterThan(before);
  });
});
