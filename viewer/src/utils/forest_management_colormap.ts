// utils/mfColormap.ts
import { MF_CLASSES } from "./mfClassification";

export function buildMFColormapCanvas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(256, 1);

  // Default: fully transparent (undefined codes render as nothing)
  for (let i = 0; i < 256; i++) {
    imgData.data[i * 4 + 3] = 0;
  }

  for (const cls of MF_CLASSES) {
    const idx = cls.code * 4;
    imgData.data[idx] = cls.color[0];
    imgData.data[idx + 1] = cls.color[1];
    imgData.data[idx + 2] = cls.color[2];
    imgData.data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
