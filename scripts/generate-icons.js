import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// Calculate CRC32 for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function generateArcReactorPNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const cx = width / 2;
  const cy = height / 2;
  const maxR = size / 2;
  // If maskable, safe zone is 80% (padding of 10% around)
  const scale = isMaskable ? 0.75 : 0.88;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx); // -PI to PI
      const normDist = dist / (maxR * scale);

      let r = 5, g = 11, b = 20, a = 255; // Background #050b14

      if (normDist <= 1.0) {
        // Outer dark ring
        if (normDist > 0.88 && normDist <= 0.98) {
          // Cyan accent ring
          r = 6; g = 182; b = 212; a = 240;
        } else if (normDist > 0.78 && normDist <= 0.88) {
          // Segmented reactor ring
          const segments = 10;
          const segAngle = (Math.PI * 2) / segments;
          const modAngle = ((angle + Math.PI * 2) % segAngle) / segAngle;
          if (modAngle > 0.2 && modAngle < 0.8) {
            // Active reactor coil
            r = 14; g = 165; b = 233; a = 255;
          } else {
            // Gap
            r = 8; g = 25; b = 45; a = 255;
          }
        } else if (normDist > 0.65 && normDist <= 0.78) {
          // Middle glowing ring
          r = 34; g = 211; b = 238; a = 220;
        } else if (normDist > 0.35 && normDist <= 0.65) {
          // Inner reactor chamber with faint circuit glow
          const radialGlow = 1 - (normDist - 0.35) / 0.3;
          r = Math.floor(10 + 60 * radialGlow);
          g = Math.floor(40 + 140 * radialGlow);
          b = Math.floor(70 + 185 * radialGlow);
          a = 255;
        } else if (normDist <= 0.35) {
          // Central luminous core (pure bright cyan-white)
          const coreGlow = 1 - (normDist / 0.35);
          r = Math.floor(180 + 75 * coreGlow);
          g = Math.floor(240 + 15 * coreGlow);
          b = 255;
          a = 255;
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateArcReactorPNG(192, false));

console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateArcReactorPNG(512, false));

console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateArcReactorPNG(512, true));

console.log('Generating apple-touch-icon.png (180x180)...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateArcReactorPNG(180, false));

console.log('Generating favicon-32x32.png...');
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), generateArcReactorPNG(32, false));

console.log('All icons generated successfully!');
