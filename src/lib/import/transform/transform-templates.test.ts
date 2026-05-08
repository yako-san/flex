import { describe, it, expect } from 'vitest';
import { transformTemplates } from './transform-templates';

describe('transformTemplates', () => {
  it('retourne undefined si entrée vide', () => {
    expect(transformTemplates(undefined)).toBeUndefined();
    expect(transformTemplates({})).toBeUndefined();
  });

  it('mappe les clés explicites V1 → structure V2 multi-locale', () => {
    const r = transformTemplates({
      eval_subject_fr: 'Évaluation #{{bdcShortId}}',
      eval_subject_en: 'Evaluation #{{bdcShortId}}',
      eval_message_fr: 'Bonjour {{clientPrenom}}',
      eval_message_en: 'Hello {{clientPrenom}}',
      facture_subject_fr: 'Facture {{factureNumero}}',
      facture_message_fr: 'Voici votre facture',
      vente_subject_fr: 'Reçu vente',
      vente_message_fr: 'Merci pour votre achat',
      courriel_suivi_subject_fr: 'Comment va ton vélo ?',
      courriel_suivi_fr: 'Bonjour, on prend de tes nouvelles',
      sms_rappel_fr: 'Ton vélo est prêt',
      sms_rappel_en: 'Your bike is ready',
      sms_suivi_fr: 'Comment va ton vélo ?',
    });
    expect(r?.eval?.subject?.fr).toBe('Évaluation #{{bdcShortId}}');
    expect(r?.eval?.subject?.en).toBe('Evaluation #{{bdcShortId}}');
    expect(r?.eval?.body?.fr).toBe('Bonjour {{clientPrenom}}');
    expect(r?.eval?.body?.en).toBe('Hello {{clientPrenom}}');
    expect(r?.facture?.subject?.fr).toBe('Facture {{factureNumero}}');
    expect(r?.facture?.body?.fr).toBe('Voici votre facture');
    expect(r?.vente?.subject?.fr).toBe('Reçu vente');
    expect(r?.vente?.body?.fr).toBe('Merci pour votre achat');
    expect(r?.courrielSuivi?.subject?.fr).toBe('Comment va ton vélo ?');
    expect(r?.courrielSuivi?.body?.fr).toBe('Bonjour, on prend de tes nouvelles');
    expect(r?.smsRappel?.body?.fr).toBe('Ton vélo est prêt');
    expect(r?.smsRappel?.body?.en).toBe('Your bike is ready');
    expect(r?.smsSuivi?.body?.fr).toBe('Comment va ton vélo ?');
  });

  it('mappe les signatures V1 lead', () => {
    const r = transformTemplates({
      signature_yako: 'yako-cyclo · 4109 St-Denis',
      signature_cf: 'Cyclo Flex · 123 ailleurs',
    });
    expect(r?.signatures?.yako).toBe('yako-cyclo · 4109 St-Denis');
    expect(r?.signatures?.cf).toBe('Cyclo Flex · 123 ailleurs');
  });

  it('préserve les clés inconnues dans _unmapped', () => {
    const r = transformTemplates({
      eval_subject_fr: 'OK',
      truc_inconnu: 'bidule',
      footer_v1: '<footer>',
    });
    const _unmapped = (r as unknown as { _unmapped?: Record<string, string> })._unmapped;
    expect(_unmapped?.['truc_inconnu']).toBe('bidule');
    expect(_unmapped?.['footer_v1']).toBe('<footer>');
    expect(r?.eval?.subject?.fr).toBe('OK');
  });

  it('ignore les valeurs vides ou non-string', () => {
    const r = transformTemplates({
      eval_subject_fr: '',
      eval_message_fr: '   ',
      // @ts-expect-error : test runtime defensive
      bidule: 123,
    });
    expect(r).toBeUndefined();
  });

  it('résiste à un trim sur les clés (espaces parasites)', () => {
    const r = transformTemplates({
      ' eval_subject_fr ': 'Avec espaces',
    });
    expect(r?.eval?.subject?.fr).toBe('Avec espaces');
  });
});
