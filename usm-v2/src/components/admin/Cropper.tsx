import { useEffect, useRef } from "react";
import { coverBaseScale, type CropBox } from "@/lib/admin/image";

/** Recadrage canvas pan/zoom. Sortie paramétrable (défaut 600×800 = 3:4, joueurs).
 *  L'image n'est PAS uploadée ici : le parent appelle bakeCropToWebP au moment du save. */
export function Cropper({
  img,
  value,
  onChange,
  outW = 600,
  outH = 800,
  prev = 0.4,
}: {
  img: HTMLImageElement | null;
  value: CropBox;
  onChange: (c: CropBox) => void;
  outW?: number;
  outH?: number;
  prev?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(prev, 0, 0, prev, 0, 0);
    ctx.clearRect(0, 0, outW, outH);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, outW, outH);
    if (img) {
      const scale = coverBaseScale(img, outW, outH) * (value.zoom || 1);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (outW - dw) / 2 + value.x, (outH - dh) / 2 + value.y, dw, dh);
    }
  }, [img, value, outW, outH, prev]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={outW * prev}
        height={outH * prev}
        className="mx-auto block cursor-grab touch-none rounded-lg border border-border bg-secondary active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = (e.clientX - drag.current.x) / prev;
          const dy = (e.clientY - drag.current.y) / prev;
          drag.current = { x: e.clientX, y: e.clientY };
          onChange({ ...value, x: value.x + dx, y: value.y + dy });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
        onWheel={(e) => {
          const z = Math.min(4, Math.max(1, (value.zoom || 1) + (e.deltaY < 0 ? 0.08 : -0.08)));
          onChange({ ...value, zoom: z });
        }}
      />
      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Zoom</span>
        <input
          type="range" min={1} max={4} step={0.02} value={value.zoom}
          onChange={(e) => onChange({ ...value, zoom: Number(e.target.value) })}
          className="w-full accent-[var(--usm-pink)]"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Glissez pour recadrer, molette/curseur pour zoomer.</p>
    </div>
  );
}
