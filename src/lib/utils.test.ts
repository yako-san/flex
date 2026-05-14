import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it("merge classes basiques", () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('ignore les falsy (null, undefined, false)', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });

  it('accepte des objets {className: boolean}', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('accepte des arrays nested', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('tailwind-merge : dernière classe gagne sur les conflits', () => {
    // p-4 → p-2 : seule p-2 reste
    expect(cn('p-4', 'p-2')).toBe('p-2');
    // bg-red-500 → bg-blue-500 : seule bg-blue-500 reste
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('tailwind-merge : classes non-conflictuelles préservées', () => {
    expect(cn('p-4 text-sm', 'font-bold')).toBe('p-4 text-sm font-bold');
  });

  it('appel sans args → chaîne vide', () => {
    expect(cn()).toBe('');
  });
});
