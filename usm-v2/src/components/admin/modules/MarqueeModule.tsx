import { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Button, Input, Field, Card, Spinner, Dialog, Badge } from "@/components/ui/kit";
import { useToast } from "@/components/ui/toast";
import { Cropper } from "@/components/admin/Cropper";
import { loadImageFromFile, bakeCropToWebP, uploadWebP, ts, type CropBox } from "@/lib/admin/image";
import type { MarqueeImage, Crop } from "@/lib/types";
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";

// Sortie au ratio réel du marquee (280×380) ; rendu en plus haute résolution.
const OUT_W = 600;
const OUT_H = 814; // 600 * 380 / 280
const IDENTITY_CROP: Crop = { x: 0, y: 0, zoom: 1 };
const emptyCropBox: CropBox = { zoom: 1, x: 0, y: 0 };

export default function MarqueeModule() {
  const toast = useToast();
  const [items, setItems] = useState<MarqueeImage[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<MarqueeImage | null>(null); // null = ajout
  const [img, setImg] = useState<HTMLImageElement | null>(null);        // image en mémoire (recadrage avant upload)
  const [crop, setCrop] = useState<CropBox>(emptyCropBox);
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "marquee_images"));
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as MarqueeImage[];
      list.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
      setItems(list);
    } catch {
      toast("Erreur de chargement", "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditItem(null);
    setImg(null); setCrop({ ...emptyCropBox }); setAlt("");
    setOpen(true);
  }
  function openEdit(m: MarqueeImage) {
    setEditItem(m);
    setImg(null); setCrop({ ...emptyCropBox }); setAlt(m.alt || "");
    setOpen(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const image = await loadImageFromFile(file);
      setImg(image); setCrop({ ...emptyCropBox });
    } catch {
      toast("Image illisible", "error");
    }
  }

  async function save() {
    const cleanAlt = alt.trim().slice(0, 160);
    setSaving(true);
    try {
      if (img) {
        // Nouvelle image (ou remplacement) : on cuit le recadrage puis on upload.
        const blob = await bakeCropToWebP(img, crop, OUT_W, OUT_H, 0.9);
        const url = await uploadWebP(`marquee/${ts()}.webp`, blob);
        if (editItem) {
          await updateDoc(doc(db, "marquee_images", editItem.id), {
            image_url: url, crop: { ...IDENTITY_CROP }, alt: cleanAlt,
          });
          toast("Image mise à jour", "success");
        } else {
          await addDoc(collection(db, "marquee_images"), {
            image_url: url, crop: { ...IDENTITY_CROP }, alt: cleanAlt, timestamp: Date.now(),
          });
          toast("Image ajoutée", "success");
        }
      } else if (editItem) {
        // Pas de nouvelle image : on met juste à jour le nom SEO.
        await updateDoc(doc(db, "marquee_images", editItem.id), { alt: cleanAlt });
        toast("Nom SEO mis à jour", "success");
      } else {
        toast("Ajoutez une image", "error");
        setSaving(false);
        return;
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast("Erreur : " + (e?.message || "échec"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(m: MarqueeImage) {
    if (!confirm("Supprimer cette image du bandeau ?")) return;
    try {
      await deleteDoc(doc(db, "marquee_images", m.id));
      toast("Image supprimée", "success");
      setItems((list) => list.filter((x) => x.id !== m.id));
    } catch {
      toast("Erreur suppression", "error");
    }
  }

  const existingCrop = editItem?.crop || IDENTITY_CROP;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bandeau défilant <Badge>{items.length}</Badge></h1>
        <Button onClick={openNew}><Plus size={18} /> Ajouter une image</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => {
            const c = m.crop || IDENTITY_CROP;
            return (
              <Card key={m.id} className="p-3">
                <div className="aspect-[280/380] overflow-hidden rounded-md bg-secondary">
                  <img
                    src={m.image_url}
                    alt={m.alt || "Image du bandeau"}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `translate(${c.x}%, ${c.y}%) scale(${c.zoom})`,
                    }}
                  />
                </div>
                {m.alt ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground" title={m.alt}>{m.alt}</p>
                ) : (
                  <p className="mt-2 flex items-center gap-1 text-xs text-amber-500"><AlertTriangle size={12} /> Nom SEO manquant</p>
                )}
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(m)} aria-label="Modifier">
                    <Pencil size={14} /> Modifier
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(m)} aria-label="Supprimer">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
          {items.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">Aucune image dans le bandeau.</p>}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editItem ? "Modifier l'image" : "Nouvelle image du bandeau"}>
        <Field label={editItem ? "Remplacer l'image (optionnel)" : "Image (recadrage avant envoi)"}>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
        </Field>

        {img ? (
          <Cropper img={img} value={crop} onChange={setCrop} outW={OUT_W} outH={OUT_H} prev={0.4} />
        ) : editItem ? (
          // Aperçu fidèle de l'image existante (recadrage actuel).
          <div className="mx-auto aspect-[280/380] w-full max-w-[240px] overflow-hidden rounded-lg border border-border bg-secondary">
            <img src={editItem.image_url} alt="" draggable={false}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                transform: `translate(${existingCrop.x}%, ${existingCrop.y}%) scale(${existingCrop.zoom})`,
              }} />
          </div>
        ) : (
          <div className="mx-auto flex aspect-[280/380] w-full max-w-[240px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            Sélectionnez une image
          </div>
        )}

        <div className="mt-4">
          <Field label="Nom / description SEO (Google Images)">
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={160}
              placeholder="Ex. : Joueur USM Football en match, saison 2026" />
          </Field>
          <p className="-mt-1 text-xs text-muted-foreground">
            Décrivez précisément l'image (qui / quoi / où) : c'est ce texte qui permet son référencement dans Google Images.
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving || (!img && !editItem)}>{saving ? <Spinner /> : "Enregistrer"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
