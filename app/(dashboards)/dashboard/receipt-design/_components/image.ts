/** The backend's cap is 512 KB; stay under it with room to spare. */
const MAX_BYTES = 480 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't read that image."))), type, quality),
  );
}

function load(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that image. Try a PNG or JPEG."));
    img.src = src;
  });
}

/**
 * Shrink an image to fit `maxW`×`maxH` and re-encode it as PNG (keeps
 * transparency), falling back to JPEG on white if the PNG is still too big.
 * Re-encoding also strips anything odd in the original file.
 */
export async function prepareImage(file: Blob, maxW: number, maxH: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await load(url);
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const png = await toBlob(canvas, "image/png");
    if (png.size <= MAX_BYTES) return png;

    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return toBlob(canvas, "image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Crop a drawn signature to its ink, plus a little margin, so it sits centred on the receipt. */
export function trimCanvas(source: HTMLCanvasElement): HTMLCanvasElement | null {
  const ctx = source.getContext("2d")!;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let top = height, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 0) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  const pad = 8;
  left = Math.max(0, left - pad);
  top = Math.max(0, top - pad);
  const w = Math.min(width, right + pad) - left;
  const h = Math.min(height, bottom + pad) - top;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")!.drawImage(source, left, top, w, h, 0, 0, w, h);
  return out;
}

export { toBlob };
