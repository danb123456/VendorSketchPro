import { rasterSize } from "./mapping";
export async function renderSvgCanvas(
  markup: string,
  width: number,
  height: number,
  transparent = false,
): Promise<HTMLCanvasElement> {
  const size = rasterSize(width, height);
  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  const root = document.documentElement;
  root.setAttribute("width", String(size.width));
  root.setAttribute("height", String(size.height));
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(root)], {
      type: "image/svg+xml;charset=utf-8",
    }),
  );
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            Error("Image preparation timed out. Please retry or use SVG."),
          ),
        15000,
      );
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(Error("Could not prepare the image. Please retry or use SVG."));
      };
      img.src = url;
    });
    const canvas = window.document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw Error("Your browser could not create the image. Please try SVG.");
    if (!transparent) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size.width, size.height);
    }
    ctx.drawImage(img, 0, 0, size.width, size.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(Error("PNG preparation failed. Please try SVG.")),
      "image/png",
    ),
  );
}
