import type { SettingsSocial } from "./types";

export const SOCIAL_PLATFORMS = [
  "instagram",
  "linkedin",
  "tiktok",
  "facebook",
  "youtube",
  "x",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** Comptes possibles par plateforme (USM ou Christophe Mongai). */
export const SOCIAL_TARGETS = [
  { key: "usm", label: "USM" },
  { key: "christophe", label: "Christophe Mongai" },
] as const;
export type SocialTarget = (typeof SOCIAL_TARGETS)[number]["key"];

export interface SocialChoice {
  key: SocialTarget;
  label: string;
  url: string;
}

/** Normalise une URL (ajoute https:// si besoin, ignore les valeurs vides/#). */
function normalizeSocialUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url || url === "#") return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^www\./i.test(url)) return `https://${url}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return `https://${url}`;
  return "";
}

/** URL d'une plateforme pour un compte donné (imbriqué {usm}/{christophe} ou plat _usm/_christophe). */
export function socialUrlFor(social: SettingsSocial, platform: string, target: SocialTarget): string {
  const nested = social?.[platform]?.[target];
  const flat = social?.[`${platform}_${target}`];
  return normalizeSocialUrl(nested || flat || "");
}

/** Compat : URL USM d'une plateforme. */
export function socialUrl(social: SettingsSocial, platform: string): string {
  return socialUrlFor(social, platform, "usm");
}

/** Comptes (USM / Christophe) ayant une URL pour une plateforme. */
export function socialChoices(social: SettingsSocial, platform: string): SocialChoice[] {
  return SOCIAL_TARGETS
    .map((t) => ({ key: t.key, label: t.label, url: socialUrlFor(social, platform, t.key) }))
    .filter((c) => c.url);
}

/** Plateformes ayant au moins un compte, dans l'ordre. `url` = compte principal,
 *  `choices` = tous les comptes disponibles (pour le sélecteur USM/Christophe). */
export function activeSocials(
  social: SettingsSocial,
  order: readonly string[] = SOCIAL_PLATFORMS
): { key: string; url: string; choices: SocialChoice[] }[] {
  return order
    .map((key) => {
      const choices = socialChoices(social, key);
      return { key, url: choices[0]?.url || "", choices };
    })
    .filter((s) => s.url);
}
