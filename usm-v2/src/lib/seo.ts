import { LOCALES, localePrefix, type Locale } from "./i18n";

// URL du site. Staging pour l'instant ; à basculer sur la prod au cutover.
export const SITE_URL = "https://usm-v2-staging.web.app";

export function abs(path: string): string {
  return new URL(path, SITE_URL).href;
}

/** Chemin localisé pour une langue (FR sans préfixe). */
export function localizedPath(locale: Locale, path: string): string {
  const p = path === "/" ? "" : path;
  return `${localePrefix(locale)}${p || "/"}`;
}

export interface Alternate {
  lang: string;
  href: string;
}

/** Alternates hreflang pour un chemin (sans préfixe de langue), + x-default. */
export function hreflangAlternates(path: string): Alternate[] {
  const alts: Alternate[] = LOCALES.map((l) => ({
    lang: l,
    href: abs(localizedPath(l, path)),
  }));
  alts.push({ lang: "x-default", href: abs(path) });
  return alts;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "USM Football",
    alternateName: "Agence USM Football",
    url: SITE_URL + "/",
    logo: abs("/favicon.png"),
    description:
      "Agence de gestion de carrière sportive accompagnant les footballeurs professionnels depuis 1998.",
    foundingDate: "1998",
    email: "contact@usmfootball.com",
    telephone: "+33668603001",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+33668603001",
      email: "contact@usmfootball.com",
      contactType: "customer service",
      availableLanguage: ["French", "English", "Spanish", "Portuguese"],
    },
  };
}

export function serviceJsonLd(opts: {
  name: string;
  description?: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.name,
    description: (opts.description || "").replace(/\s+/g, " ").trim().slice(0, 300) || undefined,
    url: opts.url,
    image: opts.image || undefined,
    provider: {
      "@type": "Organization",
      name: "USM Football",
      url: SITE_URL + "/",
    },
  };
}
