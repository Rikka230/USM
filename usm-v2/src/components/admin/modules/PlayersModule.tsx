import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Button, Input, Field, Card, Spinner, Dialog, Badge } from "@/components/ui/kit";
import { useToast } from "@/components/ui/toast";
import { Cropper } from "@/components/admin/Cropper";
import { loadImageFromFile, bakeCropToWebP, uploadWebP, ts, type CropBox } from "@/lib/admin/image";
import type { Player } from "@/lib/types";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, Search } from "lucide-react";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "gardien", label: "Gardiens" },
  { key: "defenseur", label: "Défenseurs" },
  { key: "milieu", label: "Milieux" },
  { key: "attaquant", label: "Attaquants" },
  { key: "feminine", label: "Féminines" },
  { key: "coach", label: "Coachs & Staff" },
];

const emptyCrop: CropBox = { zoom: 1, x: 0, y: 0 };

export default function PlayersModule() {
  const toast = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("gardien");
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [formCat, setFormCat] = useState("gardien");
  const [stat, setStat] = useState("");
  const [tm, setTm] = useState("");
  const [existingImg, setExistingImg] = useState("");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<CropBox>(emptyCrop);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const snap = await getDocs(collection(db, "players"));
    const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Player[];
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setPlayers(list);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = players
    .filter((p) => (search ? (p.name || "").toLowerCase().includes(search.toLowerCase()) : p.category === cat));

  function openNew() {
    setEditId(null); setName(""); setFormCat(cat); setStat(""); setTm("");
    setExistingImg(""); setImg(null); setCrop({ ...emptyCrop }); setOpen(true);
  }
  function openEdit(p: Player) {
    setEditId(p.id); setName(p.name || ""); setFormCat(p.category || "gardien");
    setStat(p.stat || ""); setTm(p.transfermarkt || ""); setExistingImg(p.image_url || "");
    setImg(null); setCrop({ ...emptyCrop }); setOpen(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const image = await loadImageFromFile(file);
      setImg(image); setCrop({ ...emptyCrop });
    } catch { toast("Image illisible", "error"); }
  }

  async function save() {
    if (!name.trim()) { toast("Le nom est requis", "error"); return; }
    setSaving(true);
    try {
      let image_url = existingImg;
      if (img) {
        const blob = await bakeCropToWebP(img, crop, 600, 800, 0.9);
        image_url = await uploadWebP(`players/${ts()}.webp`, blob);
      }
      const payload: any = { name: name.trim(), category: formCat, stat: stat.trim(), transfermarkt: tm.trim(), image_url };
      if (editId) {
        await updateDoc(doc(db, "players", editId), payload);
        toast("Joueur mis à jour", "success");
      } else {
        payload.order = players.length + 1;
        payload.timestamp = serverTimestamp();
        await addDoc(collection(db, "players"), payload);
        toast("Joueur ajouté", "success");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Player) {
    if (!confirm(`Supprimer ${p.name} ?`)) return;
    try {
      await deleteDoc(doc(db, "players", p.id));
      toast("Joueur supprimé", "success");
      setPlayers((list) => list.filter((x) => x.id !== p.id));
    } catch (e: any) { toast("Erreur suppression", "error"); }
  }

  async function move(p: Player, dir: -1 | 1) {
    const sameCat = filtered;
    const idx = sameCat.findIndex((x) => x.id === p.id);
    const other = sameCat[idx + dir];
    if (!other) return;
    const a = p.order ?? 0, b = other.order ?? 0;
    try {
      await Promise.all([
        updateDoc(doc(db, "players", p.id), { order: b }),
        updateDoc(doc(db, "players", other.id), { order: a }),
      ]);
      await load();
    } catch { toast("Erreur réordonnancement", "error"); }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Joueurs <Badge>{players.length}</Badge></h1>
        <Button onClick={openNew}><Plus size={18} /> Ajouter un joueur</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => { setCat(c.key); setSearch(""); }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${cat === c.key && !search ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Rechercher un joueur..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <Card key={p.id} className="flex gap-3 p-3">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.stat || "—"}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)} aria-label="Éditer"><Pencil size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => move(p, -1)} disabled={i === 0 || !!search} aria-label="Monter"><ArrowUp size={14} /></Button>
                  <Button size="sm" variant="outline" onClick={() => move(p, 1)} disabled={i === filtered.length - 1 || !!search} aria-label="Descendre"><ArrowDown size={14} /></Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(p)} aria-label="Supprimer"><Trash2 size={14} /></Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Aucun joueur.</p>}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editId ? "Modifier le joueur" : "Nouveau joueur"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Nom"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Catégorie">
              <select value={formCat} onChange={(e) => setFormCat(e.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-secondary/40 px-3 text-foreground">
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Statistique (ex. 150 sélections)"><Input value={stat} onChange={(e) => setStat(e.target.value)} /></Field>
            <Field label="Lien Transfermarkt"><Input value={tm} onChange={(e) => setTm(e.target.value)} placeholder="https://..." /></Field>
          </div>
          <div>
            <Field label="Photo (recadrage 3:4)">
              <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
            </Field>
            {img ? (
              <Cropper img={img} value={crop} onChange={setCrop} />
            ) : existingImg ? (
              <img src={existingImg} alt="" className="mx-auto h-48 w-36 rounded-lg object-cover" />
            ) : (
              <div className="mx-auto flex h-48 w-36 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">Aucune image</div>
            )}
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
