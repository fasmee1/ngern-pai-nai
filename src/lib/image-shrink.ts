// Makes a photo small enough to send: at most 1280 pixels on the long side, saved as JPEG.
// Runs in the browser. Returns null when the file cannot be opened as a picture.

const MAX_SIDE = 1280;
// Stay under what the server accepts (about 900,000 characters of base64).
const MAX_BASE64 = 850_000;

export async function shrinkImage(file: File): Promise<{ mime: string; base64: string } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const quality of [0.8, 0.65, 0.5, 0.35]) {
      const url = canvas.toDataURL("image/jpeg", quality);
      const base64 = url.slice(url.indexOf(",") + 1);
      if (base64.length <= MAX_BASE64) return { mime: "image/jpeg", base64 };
    }
    return null;
  } catch {
    return null;
  }
}
