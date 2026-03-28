/**
 * Regenerates Android launcher mipmaps and iOS AppIcon (1024×1024) from resources/splash.png.
 * Full-bleed purple; optional center crop zooms the logo. Near-white margins are filled with sampled purple.
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "resources", "splash.png");

/**
 * Fraction of min(splash width, height) kept from the center (0.5–1).
 * Use 1 to avoid cropping the logo (aggressive crops were clipping the top of the Q).
 */
const SPLASH_CENTER_CROP = 1;

/**
 * Escala el logo respecto al lienzo antes de generar mipmaps (solo recorte central simétrico).
 * >1 agranda la Q en el icono; subir con cuidado para no recortar cola/anillo del logo.
 */
const ICON_CENTER_ZOOM = 1.2;

/** Pixels that are white/light gray margins; keep saturated colors (tail, ring). */
function isMarginPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const avg = (r + g + b) / 3;
  if (saturation > 42) return false;
  if (avg >= 248) return true;
  if (avg >= 218 && saturation < 22) return true;
  return false;
}

function luminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

async function processSource() {
  const meta = await sharp(SRC).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  let pipeline = sharp(SRC);
  if (
    SPLASH_CENTER_CROP > 0 &&
    SPLASH_CENTER_CROP < 1 &&
    w > 0 &&
    h > 0
  ) {
    const side = Math.min(w, h);
    const cropSize = Math.round(side * SPLASH_CENTER_CROP);
    const left = Math.floor((w - cropSize) / 2);
    const top = Math.floor((h - cropSize) / 2);
    pipeline = pipeline.extract({
      left,
      top,
      width: cropSize,
      height: cropSize,
    });
  }

  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const buf = new Uint8ClampedArray(data);

  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    if (luminance(r, g, b) < 0.42) {
      sr += r;
      sg += g;
      sb += b;
      n++;
    }
  }
  if (n === 0) {
    throw new Error("Could not sample background color from source image.");
  }
  const br = Math.round(sr / n);
  const bg = Math.round(sg / n);
  const bb = Math.round(sb / n);

  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    if (isMarginPixel(r, g, b)) {
      buf[i] = br;
      buf[i + 1] = bg;
      buf[i + 2] = bb;
      buf[i + 3] = 255;
    }
  }

  const rgba = await sharp(Buffer.from(buf), {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();

  return { rgba, bgRgb: { r: br, g: bg, b: bb } };
}

/**
 * @param {Buffer} pngBuffer
 * @param {number} zoom >1 amplía el contenido visible (equivalente a acercar el centro).
 */
async function applyCenterZoom(pngBuffer, zoom) {
  if (zoom <= 1.001) return pngBuffer;
  const meta = await sharp(pngBuffer).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) return pngBuffer;
  const sw = Math.round(w * zoom);
  const sh = Math.round(h * zoom);
  return sharp(pngBuffer)
    .resize(sw, sh, { fit: "fill" })
    .extract({
      left: Math.max(0, Math.floor((sw - w) / 2)),
      top: Math.max(0, Math.floor((sh - h) / 2)),
      width: Math.min(w, sw),
      height: Math.min(h, sh),
    })
    .png()
    .toBuffer();
}

const IOS_APP_ICON_1024 = path.join(
  ROOT,
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
);

const densities = {
  ldpi: { fg: 81, legacy: 36 },
  mdpi: { fg: 108, legacy: 48 },
  hdpi: { fg: 162, legacy: 72 },
  xhdpi: { fg: 216, legacy: 96 },
  xxhdpi: { fg: 324, legacy: 144 },
  xxxhdpi: { fg: 432, legacy: 192 },
};

async function main() {
  let { rgba, bgRgb } = await processSource();
  rgba = await applyCenterZoom(rgba, ICON_CENTER_ZOOM);
  const hex =
    "#" +
    [bgRgb.r, bgRgb.g, bgRgb.b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

  const valuesPath = path.join(
    ROOT,
    "android/app/src/main/res/values/ic_launcher_background.xml",
  );
  fs.writeFileSync(
    valuesPath,
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${hex}</color>
</resources>
`,
    "utf8",
  );

  for (const [name, { fg, legacy }] of Object.entries(densities)) {
    const dir = path.join(
      ROOT,
      `android/app/src/main/res/mipmap-${name}`,
    );
    const resize = (w) =>
      sharp(rgba).resize(w, w, { fit: "fill" }).png();

    await resize(fg).toFile(path.join(dir, "ic_launcher_foreground.png"));
    await resize(legacy).toFile(path.join(dir, "ic_launcher.png"));
    await resize(legacy).toFile(path.join(dir, "ic_launcher_round.png"));

    const bgPath = path.join(dir, "ic_launcher_background.png");
    if (fs.existsSync(bgPath)) {
      fs.unlinkSync(bgPath);
    }
  }

  await sharp(rgba)
    .resize(1024, 1024, { fit: "fill" })
    .png()
    .toFile(IOS_APP_ICON_1024);

  console.log(
    `Updated Android mipmaps + iOS AppIcon; ic_launcher_background ${hex}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
