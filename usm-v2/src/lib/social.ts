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

/** Lit l'URL USM d'une plateforme, qu'elle soit imbriquée ({usm}) ou plate (_usm). */
export function socialUrl(social: SettingsSocial, platform: string): string {
  return social?.[platform]?.usm || social?.[`${platform}_usm`] || "";
}

/** Plateformes ayant une URL USM, dans l'ordre, pour le rendu des icônes. */
export function activeSocials(
  social: SettingsSocial,
  order: readonly string[] = SOCIAL_PLATFORMS
): { key: string; url: string }[] {
  return order
    .map((key) => ({ key, url: socialUrl(social, key) }))
    .filter((s) => s.url);
}
