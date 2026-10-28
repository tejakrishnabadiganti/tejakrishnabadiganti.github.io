// Files chosen in the editor but not published yet: repo path -> { dataUrl, base64 }.
export const pendingFiles = new Map();

// Set on a device after the owner signs in, so their own visits are not counted.
export const OWNER_KEY = "portfolio-owner";

// Content paths may carry a "?v=" cache-busting suffix.
export const stripVersion = (path) => String(path ?? "").split("?")[0];

const supportsWebp = (() => {
  try {
    const c = document.createElement("canvas");
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch { return false; }
})();

function toWebp(url) {
  if (!supportsWebp) return url;
  if (typeof url !== "string") return url;
  return url.replace(/\.(jpe?g|png)(?=$|\?)/i, ".webp");
}

export const assetUrl = (path) =>
  toWebp(pendingFiles.get(stripVersion(path))?.dataUrl ?? path);
