// Traitement d'images côté admin : resize / recadrage -> WebP, upload Storage.
// Reprend la logique de l'ancien admin (WebP, joueurs 600x800 q0.9, reste <=1200 q0.8).
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase-client";

export interface CropBox {
  zoom: number;
  x: number; // offset px dans le repère de sortie
  y: number;
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = url;
  });
}

function toWebP(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion WebP échouée"))), "image/webp", quality)
  );
}

/** Redimensionne (ratio conservé) en WebP. Pour services / articles / settings / marquee. */
export async function resizeToWebP(img: HTMLImageElement, maxDim = 1200, quality = 0.8): Promise<Blob> {
  const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return toWebP(canvas, quality);
}

/** Calcule l'échelle "cover" de base pour remplir un cadre outW×outH. */
export function coverBaseScale(img: HTMLImageElement, outW: number, outH: number): number {
  return Math.max(outW / img.naturalWidth, outH / img.naturalHeight);
}

/** Cuit le recadrage (zoom/offset) dans un WebP outW×outH. Pour les joueurs (600×800). */
export async function bakeCropToWebP(
  img: HTMLImageElement,
  crop: CropBox,
  outW = 600,
  outH = 800,
  quality = 0.9
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, outW, outH);
  const scale = coverBaseScale(img, outW, outH) * (crop.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (outW - dw) / 2 + (crop.x || 0);
  const dy = (outH - dh) / 2 + (crop.y || 0);
  ctx.drawImage(img, dx, dy, dw, dh);
  return toWebP(canvas, quality);
}

/** Upload un blob WebP sur Storage et renvoie l'URL de téléchargement. */
export async function uploadWebP(path: string, blob: Blob): Promise<string> {
  const r = ref(storage, path);
  await uploadBytes(r, blob, { contentType: "image/webp" });
  return getDownloadURL(r);
}

export const ts = () => Date.now();
