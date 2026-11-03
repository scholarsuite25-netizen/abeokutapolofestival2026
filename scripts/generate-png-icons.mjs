import fs from "fs";
import path from "path";
import zlib from "zlib";

function createSolidPng(width, height) {
  // Simple uncompressed/deflated raw RGBA PNG writer
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: none

    // Create a circular crest look
    const centerY = height / 2;
    const centerX = width / 2;
    const radius = width * 0.45;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius * 0.95 && dist > radius * 0.90) {
        // Gold border (#DFBE75)
        rawData[pixelOffset] = 223;
        rawData[pixelOffset + 1] = 190;
        rawData[pixelOffset + 2] = 117;
        rawData[pixelOffset + 3] = 255;
      } else if (dist <= radius) {
        // Forest green (#062D1D)
        rawData[pixelOffset] = 6;
        rawData[pixelOffset + 1] = 45;
        rawData[pixelOffset + 2] = 29;
        rawData[pixelOffset + 3] = 255;
      } else {
        // Deep background (#031A10)
        rawData[pixelOffset] = 3;
        rawData[pixelOffset + 1] = 26;
        rawData[pixelOffset + 2] = 16;
        rawData[pixelOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Simple CRC32 for PNG chunks
function crc32(buf) {
  let c = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (c ^ buf[n]) >>> 0;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) >>> 0 : (c >>> 1) >>> 0;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const outDir = path.resolve(process.cwd(), "public/icons");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, "icon-192x192.png"), createSolidPng(192, 192, 6, 45, 29));
fs.writeFileSync(path.join(outDir, "icon-512x512.png"), createSolidPng(512, 512, 6, 45, 29));
fs.writeFileSync(path.join(outDir, "icon-maskable-512x512.png"), createSolidPng(512, 512, 6, 45, 29));

console.log("PNG icons generated successfully.");
