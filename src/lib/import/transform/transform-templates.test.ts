import { describe, it, expect } from 'vitest';
import { transformTemplates } from './transform-templates';

describe('transformTemplates', () => {
  it('retourne undefined si entrée vide', () => {
    expect(transformTemplates(undefined)).toBeUndefined();
    expect(transformTemplates({})).toBeUndefined();
  });

  it('mappe les clés FR évaluation flat → structuré', () => {
    const r = transformTemplates({
      evaluation_subject_fr: 'Évaluation #{{id}}',
      evaluation_body_fr: 'Bonjour {{prenom}},...',
    });
    expect(r?.eval?.subject).toBe('Évaluation #{{id}}');
    expect(r?.eval?.body).toBe('Bonjour {{prenom}},...');
  });

  it('mappe les clés FR facture BDT', () => {
    const r = transformTemplates({
      facture_bdt_subject_fr: 'Facture #{{numero}}',
      facture_bdt_body_fr: 'Voici votre facture',
    });
    expect(r?.facture?.subject).toBe('Facture #{{numero}}');
    expect(r?.facture?.body).toBe('Voici votre facture');
  });

  it('mappe les clés FR facture vente comptoir', () => {
    const r = transformTemplates({
      facture_vente_body_fr: 'Reçu vente comptoir',
    });
    expect(r?.vente?.body).toBe('Reçu vente comptoir');
  });

  it('mappe le rappel SMS (sans subject)', () => {
    const r = transformTemplates({
      sms_rappel_fr: 'Ton vélo est prêt',
      rappel_subject_fr: 'IGNORÉ', // sms n'a pas de subject
    });
    expect(r?.smsRappel?.body).toBe('Ton vélo est prêt');
    expect(r?._unmapped?.['rappel_subject_fr']).toBe('IGNORÉ');
  });

  it('mappe le suivi (courriel ou sms)', () => {
    const r = transformTemplates({
      sms_suivi_fr: 'Comment va ton vélo ?',
      courriel_suivi_subject_fr: 'Suivi ton vélo',
      courriel_suivi_body_fr: 'Bonjour, comment va...',
    });
    expect(r?.smsSuivi?.body).toBe('Bonjour, comment va...'); // dernier write gagne (body via courriel_suivi)
    expect(r?._unmapped?.['courriel_suivi_subject_fr']).toBe('Suivi ton vélo');
  });

  it('préserve les clés EN dans _unmapped (V2 mono-locale)', () => {
    const r = transformTemplates({
      evaluation_body_fr: 'Bonjour',
      evaluation_body_en: 'Hello',
    });
    expect(r?.eval?.body).toBe('Bonjour');
    expect(r?._unmapped?.['evaluation_body_en']).toBe('Hello');
  });

  it('préserve les clés non reconnues dans _unmapped', () => {
    const r = transformTemplates({
      pied_de_page: 'Merci',
      header_html: '<h1>Atelier</h1>',
    });
    expect(r?._unmapped?.['pied_de_page']).toBe('Merci');
    expect(r?._unmapped?.['header_html']).toBe('<h1>Atelier</h1>');
  });

  it('ignore les valeurs vides ou non-string', () => {
    const r = transformTemplates({
      evaluation_body_fr: '',
      evaluation_subject_fr: '   ',
      // @ts-expect-error : test runtime defensive
      bidule: 123,
    });
    expect(r).toBeUndefined();
  });
});
