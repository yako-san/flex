import { describe, it, expect } from 'vitest';
import { relLuminance, pickTextColor, rgbToHex } from './contrast';

describe('relLuminance', () => {
  it('renvoie 0 pour noir pur', () => {
    expect(relLuminance('#000000')).toBe(0);
  });

  it('renvoie 1 pour blanc pur', () => {
    expect(relLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('renvoie ~0.2 pour gris moyen 0x7e (= --app-bg dark)', () => {
    expect(relLuminance('#7e7e7e')).toBeCloseTo(0.213, 2);
  });

  it('renvoie ~0.6 pour gris pâle 0xcc (= --app-bg-light)', () => {
    expect(relLuminance('#cccccc')).toBeCloseTo(0.604, 2);
  });

  it('accepte le format court #rgb', () => {
    expect(relLuminance('#fff')).toBeCloseTo(1, 5);
    expect(relLuminance('#000')).toBe(0);
  });

  it('renvoie 1 sur valeur invalide (fallback texte noir)', () => {
    expect(relLuminance('not-a-color')).toBe(1);
  });
});

describe('pickTextColor', () => {
  it('blanc sur fond foncé (gris dark)', () => {
    expect(pickTextColor('#7e7e7e')).toBe('#ffffff');
    expect(pickTextColor('#000000')).toBe('#ffffff');
    expect(pickTextColor('#333333')).toBe('#ffffff');
  });

  it('noir sur fond pâle (gris light)', () => {
    expect(pickTextColor('#cccccc')).toBe('#000000');
    expect(pickTextColor('#ffffff')).toBe('#000000');
    expect(pickTextColor('#fff056')).toBe('#000000'); // jaune signature
  });
});

describe('rgbToHex', () => {
  it('convertit rgb() en hex', () => {
    expect(rgbToHex('rgb(126, 126, 126)')).toBe('#7e7e7e');
    expect(rgbToHex('rgb(255, 255, 255)')).toBe('#ffffff');
    expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
  });

  it('passthrough si déjà en hex', () => {
    expect(rgbToHex('#abc123')).toBe('#abc123');
  });
});
