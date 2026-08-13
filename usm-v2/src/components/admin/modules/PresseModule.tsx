import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Button, Input, Textarea, Field, Card, Spinner, Dialog, Badge } from "@/components/ui/kit";
import { useToast } from "@/components/ui/toast";
import { loadImageFromFile, resizeToWebP, uploadWebP, ts } from "@/lib/admin/image";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, ExternalLink, Youtube, Newspaper } from "lucide-react";

interface PresseVideo {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  order?: number;
}

interface PresseArticle {
  id: string;
  title?: string;
  description?: string;
  link?: string;
  image_url?: string;
  order?: number;
}

/** Normalise une URL YouTube (watch?v=ID, youtu.be/ID, /embed/ID) en URL embed propre, sans paramètres. */
function toEmbedUrl(raw: string): string {
  const v = (raw || "").trim();
  if (!v) return "";
  let id = "";
  try {
    const u = new URL(v);
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.split("/").filter(Boolean)[0] || "";
    } else if (u.pathname.includes("/embed/")) {
      id = u.pathname.split("/embed/")[1]?.split("/")[0] || "";
    } else if (u.searchParams.get("v")) {
      id = u.searchParams.get("v") || "";
    } else if (u.pathname.includes("/shorts/")) {
      id = u.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    }
  } catch {
    // pas une URL valide : on tente de récupérer un ID brut
    const m = v.match(/[\w-]{11}/);
    if (m) id = m[0];
  }
  if (!id) return v;
  return `https://www.youtube.com/embed/${id}`;
}

export default function PresseModule() {
  const toast = useToast();
  const [tab, setTab] = useState<"videos" | "articles">("videos");

  // ---- Vidéos TV ----
  const [videos, setVideos] = useState<PresseVideo[]>([]);
  const [loadingV, setLoadingV] = useState(true);
  const [openV, setOpenV] = useState(false);
  const [editVId, setEditVId] = useState<string | null>(null);
  const [vTitle, setVTitle] = useState("");
  const [vDesc, setVDesc] = useState("");
  const [vUrl, setVUrl] = useState("");
  const [savingV, setSavingV] = useState(false);

  // ---- Articles ----
  const [articles, setArticles] = useState<PresseArticle[]>([]);
  const [loadingA, setLoadingA] = useState(true);
  const [openA, setOpenA] = useState(false);
  const [editAId, setEditAId] = useState<string | null>(null);
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aLink, setALink] = useState("");
  const [aExistingImg, setAExistingImg] = useState("");
  const [aImg, setAImg] = useState<HTMLImageElement | null>(null);
  const [aPreview, setAPreview] = useState("");
  const [savingA, setSavingA] = useState(false);

  async function loadVideos() {
    setLoadingV(true);
    const snap = await getDocs(collection(db, "presse_videos"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PresseVideo[];
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setVideos(list);
    setLoadingV(false);
  }
  async function loadArticles() {
    setLoadingA(true);
    const snap = await getDocs(collection(db, "presse_articles"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PresseArticle[];
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setArticles(list);
    setLoadingA(false);
  }
  useEffect(() => { loadVideos(); loadArticles(); }, []);

  // ===== Vidéos : CRUD =====
  function openNewV() {
    setEditVId(null); setVTitle(""); setVDesc(""); setVUrl(""); setOpenV(true);
  }
  function openEditV(v: PresseVideo) {
    setEditVId(v.id); setVTitle(v.title || ""); setVDesc(v.description || ""); setVUrl(v.url || ""); setOpenV(true);
  }
  async function saveV() {
    if (!vTitle.trim()) { toast("Le titre est requis", "error"); return; }
    const embed = toEmbedUrl(vUrl);
    if (!embed) { toast("L'URL de la vidéo est requise", "error"); return; }
    setSavingV(true);
    try {
      const payload: any = { title: vTitle.trim(), description: vDesc.trim(), url: embed };
      if (editVId) {
        await updateDoc(doc(db, "presse_videos", editVId), payload);
        toast("Vidéo mise à jour", "success");
      } else {
        payload.order = videos.length + 1;
        payload.timestamp = serverTimestamp();
        await addDoc(collection(db, "presse_videos"), payload);
        toast("Vidéo ajoutée", "success");
      }
      setOpenV(false);
      await loadVideos();
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSavingV(false);
    }
  }
  async function removeV(v: PresseVideo) {
    if (!confirm(`Supprimer la vidéo « ${v.title || "sans titre"} » ?`)) return;
    try {
      await deleteDoc(doc(db, "presse_videos", v.id));
      toast("Vidéo supprimée", "success");
      setVideos((list) => list.filter((x) => x.id !== v.id));
    } catch { toast("Erreur suppression", "error"); }
  }
  async function moveV(v: PresseVideo, dir: -1 | 1) {
    const idx = videos.findIndex((x) => x.id === v.id);
    const other = videos[idx + dir];
    if (!other) return;
    const a = v.order ?? 0, b = other.order ?? 0;
    try {
      await Promise.all([
        updateDoc(doc(db, "presse_videos", v.id), { order: b }),
        updateDoc(doc(db, "presse_videos", other.id), { order: a }),
      ]);
      await loadVideos();
    } catch { toast("Erreur réordonnancement", "error"); }
  }

  // ===== Articles : CRUD =====
  function openNewA() {
    setEditAId(null); setATitle(""); setADesc(""); setALink("");
    setAExistingImg(""); setAImg(null); setAPreview(""); setOpenA(true);
  }
  function openEditA(a: PresseArticle) {
    setEditAId(a.id); setATitle(a.title || ""); setADesc(a.description || ""); setALink(a.link || "");
    setAExistingImg(a.image_url || ""); setAImg(null); setAPreview(""); setOpenA(true);
  }
  async function onFileA(file: File | undefined) {
    if (!file) return;
    try {
      const image = await loadImageFromFile(file);
      setAImg(image);
      setAPreview(image.src);
    } catch { toast("Image illisible", "error"); }
  }
  async function saveA() {
    if (!aTitle.trim()) { toast("Le titre est requis", "error"); return; }
    setSavingA(true);
    try {
      let image_url = aExistingImg;
      if (aImg) {
        const blob = await resizeToWebP(aImg, 1200, 0.8);
        image_url = await uploadWebP(`presse/article_${ts()}.webp`, blob);
      }
      const payload: any = {
        title: aTitle.trim(), description: aDesc.trim(), link: aLink.trim(), image_url,
      };
      if (editAId) {
        await updateDoc(doc(db, "presse_articles", editAId), payload);
        toast("Article mis à jour", "success");
      } else {
        // Nouvel article : ordre le plus petit -> apparaît en premier (admin + site public).
        payload.order = articles.length
          ? Math.min(...articles.map((a) => a.order ?? 0)) - 1
          : 1;
        payload.timestamp = serverTimestamp();
        await addDoc(collection(db, "presse_articles"), payload);
        toast("Article ajouté", "success");
      }
      setOpenA(false);
      await loadArticles();
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSavingA(false);
    }
  }
  async function removeA(a: PresseArticle) {
    if (!confirm(`Supprimer l'article « ${a.title || "sans titre"} » ?`)) return;
    try {
      await deleteDoc(doc(db, "presse_articles", a.id));
      toast("Article supprimé", "success");
      setArticles((list) => list.filter((x) => x.id !== a.id));
    } catch { toast("Erreur suppression", "error"); }
  }
  async function moveA(a: PresseArticle, dir: -1 | 1) {
    const idx = articles.findIndex((x) => x.id === a.id);
    const other = articles[idx + dir];
    if (!other) return;
    const oa = a.order ?? 0, ob = other.order ?? 0;
    try {
      await Promise.all([
        updateDoc(doc(db, "presse_articles", a.id), { order: ob }),
        updateDoc(doc(db, "presse_articles", other.id), { order: oa }),
      ]);
      await loadArticles();
    } catch { toast("Erreur réordonnancement", "error"); }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Presse <Badge>{videos.length + articles.length}</Badge>
        </h1>
        {tab === "videos" ? (
          <Button onClick={openNewV}><Plus size={18} /> Ajouter une vidéo</Button>
        ) : (
          <Button onClick={openNewA}><Plus size={18} /> Ajouter un article</Button>
        )}
      </div>

      {/* Sous-onglets */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setTab("videos")}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${tab === "videos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Youtube size={16} /> Vidéos TV
        </button>
        <button onClick={() => setTab("articles")}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${tab === "articles" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Newspaper size={16} /> Articles
        </button>
      </div>

      {/* ===== Vidéos TV ===== */}
      {tab === "videos" && (
        loadingV ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((v, i) => (
              <Card key={v.id} className="flex flex-col gap-3 p-3">
                <div className="aspect-video w-full overflow-hidden rounded-md bg-secondary">
                  {v.url && <iframe src={v.url} title={v.title} className="h-full w-full" allowFullScreen loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{v.title || "Sans titre"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{v.description || "—"}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEditV(v)} aria-label="Éditer"><Pencil size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => moveV(v, -1)} disabled={i === 0} aria-label="Monter"><ArrowUp size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => moveV(v, 1)} disabled={i === videos.length - 1} aria-label="Descendre"><ArrowDown size={14} /></Button>
                  <Button size="sm" variant="destructive" onClick={() => removeV(v)} aria-label="Supprimer"><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
            {videos.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Aucune vidéo.</p>}
          </div>
        )
      )}

      {/* ===== Articles ===== */}
      {tab === "articles" && (
        loadingA ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((a, i) => (
              <Card key={a.id} className="flex gap-3 p-3">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {a.image_url && <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.title || "Sans titre"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{a.description || "—"}</p>
                  {a.link && (
                    <a href={a.link} target="_blank" rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink size={12} /> Lien
                    </a>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEditA(a)} aria-label="Éditer"><Pencil size={14} /></Button>
                    <Button size="sm" variant="outline" onClick={() => moveA(a, -1)} disabled={i === 0} aria-label="Monter"><ArrowUp size={14} /></Button>
                    <Button size="sm" variant="outline" onClick={() => moveA(a, 1)} disabled={i === articles.length - 1} aria-label="Descendre"><ArrowDown size={14} /></Button>
                    <Button size="sm" variant="destructive" onClick={() => removeA(a)} aria-label="Supprimer"><Trash2 size={14} /></Button>
                  </div>
                </div>
              </Card>
            ))}
            {articles.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Aucun article.</p>}
          </div>
        )
      )}

      {/* ===== Dialog Vidéo ===== */}
      <Dialog open={openV} onClose={() => setOpenV(false)} title={editVId ? "Modifier la vidéo" : "Nouvelle vidéo"}>
        <Field label="Titre"><Input value={vTitle} onChange={(e) => setVTitle(e.target.value)} /></Field>
        <Field label="Description"><Textarea value={vDesc} onChange={(e) => setVDesc(e.target.value)} /></Field>
        <Field label="URL YouTube" hint="watch?v=…, youtu.be/… ou embed — convertie automatiquement en lien embed.">
          <Input value={vUrl} onChange={(e) => setVUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
        </Field>
        {vUrl.trim() && (
          <p className="mb-2 break-all text-xs text-muted-foreground">Embed : {toEmbedUrl(vUrl)}</p>
        )}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpenV(false)}>Annuler</Button>
          <Button onClick={saveV} disabled={savingV}>{savingV ? <Spinner /> : "Enregistrer"}</Button>
        </div>
      </Dialog>

      {/* ===== Dialog Article ===== */}
      <Dialog open={openA} onClose={() => setOpenA(false)} title={editAId ? "Modifier l'article" : "Nouvel article"}>
        <Field label="Titre"><Input value={aTitle} onChange={(e) => setATitle(e.target.value)} /></Field>
        <Field label="Description"><Textarea value={aDesc} onChange={(e) => setADesc(e.target.value)} /></Field>
        <Field label="Lien externe">
          <Input value={aLink} onChange={(e) => setALink(e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Image">
          <input type="file" accept="image/*" onChange={(e) => onFileA(e.target.files?.[0])}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
        </Field>
        {aPreview ? (
          <img src={aPreview} alt="" className="mb-3 max-h-48 w-full rounded-lg object-cover" />
        ) : aExistingImg ? (
          <img src={aExistingImg} alt="" className="mb-3 max-h-48 w-full rounded-lg object-cover" />
        ) : (
          <div className="mb-3 flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">Aucune image</div>
        )}
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpenA(false)}>Annuler</Button>
          <Button onClick={saveA} disabled={savingA}>{savingA ? <Spinner /> : "Enregistrer"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
