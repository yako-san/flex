# Brief — Session "Fiscalité & Facturation"

> Document de prise de contexte pour une session dédiée, à charger en début
> de prompt. Capture l'état du dossier au 2026-05-07 après l'audit billing.

## 1. Contexte produit (rappel rapide)

- **Produit** : flex-app v2, SaaS multi-tenant pour ateliers de vélo (PME)
- **Tenant principal actuel** : yako-cyclo (Québec, fr-CA, devise CAD)
- **Founder** : yako-san — solo, non-comptable, non-développeur
- **Cible** : petits ateliers QC d'abord (1–5 personnes, saisonniers), puis
  possiblement MX/FR plus tard
- **Volume typique d'un atelier** : 50–500 BDT/an, panier moyen ~80 $
- **Stack billing déjà préparée** : champs Prisma `Workshop.stripeCustomerId`
  + `stripeSubscriptionId` (à possiblement renommer en `billingCustomerId`)

## 2. Décisions à prendre dans la session

### A. Modèle tarifaire (atelier → flex-app)

À choisir parmi (audit déjà fait — voir §4 résumé) :

- [ ] Flat tiered (Free / Starter / Pro)
- [ ] Per-BDT pur
- [ ] % du revenu traité (revenue share)
- [ ] **Hybride bas-forfait + dépassement** ← reco audit
- [ ] Annuel pré-payé avec discount

**Question ouverte** : montants précis. Brouillon issu de l'audit :
- Free : 0 $ — ≤20 BDT/mois, 1 user
- Starter : **12 $/mois ou 99 $/an** (-31 %) — 100 BDT/mois inclus,
  puis 0,25 $/BDT, 3 users
- Pro : **29 $/mois ou 249 $/an** — illimité, multi-users, exports

### B. Provider de facturation

- [ ] Stripe direct (Subscriptions + Checkout + Customer Portal)
- [ ] **Lemon Squeezy** (Merchant of Record) ← reco audit
- [ ] Paddle (MoR alternative)
- [ ] Square Subscriptions
- [ ] Chargebee sur-couche Stripe

### C. Stratégie de compliance fiscale QC

- [ ] **MoR** : provider est marchand, gère TPS/TVQ — yako-san déclare juste
      un revenu B2B normal (pas de NEQ requis pour ça, pas de remise TPS/TVQ
      à RQ)
- [ ] **Stripe + Stripe Tax** : yako-san reste redevable, doit s'inscrire
      au fichier TPS et TVQ dès >30 k$ ARR taxable, déclarations
      trimestrielles, comptable mensuel ~80–150 $

### D. Modes de paiement client → atelier (factures émises)

**Décision déjà prise (statu quo)** : on garde l'enum `ModePaiement`
(COMPTANT, INTERAC, CARTE, AUTRE) en tracking manuel. L'atelier continue
d'utiliser sa propre solution (terminal Square externe, Interac e-Transfer,
cash). **Pas d'intégration Stripe Connect / Square API en v2.**

À reconsidérer si :
- Un atelier demande explicitement de traiter des cartes via flex
- Volume justifie les frais de 2,9 % par transaction

## 3. Compliance fiscale QC — points clés à creuser

À valider en session (idéalement avec un comptable, pas juste un agent IA) :

1. **Seuil d'inscription TPS/TVQ** : 30 000 $ de revenu taxable sur 4
   trimestres glissants. Sous ce seuil, "petit fournisseur" exempté.
2. **MoR international (Paddle/Lemon Squeezy)** : confirmer que la facture
   B2B reçue par yako-san (LS basé à Wyoming USA) ne déclenche pas
   d'obligation TPS/TVQ pour le client QC. Vérifier le traitement TVH/TPS
   pour services numériques import.
3. **Quebec-specific** : LS et Paddle gèrent-ils correctement la TVQ
   (provincial, pas fédéral) ? Les MoR gèrent souvent TPS/HST mais TVQ est
   souvent loupée. **À vérifier en première priorité.**
4. **NEQ requis ?** : pour vendre des services SaaS au QC, il faut un NEQ
   (Numéro d'Entreprise du Québec) dès qu'on est entreprise immatriculée.
   yako-san est-il déjà immatriculé sous yako-cyclo ?
5. **Facturation B2B** : si flex-app facture un atelier QC, faut-il une
   facture conforme LTA/LTVQ avec n° TPS/TVQ visible ? Quelle est
   l'obligation côté MoR ?

## 4. Résumé chiffré audit (à valider)

| Modèle | Atelier 100 BDT/an | Atelier 500 BDT/an | Saisonnier ? |
|---|---|---|---|
| Flat 49 $/mois | 588 $ (7,4 % rev) | 588 $ | Non |
| Tiered 0/19/39 | 228 $ | 468 $ | Mieux |
| Per-BDT 0,50 $ | 50 $ | 250 $ | Oui |
| % revenu 1,5 % | 120 $ | 600 $ | Oui mais punit croissance |
| **Hybride 9 $ + 0,30 $/BDT >30** | **129 $** | **249 $** | **Optimal** |
| Annuel 199 $ prépayé | 199 $ | 199 $ | Oui |

| Provider | Frais (CAD) | Compliance QC | Intégration |
|---|---|---|---|
| Stripe | 2,9 % + 0,30 $ | Toi redevable, NEQ + RQ | Faible (mature) |
| Lemon Squeezy MoR | ~5 % + 0,50 $ US | LS marchand — toi B2B normal | Très faible |
| Paddle MoR | ~5 % + 0,50 $ | Idem LS, plus mature B2B | Moyenne |
| Square Subs | 2,65 % | Toi redevable | Moyenne |
| Chargebee/Stripe | 0–99 $/mois fixe + frais Stripe | Toi redevable | Élevée |

## 5. Questions ouvertes pour la session

1. yako-san est-il déjà immatriculé (NEQ actif) ? Sous quelle structure
   (entreprise individuelle, SENC, inc.) ?
2. yako-cyclo facture-t-il déjà des taxes (TPS/TVQ) sur ses propres ventes ?
   Si oui, l'infra fiscale existe — ajouter le SaaS est marginal.
3. Combien de temps yako-san peut-il consacrer à la paperasse fiscale par
   mois ? (Détermine si MoR vaut les 2 % de marge).
4. Y a-t-il un comptable de confiance accessible pour valider l'analyse ?
5. À quel ARR cible (12 mois, 24 mois) faudrait-il migrer du MoR vers Stripe
   direct pour rentabiliser les frais ?
6. Le client final (atelier) accepte-t-il de payer en USD via LS, ou
   faut-il forcer CAD (et vérifier que LS le supporte vraiment) ?
7. **Critique** : LS/Paddle remettent-ils correctement la TVQ (pas juste
   TPS) ? Si non → Paddle (qui gère mieux Canada) ou Stripe + comptable.

## 6. Livrables attendus de la session

- [ ] Décision finale modèle + provider, signée par yako-san
- [ ] Plan d'implémentation Phase 8 chiffré en heures
- [ ] Liste de tâches admin/légales préalables (NEQ, inscription RQ si Stripe,
      compte LS/Paddle si MoR)
- [ ] Brouillon de page pricing publique (3 colonnes)
- [ ] Schéma Prisma : champs subscription_status, plan_id, current_period_end,
      bdt_count_period (si usage-based)
- [ ] Document de réponses aux questions §5

## 7. Pré-requis avant de relancer la session

- Avoir sous la main : NEQ (si existe), nom légal yako-cyclo, adresse fiscale
- Avoir testé en sandbox un MoR (LS ou Paddle) pour évaluer l'UX checkout
- Idéalement : 30 min avec un comptable QC pour valider le §3
