import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase-client";
import { Button, Input, Textarea, Field, Card, Spinner, Badge } from "@/components/ui/kit";
import { useToast } from "@/components/ui/toast";
import { loadImageFromFile, resizeToWebP, uploadWebP, ts } from "@/lib/admin/image";
import { Save, Upload, RefreshCw, Settings as SettingsIcon, Building2, Share2, Youtube } from "lucide-react";

type Lang = "fr" | "en" | "es" | "pt";
const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "es", label: "ES" },
  { key: "pt", label: "PT" },
];

type Tab = "general" | "agency" | "social";
const TABS: { key: Tab; label: string; icon: typeof SettingsIcon }[] = [
  { key: "general", label: "Général", icon: SettingsIcon },
  { key: "agency", label: "Agence", icon: Building2 },
  { key: "social", label: "Réseaux", icon: Share2 },
];

const PLATFORMS: { key: string; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X (Twitter)" },
];

// ---- Petit sélecteur de langue réutilisable -----------------------------
function LangTabs({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="mb-3 flex gap-1">
      {LANGS.map((l) => (
        <button
          key={l.key}
          type="button"
          onClick={() => setLang(l.key)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
            lang === l.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

// ---- Champ d'upload image avec aperçu ------------------------------------
function ImageField({
  label,
  current,
  onPick,
}: {
  label: string;
  current: string;
  onPick: (img: HTMLImageElement | null) => void;
}) {
  const toast = useToast();
  const [picked, setPicked] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const image = await loadImageFromFile(file);
      onPick(image);
      setPicked(true);
    } catch {
      toast("Image illisible", "error");
    }
  }

  return (
    <Field label={label}>
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
          {current ? (
            <img src={current} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">Aucune</div>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground"
          />
          {picked && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
              <Upload size={12} /> Nouvelle image prête (sera envoyée à l'enregistrement)
            </p>
          )}
        </div>
      </div>
    </Field>
  );
}

export default function SettingsModule() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(true);

  // ---- GÉNÉRAL ----
  const [gLang, setGLang] = useState<Lang>("fr");
  const [logoNavUrl, setLogoNavUrl] = useState("");
  const [logoHeroUrl, setLogoHeroUrl] = useState("");
  const [founderUrl, setFounderUrl] = useState("");
  const [logoNavImg, setLogoNavImg] = useState<HTMLImageElement | null>(null);
  const [logoHeroImg, setLogoHeroImg] = useState<HTMLImageElement | null>(null);
  const [founderImg, setFounderImg] = useState<HTMLImageElement | null>(null);
  const [founderQuote, setFounderQuote] = useState<Record<Lang, string>>({ fr: "", en: "", es: "", pt: "" });
  const [founderDesc, setFounderDesc] = useState<Record<Lang, string>>({ fr: "", en: "", es: "", pt: "" });
  const [stat1, setStat1] = useState("");
  const [stat2, setStat2] = useState("");
  const [stat3, setStat3] = useState("");
  const [stat4, setStat4] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);

  // ---- AGENCE ----
  const [aLang, setALang] = useState<Lang>("fr");
  const [agencyUrl, setAgencyUrl] = useState("");
  const [agencyImg, setAgencyImg] = useState<HTMLImageElement | null>(null);
  const [agencyQuote, setAgencyQuote] = useState<Record<Lang, string>>({ fr: "", en: "", es: "", pt: "" });
  const [agencyDesc, setAgencyDesc] = useState<Record<Lang, string>>({ fr: "", en: "", es: "", pt: "" });
  const [savingAgency, setSavingAgency] = useState(false);

  // ---- RÉSEAUX ----
  const [social, setSocial] = useState<Record<string, { usm: string; christophe: string }>>(
    Object.fromEntries(PLATFORMS.map((p) => [p.key, { usm: "", christophe: "" }]))
  );
  const [savingSocial, setSavingSocial] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [gSnap, aSnap, sSnap] = await Promise.all([
          getDoc(doc(db, "settings", "general")),
          getDoc(doc(db, "settings", "agency")),
          getDoc(doc(db, "settings", "social")),
        ]);

        if (gSnap.exists()) {
          const g = gSnap.data() as any;
          setLogoNavUrl(g.logoNav || "");
          setLogoHeroUrl(g.logoHero || "");
          setFounderUrl(g.founderImg || "");
          setFounderQuote({
            fr: g.founderQuote_fr || "", en: g.founderQuote_en || "",
            es: g.founderQuote_es || "", pt: g.founderQuote_pt || "",
          });
          setFounderDesc({
            fr: g.founderDesc_fr || "", en: g.founderDesc_en || "",
            es: g.founderDesc_es || "", pt: g.founderDesc_pt || "",
          });
          setStat1(g.stat1 || "");
          setStat2(g.stat2 || "");
          setStat3(g.stat3 || "");
          setStat4(g.stat4 || "");
        }

        if (aSnap.exists()) {
          const a = aSnap.data() as any;
          setAgencyUrl(a.image || "");
          setAgencyQuote({
            fr: a.quote_fr || "", en: a.quote_en || "",
            es: a.quote_es || "", pt: a.quote_pt || "",
          });
          setAgencyDesc({
            fr: a.desc_fr || "", en: a.desc_en || "",
            es: a.desc_es || "", pt: a.desc_pt || "",
          });
        }

        if (sSnap.exists()) {
          const s = sSnap.data() as any;
          setSocial(
            Object.fromEntries(
              PLATFORMS.map((p) => [
                p.key,
                {
                  usm: s[p.key]?.usm || s[`${p.key}_usm`] || "",
                  christophe: s[p.key]?.christophe || s[`${p.key}_christophe`] || "",
                },
              ])
            )
          );
        }
      } catch (e: any) {
        toast("Erreur de chargement : " + (e?.message || "échec"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveGeneral() {
    setSavingGeneral(true);
    try {
      let logoNav = logoNavUrl, logoHero = logoHeroUrl, founder = founderUrl;
      if (logoNavImg) {
        logoNav = await uploadWebP(`site/logo_nav_${ts()}.webp`, await resizeToWebP(logoNavImg, 1200, 0.8));
      }
      if (logoHeroImg) {
        logoHero = await uploadWebP(`site/logo_hero_${ts()}.webp`, await resizeToWebP(logoHeroImg, 1200, 0.8));
      }
      if (founderImg) {
        founder = await uploadWebP(`site/founder_${ts()}.webp`, await resizeToWebP(founderImg, 1200, 0.8));
      }
      const payload = {
        logoNav, logoHero, founderImg: founder,
        founderQuote_fr: founderQuote.fr, founderQuote_en: founderQuote.en,
        founderQuote_es: founderQuote.es, founderQuote_pt: founderQuote.pt,
        founderDesc_fr: founderDesc.fr, founderDesc_en: founderDesc.en,
        founderDesc_es: founderDesc.es, founderDesc_pt: founderDesc.pt,
        stat1, stat2, stat3, stat4,
      };
      await setDoc(doc(db, "settings", "general"), payload, { merge: true });
      // Synchronise les états avec les URLs uploadées + réinitialise les images choisies.
      setLogoNavUrl(logoNav); setLogoHeroUrl(logoHero); setFounderUrl(founder);
      setLogoNavImg(null); setLogoHeroImg(null); setFounderImg(null);
      toast("Réglages généraux enregistrés", "success");
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSavingGeneral(false);
    }
  }

  async function saveAgency() {
    setSavingAgency(true);
    try {
      let image = agencyUrl;
      if (agencyImg) {
        image = await uploadWebP(`site/agency_${ts()}.webp`, await resizeToWebP(agencyImg, 1200, 0.8));
      }
      const payload = {
        image,
        quote_fr: agencyQuote.fr, quote_en: agencyQuote.en,
        quote_es: agencyQuote.es, quote_pt: agencyQuote.pt,
        desc_fr: agencyDesc.fr, desc_en: agencyDesc.en,
        desc_es: agencyDesc.es, desc_pt: agencyDesc.pt,
      };
      await setDoc(doc(db, "settings", "agency"), payload, { merge: true });
      setAgencyUrl(image);
      setAgencyImg(null);
      toast("Agence enregistrée", "success");
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSavingAgency(false);
    }
  }

  async function saveSocial() {
    setSavingSocial(true);
    try {
      // Écriture imbriquée par plateforme ; merge préserve followers / autres champs.
      const payload = Object.fromEntries(
        PLATFORMS.map((p) => [
          p.key,
          { usm: social[p.key]?.usm || "", christophe: social[p.key]?.christophe || "" },
        ])
      );
      await setDoc(doc(db, "settings", "social"), payload, { merge: true });
      toast("Réseaux enregistrés", "success");
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSavingSocial(false);
    }
  }

  async function syncYoutube() {
    setSyncing(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast("Non authentifié", "error");
        return;
      }
      const res = await fetch("/api/refreshSocialStatsNow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (await user.getIdToken()),
        },
        body: JSON.stringify({ provider: "youtube" }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${txt ? " — " + txt : ""}`);
      }
      toast("Synchronisation YouTube lancée", "success");
    } catch (e: any) {
      toast("Erreur sync : " + (e?.message || "échec"), "error");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Réglages</h1>
      </div>

      {/* Sous-onglets */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ---------------- GÉNÉRAL ---------------- */}
      {tab === "general" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Logos & image du fondateur</h2>
            <ImageField label="Logo navigation" current={logoNavUrl} onPick={setLogoNavImg} />
            <ImageField label="Logo héro (accueil)" current={logoHeroUrl} onPick={setLogoHeroImg} />
            <ImageField label="Image du fondateur" current={founderUrl} onPick={setFounderImg} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Citation & description du fondateur</h2>
            <LangTabs lang={gLang} setLang={setGLang} />
            <Field label={`Citation (${gLang.toUpperCase()})`}>
              <Input
                value={founderQuote[gLang]}
                onChange={(e) => setFounderQuote((s) => ({ ...s, [gLang]: e.target.value }))}
              />
            </Field>
            <Field label={`Description (${gLang.toUpperCase()})`}>
              <Textarea
                value={founderDesc[gLang]}
                onChange={(e) => setFounderDesc((s) => ({ ...s, [gLang]: e.target.value }))}
              />
            </Field>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Statistiques (page d'accueil)</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Statistique 1"><Input value={stat1} onChange={(e) => setStat1(e.target.value)} /></Field>
              <Field label="Statistique 2"><Input value={stat2} onChange={(e) => setStat2(e.target.value)} /></Field>
              <Field label="Statistique 3"><Input value={stat3} onChange={(e) => setStat3(e.target.value)} /></Field>
              <Field label="Statistique 4"><Input value={stat4} onChange={(e) => setStat4(e.target.value)} /></Field>
            </div>
          </Card>

          <div className="lg:col-span-2 flex justify-end">
            <Button onClick={saveGeneral} disabled={savingGeneral}>
              {savingGeneral ? <Spinner /> : <><Save size={18} /> Enregistrer</>}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- AGENCE ---------------- */}
      {tab === "agency" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Image de l'agence</h2>
            <ImageField label="Image" current={agencyUrl} onPick={setAgencyImg} />
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Citation & description</h2>
            <LangTabs lang={aLang} setLang={setALang} />
            <Field label={`Citation (${aLang.toUpperCase()})`}>
              <Input
                value={agencyQuote[aLang]}
                onChange={(e) => setAgencyQuote((s) => ({ ...s, [aLang]: e.target.value }))}
              />
            </Field>
            <Field label={`Description (${aLang.toUpperCase()})`}>
              <Textarea
                value={agencyDesc[aLang]}
                onChange={(e) => setAgencyDesc((s) => ({ ...s, [aLang]: e.target.value }))}
              />
            </Field>
          </Card>

          <div className="lg:col-span-2 flex justify-end">
            <Button onClick={saveAgency} disabled={savingAgency}>
              {savingAgency ? <Spinner /> : <><Save size={18} /> Enregistrer</>}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------- RÉSEAUX ---------------- */}
      {tab === "social" && (
        <div className="grid gap-5">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Liens des réseaux sociaux</h2>
              <Button variant="outline" onClick={syncYoutube} disabled={syncing}>
                {syncing ? <Spinner /> : <><Youtube size={18} /> Synchroniser YouTube</>}
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {PLATFORMS.map((p) => (
                <div key={p.key} className="rounded-lg border border-border p-4">
                  <h3 className="mb-3 font-medium">
                    {p.label} {p.key === "youtube" && <Badge>API</Badge>}
                  </h3>
                  <Field label="URL USM">
                    <Input
                      placeholder="https://..."
                      value={social[p.key]?.usm || ""}
                      onChange={(e) =>
                        setSocial((s) => ({ ...s, [p.key]: { ...s[p.key], usm: e.target.value } }))
                      }
                    />
                  </Field>
                  <Field label="URL Christophe">
                    <Input
                      placeholder="https://..."
                      value={social[p.key]?.christophe || ""}
                      onChange={(e) =>
                        setSocial((s) => ({ ...s, [p.key]: { ...s[p.key], christophe: e.target.value } }))
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={saveSocial} disabled={savingSocial}>
                {savingSocial ? <Spinner /> : <><Save size={18} /> Enregistrer</>}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
