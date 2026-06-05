import { useEffect, useRef, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Button, Field, Card, Spinner, Dialog, Badge } from "@/components/ui/kit";
import { useToast } from "@/components/ui/toast";
import { loadImageFromFile, resizeToWebP, uploadWebP, ts } from "@/lib/admin/image";
import type { MarqueeImage, Crop } from "@/lib/types";
import { Pencil, Trash2, Plus } from "lucide-react";

const emptyCrop: Crop = { x: 0, y: 0, zoom: 1 };

// Bornes alignées sur le studio de crop (cf. spec).
const X_MIN = -45, X_MAX = 45;
const Y_MIN = -45, Y_MAX = 45;
const Z_MIN = 0.55, Z_MAX = 3;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Studio de crop — modèle translate(%)/scale identique au front marquee. */
function CropStudio({ src, value, onChange }: { src: string; value: Crop; onChange: (c: Crop) => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  return (
    <div>
      <div
        ref={frameRef}
        className="mx-auto aspect-[280/380] w-full max-w-[280px] cursor-move touch-none overflow-hidden rounded-lg border border-border bg-secondary"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const w = frameRef.current?.clientWidth || 1;
          const h = frameRef.current?.clientHeight || 1;
          // Conversion px -> % du cadre (le transform front est en % de l'image).
          const dx = ((e.clientX - drag.current.x) / w) * 100;
          const dy = ((e.clientY - drag.current.y) / h) * 100;
          drag.current = { x: e.clientX, y: e.clientY };
          onChange({
            ...value,
            x: clamp(value.x + dx, X_MIN, X_MAX),
            y: clamp(value.y + dy, Y_MIN, Y_MAX),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        onWheel={(e) => {
          const z = clamp((value.zoom || 1) + (e.deltaY < 0 ? 0.08 : -0.08), Z_MIN, Z_MAX);
          onChange({ ...value, zoom: z });
        }}
      >
        <img
          src={src}
          alt="Aperçu recadrage"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${value.x}%, ${value.y}%) scale(${value.zoom})`,
          }}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">Horiz.</span>
          <input type="range" min={X_MIN} max={X_MAX} step={0.5} value={value.x}
            onChange={(e) => onChange({ ...value, x: Number(e.target.value) })}
            className="w-full accent-[var(--usm-pink)]" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">Vert.</span>
          <input type="range" min={Y_MIN} max={Y_MAX} step={0.5} value={value.y}
            onChange={(e) => onChange({ ...value, y: Number(e.target.value) })}
            className="w-full accent-[var(--usm-pink)]" />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs text-muted-foreground">Zoom</span>
          <input type="range" min={Z_MIN} max={Z_MAX} step={0.01} value={value.zoom}
            onChange={(e) => onChange({ ...value, zoom: Number(e.target.value) })}
            className="w-full accent-[var(--usm-pink)]" />
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Glissez l'image, ou utilisez les curseurs / la molette.</p>
    </div>
  );
}

export default function MarqueeModule() {
  const toast = useToast();
  const [items, setItems] = useState<MarqueeImage[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");   // URL aperçu (objectURL en ajout, image_url en recadrage)
  const [uploadedUrl, setUploadedUrl] = useState(""); // URL Storage finale (ajout uniquement)
  const [crop, setCrop] = useState<Crop>(emptyCrop);
  const [uploading, setUploading] = useState(false);
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
    setEditId(null);
    setPreviewUrl(""); setUploadedUrl("");
    setCrop({ ...emptyCrop });
    setOpen(true);
  }
  function openEdit(m: MarqueeImage) {
    setEditId(m.id);
    setPreviewUrl(m.image_url); setUploadedUrl(m.image_url);
    setCrop({ ...emptyCrop, ...(m.crop || {}) });
    setOpen(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const image = await loadImageFromFile(file);
      const blob = await resizeToWebP(image, 1200, 0.8);
      const url = await uploadWebP(`marquee/${ts()}.webp`, blob);
      setUploadedUrl(url);
      setPreviewUrl(url);
      setCrop({ ...emptyCrop });
    } catch (e: any) {
      toast("Erreur upload : " + (e?.message || "échec"), "error");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!uploadedUrl) { toast("Ajoutez une image", "error"); return; }
    setSaving(true);
    try {
      const cleanCrop: Crop = { x: crop.x, y: crop.y, zoom: crop.zoom };
      if (editId) {
        await updateDoc(doc(db, "marquee_images", editId), { crop: cleanCrop });
        toast("Recadrage mis à jour", "success");
      } else {
        await addDoc(collection(db, "marquee_images"), {
          image_url: uploadedUrl,
          crop: cleanCrop,
          timestamp: Date.now(),
        });
        toast("Image ajoutée", "success");
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
            const c = m.crop || emptyCrop;
            return (
              <Card key={m.id} className="p-3">
                <div className="aspect-[280/380] overflow-hidden rounded-md bg-secondary">
                  <img
                    src={m.image_url}
                    alt="Bandeau"
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: `translate(${c.x}%, ${c.y}%) scale(${c.zoom})`,
                    }}
                  />
                </div>
                <div className="mt-2 flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(m)} aria-label="Recadrer">
                    <Pencil size={14} /> Recadrer
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

      <Dialog open={open} onClose={() => setOpen(false)} title={editId ? "Recadrer l'image" : "Nouvelle image du bandeau"}>
        {!editId && (
          <Field label="Image (redimensionnée en WebP 1200px)">
            <input type="file" accept="image/*" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
          </Field>
        )}

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Spinner className="h-7 w-7 text-primary" /> <span className="text-sm">Envoi en cours…</span>
          </div>
        ) : previewUrl ? (
          <CropStudio src={previewUrl} value={crop} onChange={setCrop} />
        ) : (
          <div className="mx-auto flex aspect-[280/380] w-full max-w-[280px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            Sélectionnez une image
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={save} disabled={saving || uploading || !uploadedUrl}>{saving ? <Spinner /> : "Enregistrer"}</Button>
        </div>
      </Dialog>
    </div>
  );
}
