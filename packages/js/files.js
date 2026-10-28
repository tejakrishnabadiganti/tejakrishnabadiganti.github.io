const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/x-icon": "ico",
};

const readDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });

const base64Of = (dataUrl) => dataUrl.slice(dataUrl.indexOf(",") + 1);

// Shrinks large images so the site stays fast. PNGs stay PNG (badges need transparency).
export async function processImage(file, { maxPx = 1600, format } = {}) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const ext = EXTENSIONS[file.type] || file.name.split(".").pop().toLowerCase();

  if (file.type === "image/svg+xml" || ext === "svg") {
    const dataUrl = await readDataUrl(file);
    return { dataUrl, base64: base64Of(dataUrl), ext: "svg" };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const keepPng = file.type === "image/png" && format !== "jpeg";
  const keepOriginal =
    scale === 1 && EXTENSIONS[file.type] && (keepPng || file.type === "image/jpeg");

  if (keepOriginal) {
    const dataUrl = await readDataUrl(file);
    return { dataUrl, base64: base64Of(dataUrl), ext: EXTENSIONS[file.type] };
  }

  const type = keepPng ? "image/png" : "image/jpeg";
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (type === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL(type, 0.82);
  return { dataUrl, base64: base64Of(dataUrl), ext: EXTENSIONS[type] || ext };
}

export async function processPdf(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please choose a PDF file.");
  }

  const dataUrl = await readDataUrl(file);
  return {
    dataUrl: dataUrl.replace(/^data:[^;]*;/, "data:application/pdf;"),
    base64: base64Of(dataUrl),
    ext: "pdf",
  };
}
