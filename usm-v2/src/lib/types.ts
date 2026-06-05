// Types de contenu — alignés exactement sur le schéma Firestore de la prod
// (cf. inventaire admin dans USM_Memory). NE PAS renommer les champs.

export interface Crop {
  x: number;
  y: number;
  zoom: number;
}

export type PlayerCategory =
  | "gardien"
  | "defenseur"
  | "milieu"
  | "attaquant"
  | "feminine"
  | "coach";

export interface Player {
  id: string;
  name: string;
  category: PlayerCategory | string;
  stat?: string;
  transfermarkt?: string;
  image_url?: string;
  order?: number;
}

export interface Service {
  id: string;
  image_url?: string;
  card_crop?: Crop;
  hero_crop?: Crop;
  order?: number;
  // champs multilingues : title_fr, subtitle_en, desc_es, seo_pt, ...
  [key: string]: any;
}

export interface PresseVideo {
  id: string;
  title: string;
  description?: string;
  url: string;
  order?: number;
}

export interface PresseArticle {
  id: string;
  title: string;
  description?: string;
  link?: string;
  image_url?: string;
  order?: number;
}

export interface MarqueeImage {
  id: string;
  image_url: string;
  crop?: Crop;
  /** Texte alternatif / nom SEO de l'image (indexation Google Images). */
  alt?: string;
  timestamp?: number;
}

export interface SettingsGeneral {
  logoNav?: string;
  logoHero?: string;
  founderImg?: string;
  stat1?: string;
  stat2?: string;
  stat3?: string;
  stat4?: string;
  [key: string]: any; // founderQuote_fr, founderDesc_en, ...
}

export interface SettingsAgency {
  image?: string;
  [key: string]: any; // quote_fr, desc_en, ...
}

export type SettingsSocial = Record<string, any>;

export interface SiteContent {
  general: SettingsGeneral;
  agency: SettingsAgency;
  social: SettingsSocial;
  services: Service[];
  players: Player[];
  presseVideos: PresseVideo[];
  presseArticles: PresseArticle[];
  marquee: MarqueeImage[];
}
