import { describe, it, expect } from 'vitest';
import { parsePhoneE164 } from './parse-phone-e164';

describe('parsePhoneE164', () => {
  describe('formats canadiens default +1', () => {
    it.each([
      ['+15142446223', '+15142446223'], // déjà E.164
      ['5145830972', '+15145830972'], // 10 digits → préfixe +1
      ['(514) 274-7713', '+15142747713'], // parens + tiret + espace
      ['819-329-0007', '+18193290007'], // tirets
      ['(438) 938-9956', '+14389389956'],
      ['514.995.3445', '+15149953445'], // points
      ['1 514 583 0972', '+15145830972'], // 11 digits commençant par 1
    ])('"%s" → "%s"', (input, expected) => {
      expect(parsePhoneE164(input)).toBe(expected);
    });
  });

  describe('formats internationaux avec indicatif explicite', () => {
    it('"+33689283429" → "+33689283429" (déjà E.164, indicatif default ignoré)', () => {
      expect(parsePhoneE164('+33689283429')).toBe('+33689283429');
    });

    it('"689283429" avec defaultIndicatif="+33" → "+33689283429"', () => {
      expect(parsePhoneE164('689283429', '+33')).toBe('+33689283429');
    });

    it('"+5215512345678" (Mexique) → "+5215512345678"', () => {
      expect(parsePhoneE164('+5215512345678')).toBe('+5215512345678');
    });
  });

  describe('caractères invisibles strippés (cas réels v1)', () => {
    it('"‭(514) 274-7713‬" (LRE+PDF) → "+15142747713"', () => {
      const real = '‪(514) 274-7713‬';
      expect(parsePhoneE164(real)).toBe('+15142747713');
    });

    it('"‭(438) 969-8642‬" → "+14389698642"', () => {
      const real = '‪(438) 969-8642‬';
      expect(parsePhoneE164(real)).toBe('+14389698642');
    });
  });

  describe('placeholders et valeurs invalides → null', () => {
    it.each(['', '   ', null, undefined, 'à venir', '...', 'inconnu', 'TBD'])(
      'renvoie null pour %p',
      (input) => {
        expect(parsePhoneE164(input)).toBeNull();
      },
    );

    it('moins de 7 digits → null', () => {
      expect(parsePhoneE164('123456')).toBeNull();
    });

    it('lettres mélangées avec digits → null', () => {
      expect(parsePhoneE164('514-ABCD-789')).toBeNull();
    });

    it('plus de 15 digits (max E.164) → null', () => {
      expect(parsePhoneE164('+1234567890123456')).toBeNull();
    });
  });

  describe('contrôle indicatif', () => {
    it('"5145830972" sans defaultIndicatif → utilise +1 par défaut', () => {
      expect(parsePhoneE164('5145830972')).toBe('+15145830972');
    });

    it('defaultIndicatif "+1" explicite → équivalent', () => {
      expect(parsePhoneE164('5145830972', '+1')).toBe('+15145830972');
    });
  });
});
