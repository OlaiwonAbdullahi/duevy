import { useRef, useState } from "react";
import { toBlob, trimCanvas } from "./image";

const W = 600;
const H = 200;

/** Sign with a finger, stylus or mouse. Hands back a trimmed transparent PNG. */
export function SignaturePad({
  busy,
  onDone,
  onCancel,
}: {
  busy: boolean;
  onDone: (png: Blob) => void;
  onCancel: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [inked, setInked] = useState(false);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = point(e);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!last.current) return;
    const ctx = e.currentTarget.getContext("2d")!;
    const p = point(e);
    ctx.strokeStyle = "#14201b";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    setInked(true);
  };

  const clear = () => {
    canvas.current?.getContext("2d")!.clearRect(0, 0, W, H);
    setInked(false);
  };

  const done = async () => {
    const trimmed = canvas.current && trimCanvas(canvas.current);
    if (trimmed) onDone(await toBlob(trimmed, "image/png"));
  };

  return (
    <div>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => (last.current = null)}
        onPointerCancel={() => (last.current = null)}
        aria-label="Signature pad — draw your signature"
        className="h-36 w-full touch-none rounded-2xl border border-dashed border-cloud bg-white cursor-crosshair"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void done()}
          disabled={!inked || busy}
          className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-bright disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Saving…" : "Use this signature"}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={!inked || busy}
          className="inline-flex h-9 items-center rounded-full border border-cloud px-4 text-xs font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-50 cursor-pointer"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="ml-auto text-xs font-semibold text-ink-soft hover:text-ink cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
