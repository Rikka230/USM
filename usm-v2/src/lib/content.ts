// Chargement & mise en forme du contenu au build (memoïsé sur tout le build).
import { fetchCollection, fetchDoc } from "./firebase-build";
import type {
  SiteContent, Service, Player, PresseVideo, PresseArticle,
  MarqueeImage, SettingsGeneral, SettingsAgency, SettingsSocial,
} from "./types";
import { localizedField } from "./i18n";

let _cache: SiteContent | null = null;

const byOrder = (a: { order?: number }, b: { order?: number }) =>
  (a.order ?? 0) - (b.order ?? 0);

export async function loadSiteContent(): Promise<SiteContent> {
  if (_cache) return _cache;
  const [general, agency, social, services, players, presseVideos, presseArticles, marquee] =
    await Promise.all([
      fetchDoc<SettingsGeneral>("settings", "general"),
      fetchDoc<SettingsAgency>("settings", "agency"),
      fetchDoc<SettingsSocial>("settings", "social"),
      fetchCollection<Service>("services"),
      fetchCollection<Player>("players"),
      fetchCollection<PresseVideo>("presse_videos"),
      fetchCollection<PresseArticle>("presse_articles"),
      fetchCollection<MarqueeImage>("marquee_images"),
    ]);

  _cache = {
    general: general ?? {},
    agency: agency ?? {},
    social: social ?? {},
    services: services.sort(byOrder),
    players: players.sort(byOrder),
    presseVideos: presseVideos.sort(byOrder),
    presseArticles: presseArticles.sort(byOrder),
    marquee: marquee.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
  };
  return _cache;
}

export const PLAYER_CATEGORIES = [
  "gardien", "defenseur", "milieu", "attaquant", "feminine", "coach",
] as const;

export function playersByCategory(players: Player[]): Record<string, Player[]> {
  const map: Record<string, Player[]> = {};
  for (const cat of PLAYER_CATEGORIES) map[cat] = [];
  for (const p of players) {
    (map[p.category] ??= []).push(p);
  }
  return map;
}

/** Slug URL : minuscule, sans accents, tirets. */
export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function serviceSlug(s: Service): string {
  return slugify(localizedField(s, "title", "fr")) || s.id;
}

/** Table slug -> service (unicité garantie par suffixe id si collision). */
export function serviceSlugMap(services: Service[]): Map<string, Service> {
  const map = new Map<string, Service>();
  const seen = new Set<string>();
  for (const s of services) {
    let slug = serviceSlug(s);
    if (seen.has(slug)) slug = `${slug}-${s.id.slice(0, 5)}`;
    seen.add(slug);
    map.set(slug, s);
  }
  return map;
}
