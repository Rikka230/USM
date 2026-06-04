import { useEffect, useRef } from "react";
import { coverBaseScale, type CropBox } from "@/lib/admin/image";

const OUT_W = 600;
const OUT_H = 800;
const PREV = 0.4; // aperçu 240×320, cohérent avec la sortie 600×800

export function Cropper({
  img,
  value,
  onChange,
}: {
  img: HTMLImageElement | null;
  value: CropBox;
  onChange: (c: CropBox) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(PREV, 0, 0, PREV, 0, 0);
    ctx.clearRect(0, 0, OUT_W, OUT_H);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    if (img) {
      const scale = coverBaseScale(img, OUT_W, OUT_H) * (value.zoom || 1);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (OUT_W - dw) / 2 + value.x, (OUT_H - dh) / 2 + value.y, dw, dh);
    }
  }, [img, value]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={OUT_W * PREV}
        height={OUT_H * PREV}
        className="mx-auto block cursor-move touch-none rounded-lg border border-border bg-secondary"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY };
          (e.target as Element).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = (e.clientX - drag.current.x) / PREV;
          const dy = (e.clientY - drag.current.y) / PREV;
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
