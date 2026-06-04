import { useEffect, useRef, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Button, Input, Textarea, Field, Card, Spinner, Dialog, Badge } from "@/components/ui/kit";
import { useToast } from "@/components/ui/toast";
import { loadImageFromFile, resizeToWebP, uploadWebP, ts } from "@/lib/admin/image";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";

// Le crop est une MÉTADONNÉE (l'image n'est pas recadrée). Le front applique
// translate(x%, y%) scale(zoom) en CSS. Mêmes bornes ici qu'au rendu.
interface Crop { x: number; y: number; zoom: number }
const LANGS = ["fr", "en", "es", "pt"] as const;
type Lang = (typeof LANGS)[number];
const LANG_LABELS: Record<Lang, string> = { fr: "FR", en: "EN", es: "ES", pt: "PT" };

interface LangFields { title: string; subtitle: string; desc: string; seo: string }
type LangState = Record<Lang, LangFields>;

interface Service {
  id: string;
  image_url?: string;
  card_crop?: Crop;
  hero_crop?: Crop;
  order?: number;
  [k: string]: any;
}

const emptyCrop: Crop = { x: 0, y: 0, zoom: 1 };
const emptyLangFields = (): LangFields => ({ title: "", subtitle: "", desc: "", seo: "" });
const emptyLangState = (): LangState => ({ fr: emptyLangFields(), en: emptyLangFields(), es: emptyLangFields(), pt: emptyLangFields() });

function langStateFromDoc(s: Service): LangState {
  const st = emptyLangState();
  for (const l of LANGS) {
    st[l] = {
      title: s[`title_${l}`] || "",
      subtitle: s[`subtitle_${l}`] || "",
      desc: s[`desc_${l}`] || "",
      seo: s[`seo_${l}`] || "",
    };
  }
  return st;
}

// Cadre d'aperçu : reproduit exactement le CSS du front.
function CropPreview({
  src, crop, onChange, ratio, label,
}: {
  src: string; crop: Crop; onChange: (c: Crop) => void; ratio: string; label: string;
}) {
  const drag = useRef<{ sx: number; sy: number; x: number; y: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (!src) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, x: crop.x, y: crop.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dxPct = ((e.clientX - drag.current.sx) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.current.sy) / rect.height) * 100;
    const clamp = (v: number) => Math.max(-45, Math.min(45, v));
    onChange({ ...crop, x: Math.round(clamp(drag.current.x + dxPct)), y: Math.round(clamp(drag.current.y + dyPct)) });
  }
  function onPointerUp() { drag.current = null; }

  return (
    <div className="flex-1">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-secondary"
        style={{ aspectRatio: ratio, touchAction: "none", cursor: src ? "grab" : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {src ? (
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${crop.x}%, ${crop.y}%) scale(${crop.zoom})`,
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Aucune image</div>
        )}
      </div>
      <div className="mt-2 space-y-1.5">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-10">X {crop.x}</span>
          <input type="range" min={-45} max={45} step={1} value={crop.x}
            onChange={(e) => onChange({ ...crop, x: +e.target.value })} className="flex-1" disabled={!src} />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-10">Y {crop.y}</span>
          <input type="range" min={-45} max={45} step={1} value={crop.y}
            onChange={(e) => onChange({ ...crop, y: +e.target.value })} className="flex-1" disabled={!src} />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-10">Z {crop.zoom.toFixed(2)}</span>
          <input type="range" min={0.55} max={3} step={0.01} value={crop.zoom}
            onChange={(e) => onChange({ ...crop, zoom: +e.target.value })} className="flex-1" disabled={!src} />
        </label>
      </div>
    </div>
  );
}

export default function ServicesModule() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>("fr");
  const [fields, setFields] = useState<LangState>(emptyLangState());
  const [existingImg, setExistingImg] = useState("");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState(""); // URL d'aperçu (nouvelle image ou existante)
  const [cardCrop, setCardCrop] = useState<Crop>({ ...emptyCrop });
  const [heroCrop, setHeroCrop] = useState<Crop>({ ...emptyCrop });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(collection(db, "services"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Service[];
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setServices(list);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null);
    setActiveLang("fr");
    setFields(emptyLangState());
    setExistingImg(""); setImg(null); setPreview("");
    setCardCrop({ ...emptyCrop }); setHeroCrop({ ...emptyCrop });
    setOpen(true);
  }
  function openEdit(s: Service) {
    setEditId(s.id);
    setActiveLang("fr");
    setFields(langStateFromDoc(s));
    setExistingImg(s.image_url || "");
    setImg(null);
    setPreview(s.image_url || "");
    setCardCrop({ ...emptyCrop, ...(s.card_crop || {}) });
    setHeroCrop({ ...emptyCrop, ...(s.hero_crop || {}) });
    setOpen(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const image = await loadImageFromFile(file);
      setImg(image);
      setPreview(image.src);
    } catch { toast("Image illisible", "error"); }
  }

  function setField(key: keyof LangFields, value: string) {
    setFields((f) => ({ ...f, [activeLang]: { ...f[activeLang], [key]: value } }));
  }

  async function save() {
    if (!fields.fr.title.trim()) { toast("Le titre FR est requis", "error"); return; }
    setSaving(true);
    try {
      let image_url = existingImg;
      if (img) {
        const blob = await resizeToWebP(img, 1200, 0.8);
        image_url = await uploadWebP(`services/${ts()}.webp`, blob);
      }
      const payload: any = {
        image_url,
        card_crop: cardCrop,
        hero_crop: heroCrop,
      };
      for (const l of LANGS) {
        payload[`title_${l}`] = fields[l].title.trim();
        payload[`subtitle_${l}`] = fields[l].subtitle.trim();
        payload[`desc_${l}`] = fields[l].desc.trim();
        payload[`seo_${l}`] = fields[l].seo.trim();
      }
      if (editId) {
        await updateDoc(doc(db, "services", editId), payload);
        toast("Service mis à jour", "success");
      } else {
        payload.order = services.length + 1;
        payload.timestamp = serverTimestamp();
        await addDoc(collection(db, "services"), payload);
        toast("Service ajouté", "success");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Service) {
    if (!confirm(`Supprimer le service "${s.title_fr || ""}" ?`)) return;
    try {
      await deleteDoc(doc(db, "services", s.id));
      toast("Service supprimé", "success");
      setServices((list) => list.filter((x) => x.id !== s.id));
    } catch { toast("Erreur suppression", "error"); }
  }

  async function move(s: Service, dir: -1 | 1) {
    const idx = services.findIndex((x) => x.id === s.id);
    const other = services[idx + dir];
    if (!other) return;
    const a = s.order ?? 0, b = other.order ?? 0;
    try {
      await Promise.all([
        updateDoc(doc(db, "services", s.id), { order: b }),
        updateDoc(doc(db, "services", other.id), { order: a }),
      ]);
      await load();
    } catch { toast("Erreur réordonnancement", "error"); }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Services <Badge>{services.length}</Badge></h1>
        <Button onClick={openNew}><Plus size={18} /> Ajouter un service</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Card key={s.id} className="flex gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                {s.image_url && <img src={s.image_url} alt={s.title_fr} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.title_fr || "(sans titre)"}</p>
                <p className="truncate text-xs text-muted-foreground">{s.subtitle_fr || "—"}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)} aria-label="Éditer"><Pencil size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => move(s, -1)} disabled={i === 0} aria-label="Monter"><ArrowUp size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => move(s, 1)} disabled={i === services.length - 1} aria-label="Descendre"><ArrowDown size={14} /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(s)} aria-label="Supprimer"><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          ))}
          {services.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Aucun service.</p>}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editId ? "Modifier le service" : "Nouveau service"} className="max-w-3xl">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Colonne texte multilingue */}
          <div>
            <div className="mb-3 flex gap-1">
              {LANGS.map((l) => (
                <button key={l} type="button" onClick={() => setActiveLang(l)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${activeLang === l ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
            <Field label={`Titre (${LANG_LABELS[activeLang]})`}>
              <Input value={fields[activeLang].title} onChange={(e) => setField("title", e.target.value)} />
            </Field>
            <Field label={`Sous-titre (${LANG_LABELS[activeLang]})`}>
              <Input value={fields[activeLang].subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
            </Field>
            <Field label={`Description (${LANG_LABELS[activeLang]})`}>
              <Textarea value={fields[activeLang].desc} onChange={(e) => setField("desc", e.target.value)} />
            </Field>
            <Field label={`SEO (${LANG_LABELS[activeLang]})`}>
              <Textarea value={fields[activeLang].seo} onChange={(e) => setField("seo", e.target.value)} className="min-h-16" />
            </Field>
          </div>

          {/* Colonne image + double crop */}
          <div>
            <Field label="Image">
              <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
            </Field>
            <div className="flex gap-3">
              <CropPreview src={preview} crop={cardCrop} onChange={setCardCrop} ratio="1 / 1" label="Carte" />
              <CropPreview src={preview} crop={heroCrop} onChange={setHeroCrop} ratio="16 / 6" label="Hero" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Glissez l'image ou utilisez les curseurs. Le recadrage est une métadonnée (appliquée en CSS sur le site).</p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving}>{saving ? <Spinner /> : "Enregistrer"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
