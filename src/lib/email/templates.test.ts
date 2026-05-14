import { describe, expect, it } from 'vitest';
import {
  evalEmailSubject,
  evalEmailTemplate,
  factureEmailSubject,
  factureEmailTemplate,
  suiviEmailSubject,
  suiviEmailTemplate,
  type WorkshopBranding,
} from './templates';

const WORKSHOP: WorkshopBranding = {
  name: 'Yako Cyclo',
  raisonSociale: 'Yako Cyclo inc.',
  signatureText: '— Yako\n+1 514 555 1234',
};

describe('evalEmailSubject', () => {
  it("FR par défaut si clientLang absent", () => {
    const s = evalEmailSubject({
      veloNumero: 42,
      workshopName: 'Yako',
    });
    expect(s).toBe('Évaluation #0042');
  });

  it('EN si clientLang commence par "en"', () => {
    const s = evalEmailSubject({
      clientLang: 'en-CA',
      veloNumero: 5,
      workshopName: 'Yako',
    });
    expect(s).toBe('Evaluation #0005');
  });

  it('clientLang "EN" (uppercase) → en', () => {
    const s = evalEmailSubject({
      clientLang: 'EN',
      veloNumero: 1,
      workshopName: 'Yako',
    });
    expect(s).toBe('Evaluation #0001');
  });

  it('clientLang "fr-CA" → fr', () => {
    const s = evalEmailSubject({
      clientLang: 'fr-CA',
      veloNumero: 999,
      workshopName: 'Yako',
    });
    expect(s).toBe('Évaluation #0999');
  });

  it('pad le numéro à 4 chiffres', () => {
    expect(evalEmailSubject({ veloNumero: 1, workshopName: 'X' })).toContain('#0001');
    expect(evalEmailSubject({ veloNumero: 12, workshopName: 'X' })).toContain('#0012');
    expect(evalEmailSubject({ veloNumero: 123, workshopName: 'X' })).toContain('#0123');
    expect(evalEmailSubject({ veloNumero: 12345, workshopName: 'X' })).toContain('#12345');
  });

  it("override depuis workshop.templates.eval.subject", () => {
    const s = evalEmailSubject({
      templates: {
        eval: {
          subject: { fr: 'Custom FR {{bdcShortId}}', en: 'Custom EN {{bdcShortId}}' },
        },
      },
      clientLang: 'fr-CA',
      veloNumero: 7,
      workshopName: 'Yako',
    });
    expect(s).toBe('Custom FR 0007');
  });

  it('placeholders V1 ({{id}}) supportés en plus de V2 ({{bdcShortId}})', () => {
    const s = evalEmailSubject({
      templates: {
        eval: {
          subject: { fr: 'Légende V1 {{id}}', en: '' },
        },
      },
      clientLang: 'fr-CA',
      veloNumero: 99,
      workshopName: 'X',
    });
    expect(s).toBe('Légende V1 0099');
  });

  it('fallback EN→FR si FR absent dans le template', () => {
    const s = evalEmailSubject({
      templates: {
        eval: { subject: { en: 'EN only #{{bdcShortId}}' } },
      },
      clientLang: 'fr-CA',
      veloNumero: 1,
      workshopName: 'X',
    });
    expect(s).toBe('EN only #0001');
  });
});

describe('evalEmailTemplate', () => {
  it('produit du HTML doctype', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'Marie',
      veloNumero: 1,
      totalEstime: 100,
    });
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('contient le prénom du client', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'Marie',
      veloNumero: 1,
      totalEstime: 100,
    });
    expect(html).toContain('Marie');
  });

  it('contient le total estimé formaté .2 décimales', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'M',
      veloNumero: 1,
      totalEstime: 123.4,
    });
    expect(html).toContain('123.40');
  });

  it('contient l\'id paddé 0042', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'M',
      veloNumero: 42,
      totalEstime: 0,
    });
    expect(html).toContain('0042');
  });

  it('échappe le HTML dans la signature (XSS)', () => {
    const html = evalEmailTemplate({
      workshop: { name: 'X', signatureText: '<script>alert(1)</script>' },
      clientPrenom: 'M',
      veloNumero: 1,
      totalEstime: 0,
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('customMessage rendu dans un block avec border-left', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'M',
      veloNumero: 1,
      totalEstime: 0,
      customMessage: 'Salut Marie, voici les détails',
    });
    expect(html).toContain('Salut Marie, voici les détails');
    expect(html).toContain('border-left');
  });

  it('customMessage null → pas de block injecté', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'M',
      veloNumero: 1,
      totalEstime: 0,
      customMessage: null,
    });
    expect(html).not.toContain('border-left');
  });

  it('échappe HTML dans customMessage (XSS)', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'M',
      veloNumero: 1,
      totalEstime: 0,
      customMessage: '<img src=x onerror=alert(1)>',
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img');
  });

  it('liste des services et pièces séparées via {{services}} / {{pieces}}', () => {
    const tpl = '{{services}} / {{pieces}}';
    const html = evalEmailTemplate({
      workshop: { name: 'X' },
      templates: { eval: { body: { fr: tpl } } },
      clientLang: 'fr-CA',
      clientPrenom: 'M',
      veloNumero: 1,
      totalEstime: 0,
      items: [
        { kind: 'SERVICE', label: 'Mise au point' },
        { kind: 'PIECE', label: 'Chambre à air' },
        { kind: 'FORFAIT', label: 'Forfait été' },
      ],
    });
    // services + forfaits ensemble
    expect(html).toContain('Mise au point<br />Forfait été');
    // pièces séparément
    expect(html).toContain('Chambre à air');
  });

  it('utilise locale EN si clientLang commence par "en"', () => {
    const html = evalEmailTemplate({
      workshop: WORKSHOP,
      clientLang: 'en-CA',
      clientPrenom: 'Mary',
      veloNumero: 1,
      totalEstime: 50,
    });
    // Default EN body parle de "Hello"
    expect(html).toContain('Hello Mary');
  });
});

describe('factureEmailSubject', () => {
  it("FR par défaut", () => {
    const s = factureEmailSubject({
      factureNumero: 'F0042-2026-05-13',
      workshopName: 'X',
    });
    expect(s).toBe('Facture F0042-2026-05-13');
  });

  it('EN si clientLang en-*', () => {
    const s = factureEmailSubject({
      clientLang: 'en-CA',
      factureNumero: 'F0042',
      workshopName: 'X',
    });
    expect(s).toBe('Invoice F0042');
  });
});

describe('factureEmailTemplate', () => {
  it('contient factureNumero + grandTotal + modePaiement', () => {
    const html = factureEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'Jean',
      factureNumero: 'F0042',
      grandTotal: 234.56,
      modePaiement: 'INTERAC',
    });
    expect(html).toContain('F0042');
    expect(html).toContain('234.56');
    expect(html).toContain('interac'); // lowercased par templates.ts
  });

  it("EN si clientLang en-*", () => {
    const html = factureEmailTemplate({
      workshop: WORKSHOP,
      clientLang: 'en-CA',
      clientPrenom: 'John',
      factureNumero: 'F1',
      grandTotal: 10,
      modePaiement: 'CASH',
    });
    expect(html).toContain('Hello John');
  });
});

describe('suiviEmailSubject', () => {
  it("FR par défaut", () => {
    const s = suiviEmailSubject({ workshopName: 'Yako' });
    expect(s).toContain('vélo');
  });

  it('EN si clientLang en-*', () => {
    const s = suiviEmailSubject({ clientLang: 'en', workshopName: 'Yako' });
    expect(s).toMatch(/bike/i);
  });
});

describe('suiviEmailTemplate', () => {
  it('contient veloLabel + workshop.name', () => {
    const html = suiviEmailTemplate({
      workshop: WORKSHOP,
      clientPrenom: 'M',
      veloLabel: 'Trek 7300',
    });
    expect(html).toContain('Trek 7300');
    expect(html).toContain('Yako Cyclo');
  });
});
