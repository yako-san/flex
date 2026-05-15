import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('./actions', () => ({
  linkWorkshopToOrgAction: vi.fn().mockResolvedValue(null),
}));

import { LinkWorkshopForm } from './link-workshop-form';

const PROPS = {
  workshopId: 'w1',
  workshopName: 'yako-cyclo',
  clerkOrgId: 'org_abc123',
  clerkOrgSlug: 'yako-cyclo',
};

describe('LinkWorkshopForm', () => {
  it("hidden inputs workshopId et clerkOrgId présents", () => {
    const { container } = render(<LinkWorkshopForm {...PROPS} />);
    const wId = container.querySelector('input[name="workshopId"]') as HTMLInputElement;
    const oId = container.querySelector('input[name="clerkOrgId"]') as HTMLInputElement;
    expect(wId.type).toBe('hidden');
    expect(wId.value).toBe('w1');
    expect(oId.type).toBe('hidden');
    expect(oId.value).toBe('org_abc123');
  });

  it("bouton contient le nom du workshop et le slug", () => {
    render(<LinkWorkshopForm {...PROPS} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('yako-cyclo');
    expect(btn.getAttribute('type')).toBe('submit');
  });

  it("message d'action requise visible", () => {
    render(<LinkWorkshopForm {...PROPS} />);
    expect(screen.getByText(/Action requise/)).toBeTruthy();
  });

  it("sans clerkOrgSlug, affiche 'cette org' dans le bouton", () => {
    render(<LinkWorkshopForm {...PROPS} clerkOrgSlug={null} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toContain('cette org');
  });

  it("au mount, pas de message succès", () => {
    render(<LinkWorkshopForm {...PROPS} />);
    expect(screen.queryByText(/Workshop lié/)).toBeNull();
  });
});
