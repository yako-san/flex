export type WorkshopInfo = {
  name: string;
  logoBase64?: string | null;
  fiscalEntity?: {
    raisonSociale?: string;
    tagline?: string;
    adresseLigne1?: string;
    adresseLigne2?: string;
    ville?: string;
    province?: string;
    codePostal?: string;
    pays?: string;
    telephone?: string;
    courriel?: string;
    siteWeb?: string;
    neq?: string;
    tps?: string;
    tvq?: string;
    footerText?: string;
  } | null;
};

export type ClientInfo = {
  prenom: string;
  nom: string;
  telephone: string | null;
  indicatif: string | null;
  courriel: string | null;
};

export type VeloInfo = {
  veloNumero: number;
  marque: string | null;
  modele: string | null;
  couleur: string | null;
  taille: string | null;
  numeroSerie: string | null;
};

export type ItemRow = {
  position: number;
  kind: 'SERVICE' | 'PIECE' | 'FORFAIT';
  label: string;
  sku: string | null;
  qty: number;
  unitPrice: number;
  total: number;
};
