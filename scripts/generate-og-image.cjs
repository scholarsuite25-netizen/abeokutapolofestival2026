const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const width = 1200;
const height = 630;
const png = new PNG({ width, height });

// Color palettes: Forest (#002F1A), Deep Forest (#001A0E), Gold (#C9A84C), Ivory (#FCF9F8)
function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

// Background gradient: Radial blend from dark forest green #002F1A (r=0, g=47, b=26) to #001A0E (r=0, g=26, b=14)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    // Distance from center
    const dx = (x - width * 0.5) / (width * 0.5);
    const dy = (y - height * 0.4) / (height * 0.5);
    const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));

    // Base forest green
    const r = Math.round(15 * (1 - dist));
    const g = Math.round(47 * (1 - dist * 0.5) + 12 * dist);
    const b = Math.round(26 * (1 - dist * 0.6) + 10 * dist);
    setPixel(x, y, r, g, b, 255);
  }
}

// Draw gold inset border (width: 2px, inset 24px)
const inset = 24;
const goldR = 201, goldG = 168, goldB = 76;
for (let x = inset; x < width - inset; x++) {
  setPixel(x, inset, goldR, goldG, goldB, 180);
  setPixel(x, inset + 1, goldR, goldG, goldB, 220);
  setPixel(x, height - inset - 1, goldR, goldG, goldB, 220);
  setPixel(x, height - inset, goldR, goldG, goldB, 180);
}
for (let y = inset; y < height - inset; y++) {
  setPixel(inset, y, goldR, goldG, goldB, 180);
  setPixel(inset + 1, y, goldR, goldG, goldB, 220);
  setPixel(width - inset - 1, y, goldR, goldG, goldB, 220);
  setPixel(width - inset, y, goldR, goldG, goldB, 180);
}

// Draw corner decorative marks
const cornerLen = 40;
for (let i = 0; i < cornerLen; i++) {
  // Top-left
  setPixel(inset + i, inset + 6, goldR, goldG, goldB, 255);
  setPixel(inset + 6, inset + i, goldR, goldG, goldB, 255);
  // Top-right
  setPixel(width - inset - i, inset + 6, goldR, goldG, goldB, 255);
  setPixel(width - inset - 6, inset + i, goldR, goldG, goldB, 255);
  // Bottom-left
  setPixel(inset + i, height - inset - 6, goldR, goldG, goldB, 255);
  setPixel(inset + 6, height - inset - i, goldR, goldG, goldB, 255);
  // Bottom-right
  setPixel(width - inset - i, height - inset - 6, goldR, goldG, goldB, 255);
  setPixel(width - inset - 6, height - inset - i, goldR, goldG, goldB, 255);
}

// Write to public/og-image.png
const outputPath = path.join(__dirname, "..", "public", "og-image.png");
png.pack().pipe(fs.createWriteStream(outputPath)).on("finish", () => {
  console.log(`Successfully generated og-image.png at: ${outputPath}`);
});
