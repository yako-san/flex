# Captures V1.0.19 — Référence visuelle pour Sprint 4 β+

Source : 28 captures d'écran de l'app V1 (`yako-san/flex-rev-app` v1.0.19) prises
le 2026-05-12 par yako-san.

**Statut** : source de vérité visuelle pour la refonte UI V2 (Sprint 4 β+
"port look + structure + flow"). À consulter **avant** chaque refonte de page
Phase 3.

**Convention** : `XX-zone-detail.png`. Le numéro suit l'ordre du PDF source.

---

## Section 0 — Vues globales (auth + nav + paramètres + archives)

| # | Fichier | Page V1 | Notes clés pour V2 |
|---|---|---|---|
| 01 | [01-archives-bdt.png](./01-archives-bdt.png) | `/archives` | BDT archivés livrés/facturés. Header jaune sticky. Toolbar : pill total $, onglets Archivés/Refusés/Ventes. Colonnes : restaurer, statut pill, id, date in/out, client, vélo, note, services, pièces, total. |
| 02 | [02-login-google.png](./02-login-google.png) | `/login` | Carte jaune squircle centrée. Logo Flex/Rev. Bouton "Connexion avec Google". Fond gris. |
| 03 | [03-archives-refuses.png](./03-archives-refuses.png) | `/archives?tab=refuses` | Table BDT REFUSÉ, fond rose pâle. Pills "REFUSÉ" rose foncé. Mêmes colonnes qu'archives. |
| 04 | [04-archives-ventes.png](./04-archives-ventes.png) | `/archives?tab=ventes` | Ventes archivées table simple. Colonnes : restaurer, factures, date, client, items, total. |
| 05 | [05-dashboard.png](./05-dashboard.png) | `/dashboard` | **Sidebar étendue jaune** (INVENTAIRE/VENTES/SERVICES/PIÈCES/CLIENTS). 4 KPI cards ligne (BDT actifs, Stock à commander, Suivis, Revenus mois). 3 colonnes : Rendez-vous+BDT terminés+BDT suivi / Pièces à commander / Dernières factures+Dernières ventes. Boutons SHEETS/DRIVE/GMAIL/CONTACTS haut-droite. |
| 06 | [06-dashboard-sidebar-popup.png](./06-dashboard-sidebar-popup.png) | `/dashboard` (hover) | Popup hover sur logo sidebar : Dashboard / Archives / Paramètres / Aide (liste blanche dans menu jaune). |
| 07 | [07-parametres.png](./07-parametres.png) | `/parametres` | Grid 2 colonnes de cartes : Modèles de messages, Infos atelier, Historique scans, Backup/Export, Admin — opérations destructives / Équipe atelier, Catalogue vélo, Santé APIs Google, Import clients (CSV). |
| 08 | [08-aide-tutoriels.png](./08-aide-tutoriels.png) | `/aide` | 3 colonnes ("BONS DE TRAVAIL" / "FLUX DE TRAVAIL" / "SERVICES + PIÈCES") de cards tutoriels numérotés 01-11 (Recevoir un vélo, Évaluer, Réparer, Dashboard, Workflow, Statut, Services+pièces, Inventaire mobile, Vente rapide POS, Scanner code-barre, Facturation & taxes). |

## Section 1 — Inventaire + BDT (la zone la plus dense)

| # | Fichier | Page V1 | Notes clés pour V2 |
|---|---|---|---|
| 09 | [09-inventaire-modal-nouveau-bdt.png](./09-inventaire-modal-nouveau-bdt.png) | `/inventaire` + modal | Modal "Nouveau Bon de Travail" sur fond liste inventaire colorée. Formulaire : client (dropdown), vélo (marque + modèle + taille + couleur + n° série). Boutons ANNULER + CRÉER LE BON DE TRAVAIL (jaune). |
| 10 | [10-inventaire-liste-coloree.png](./10-inventaire-liste-coloree.png) | `/inventaire` | **Liste groupée par section** (NOUVEAU jaune / EN COURS vert / FACTURÉ rose / STAFF gris). **Lignes entières colorées** selon statut. Colonnes : id+pill statut, vélo, client, mécanos eval/meca/ctrl (dropdowns inline), date entrée. |
| 11 | [11-dropdown-clients.png](./11-dropdown-clients.png) | dropdown | Liste alphabétique clients (fond noir, texte blanc). Header "✓ Sélection →" jaune. "+ Ajouter un client". Très dense (~30 noms visibles). |
| 12 | [12-dropdown-marques.png](./12-dropdown-marques.png) | dropdown | Liste alphabétique marques vélo (fond noir). Header **vert** "✓ Sélection →". "+ Ajouter une marque". Autre, Argon18, Aspire, Bassi, Bianchi, Bonelli, Brompton, Cannondale, Cervélo, Devinci, Giant, IGO, Kona, Louis Garneau, Marin, Marinoni, Miele, Moose, Norco, Opus, Panorama, Peugeot, Picnica, Raleigh, Rocky Mountain, Specialized, Surly... |
| 13 | [13-inventaire-modal-nouveau-bdt-bis.png](./13-inventaire-modal-nouveau-bdt-bis.png) | `/inventaire` + modal | Variante de 09 (état modal légèrement différent). |
| 14 | [14-bdt-detail-rv-jaune-vide.png](./14-bdt-detail-rv-jaune-vide.png) | `/inventaire/0149` | **BDT RV vide** : carte gauche JAUNE, blocs Services + Pièces vides (jaune clair header). Démontre que **la couleur de fond suit le statut du BDT**. Carte gauche contient : id 0149 + pill RV, BON DE TRAVAIL header, Sélection → ... (vélo non choisi), Client Test, DATE IN/OUT, SÉQUENCE DE TRAVAIL (eval/meca/ctrl En attente), AVANCEMENT (4 checkboxes : Envoyer l'évaluation / Éval. avec pills ↑✕⌛ / Bon de sortie / Archiver), pills toggle CLIENT/VÉLO, NOTE INTERNE textarea. Bas : NOTE POUR LE CLIENT textarea + pills ÉVAL/FACTURE, BDCTotaux pill noir "Services : 0,00 $ + Pièces 0,00 $ avance ? total 0,00 $". |
| 15 | [15-bdt-detail-onbench-vert-rempli.png](./15-bdt-detail-onbench-vert-rempli.png) | `/inventaire/0145` | **BDT ON BENCH rempli** : carte gauche VERT CLAIR (Rocky Mountain Metro 10), blocs Services + Pièces VERT CLAIR avec items, Forfait BASE, Rencontre dépôt, Install. câbles et gaines, etc. Total 252,57 $. Variante visuelle de 14 avec données. **Référence définitive pour Phase 3.2.** |

## Section 2 — Ventes

| # | Fichier | Page V1 | Notes clés pour V2 |
|---|---|---|---|
| 16 | [16-ventes-liste-cartes.png](./16-ventes-liste-cartes.png) | `/catalogue/ventes` | Liste ventes en **cards collapsibles** par n° vente. Une vente expandée (2026-04-24, François Cosmeau, "À FACTURER" jaune, 3 items Jagwire/Jagwire/Baradine) avec table items et total 27,71 $. Autres ventes V0001/V0002/V0003 collapsed (jaune background). |

## Section 3 — Services

| # | Fichier | Page V1 | Notes clés pour V2 |
|---|---|---|---|
| 17 | [17-services-catalogue.png](./17-services-catalogue.png) | `/catalogue/services` | 2 sections accordéon **headers jaunes** : "Forfaits" (3 items : BASE, BASE+, FULL) + "Services - À la carte" (~20 items : Ajust., Install., Régl., Net., Réparation, etc.). Table : flag fait, nom, durée, statut, prix, catégorie. |

## Section 4 — Pièces (4 onglets : catalogue / fournisseurs / commandes / réception)

| # | Fichier | Page V1 | Notes clés pour V2 |
|---|---|---|---|
| 18 | [18-pieces-modal-nouvelle.png](./18-pieces-modal-nouvelle.png) | `/catalogue/pieces` + modal | Modal "Nouvelle pièce" : flag, nom pièce, prix achat, qté, sku, sku URL, code-barre, prix base/vente/cost/BDC, qté à commander/stock/oos/surplus, notes, catégorie dropdown. Bouton AJOUTER jaune. |
| 19 | [19-pieces-catalogue.png](./19-pieces-catalogue.png) | `/catalogue/pieces` | **Accordéon catégories** (1. Direction / 2. Transmission / etc.). Sous-sections (Fourche, Guidon, Jeu de direction, Potence...). Tables denses : flag, nom, sku, qté à commander, prix achat/base/vente, stock, catégorie dropdown, action. |
| 20 | [20-pieces-fournisseurs.png](./20-pieces-fournisseurs.png) | `/catalogue/pieces?onglet=fournisseurs` | Mêmes pièces **regroupées par fournisseur** (Babac, etc.). Toolbar : onglets catalogue/fournisseurs/commandes/réception pills. |
| 21 | [21-pieces-commandes.png](./21-pieces-commandes.png) | `/catalogue/pieces?onglet=commandes` | Pièces "$" en commande regroupées par fournisseur (Babac/HLC/C&L). Bouton **"TRANSFÉRER EN RÉCEPTION" jaune** par bloc fournisseur. |
| 22 | [22-reception-po-collapsed.png](./22-reception-po-collapsed.png) | `/catalogue/reception` | **PO ouvert** HLC #LSO3579437 PARTIEL en **bandeau rose pâle** (statut). Liste d'historique des PO reçus en dessous (Babac, Mint'n Dry, HLC...) avec pills "REÇU" verts. |
| 23 | [23-reception-po-expanded.png](./23-reception-po-expanded.png) | `/catalogue/reception` (PO ouvert) | Même PO HLC mais expandé : **items en lignes vert clair**, dropdown catégorie **inline par ligne**, sku, qté/restant/reçu, prix, checkbox. Boutons "+ pièce" / "📷 SCANNER" / **"FINALISER LA RÉCEPTION" jaune** en bas. |
| 24 | [24-reception-modal-nouvelle.png](./24-reception-modal-nouvelle.png) | `/catalogue/reception` + modal | Modal "Nouvelle réception" : fournisseur dropdown, n° commande, dates début/fin. Boutons ANNULER + **CRÉER LE PO (0 ITEMS)** jaune. |
| 25 | [25-reception-modal-import-facture.png](./25-reception-modal-import-facture.png) | `/catalogue/reception` + modal | Modal "Import facture fournisseur" : drag&drop zone "Glisse un fichier .jpg, .heic ou clique pour sélectionner". |
| 26 | [26-reception-modal-creer-po-items.png](./26-reception-modal-creer-po-items.png) | `/catalogue/reception` + modal | Modal "Nouvelle réception" étendue avec sélecteur fournisseur (Babac) et **items listés en bas avec checkboxes** pour cocher quoi inclure dans le PO. Bouton CRÉER LE PO (X ITEMS) jaune. |

## Section 5 — Clients

| # | Fichier | Page V1 | Notes clés pour V2 |
|---|---|---|---|
| 27 | [27-clients-liste.png](./27-clients-liste.png) | `/clients` | Liste clients en **cards groupées par groupe** (séparateurs sections gris). Cards blanches alternées. Colonnes : nom, email, tél, dates, pills statuts à droite (DO NOT contact, RGPD, etc.). |
| 28 | [28-clients-modal-modifier.png](./28-clients-modal-modifier.png) | `/clients` + modal | Modal "Modifier client" : sections FICHE CONTACT (prénom/nom/courriel/tél/indicatif/lang/commPref/lead/remise/adresse postale/notes) + VÉLOS & BDT EN COURS (pills statuts) + Bouton ANNULER + ENREGISTRER jaune. |

---

## Patterns transversaux à retenir pour V2

### Couleurs statut BDT
- **JAUNE `#fff056`** : RV / REÇU — pré-inscription, vélo arrivé
- **VERT clair `#88fa4e` / `#5cd62b`** : ÉVAL. / ON BENCH / APPROUVÉ
- **ORANGE `#fb923c`** : EN ATTENTE (décision client)
- **ROSE pâle `#ffcdd2`** : FACTURÉ
- **GRIS `#e0e0e0`** : LIVRÉ
- **ROSE pâle (autre teinte)** : REFUSÉ (table archives)

⚠️ Sur la page BDT detail, la **couleur de fond de la carte gauche + des blocs
Services/Pièces suit le statut**. Pas de gris neutre — toujours coloré.

### Layout BDT detail (page la plus critique)
**3 colonnes desktop**, pas 4 zones empilées :
1. **Col gauche** (~280px, carte unifiée colorée) : id+pill, vélo, client, dates,
   séquence travail, AVANCEMENT 4 checkboxes, pills CLIENT/VÉLO, NOTE INTERNE
2. **Col centre** : bloc Services (table + remise %)
3. **Col droite** : bloc Pièces (table + remise + Cost)
4. **Bas** (sous centre+droite uniquement) : NOTE POUR LE CLIENT (+pills ÉVAL/FACTURE)
   et BDCTotaux pill noir côte-à-côte. La col gauche continue en dessous.

### Dropdowns customs
V1 utilise des dropdowns **custom** (fond noir, texte blanc, header coloré
"✓ Sélection →") pour client et marque. Pas de `<select>` natif. Liste alphabétique
dense + ligne "+ Ajouter X" en haut.

### Accordéon par catégorie
Pages Pièces (catalogue/fournisseurs/commandes) utilisent des **accordéons avec
headers jaunes** par catégorie/fournisseur. Permet une densité élevée d'info.

### Pages POs : statut = couleur de bandeau
PO actif PARTIEL = bandeau **rose pâle** en header. Quand expanded, items en **lignes
vert clair**.

---

## Utilisation en V2

1. **Avant de coder une refonte de page Phase 3**, ouvre le PNG correspondant et
   regarde la structure exacte.
2. **Ne pas réinventer** : si tu hésites sur un layout (densité, ordre des
   champs, choix entre dropdown natif et pills), V1 a déjà tranché — réfère.
3. **Si une zone V2 doit faire mieux que V1** (ex. accessibilité, mobile),
   documenter l'écart dans le PR.
