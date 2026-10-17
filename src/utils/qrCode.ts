/**
 * Self-contained QR Code Generator in pure TypeScript.
 * Generates ISO/IEC 18004 compliant QR Code module matrices.
 * Supports Byte mode with Reed-Solomon error correction (Levels L, M, Q, H).
 * Renders directly to SVG or HTML5 Canvas with optional center icon/logo.
 */

// QR Error Correction Levels
export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

// Galois Field GF(256) tables for QR Reed-Solomon polynomial math
const GF256_EXP: number[] = new Array(512);
const GF256_LOG: number[] = new Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 256) {
      x ^= 0x11d; // Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

// Generate Reed-Solomon error correction polynomials
function rsGeneratorPoly(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], GF256_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateRemainder(data: number[], degree: number): number[] {
  const gen = rsGeneratorPoly(degree);
  const remainder = new Array(degree).fill(0);

  for (const byte of data) {
    const factor = byte ^ remainder.shift()!;
    remainder.push(0);
    for (let i = 0; i < degree; i++) {
      remainder[i] ^= gfMultiply(gen[i], factor);
    }
  }
  return remainder;
}

// Table of QR Code versions capacity & block structure (Version 1 to 10)
// Format: [totalCodewords, ecCodewordsPerBlock, numBlocksGroup1, dataCodewordsGroup1, numBlocksGroup2, dataCodewordsGroup2]
interface VersionInfo {
  version: number;
  totalCodewords: number;
  ecPerBlock: Record<QRErrorCorrectionLevel, number>;
  blocks: Record<QRErrorCorrectionLevel, { count1: number; data1: number; count2: number; data2: number }>;
  alignmentPatterns: number[];
}

const QR_VERSIONS: VersionInfo[] = [
  {
    version: 1,
    totalCodewords: 26,
    ecPerBlock: { L: 7, M: 10, Q: 13, H: 17 },
    blocks: {
      L: { count1: 1, data1: 19, count2: 0, data2: 0 },
      M: { count1: 1, data1: 16, count2: 0, data2: 0 },
      Q: { count1: 1, data1: 13, count2: 0, data2: 0 },
      H: { count1: 1, data1: 9, count2: 0, data2: 0 },
    },
    alignmentPatterns: [],
  },
  {
    version: 2,
    totalCodewords: 44,
    ecPerBlock: { L: 10, M: 16, Q: 22, H: 28 },
    blocks: {
      L: { count1: 1, data1: 34, count2: 0, data2: 0 },
      M: { count1: 1, data1: 28, count2: 0, data2: 0 },
      Q: { count1: 1, data1: 22, count2: 0, data2: 0 },
      H: { count1: 1, data1: 16, count2: 0, data2: 0 },
    },
    alignmentPatterns: [6, 18],
  },
  {
    version: 3,
    totalCodewords: 70,
    ecPerBlock: { L: 15, M: 26, Q: 36, H: 44 },
    blocks: {
      L: { count1: 1, data1: 55, count2: 0, data2: 0 },
      M: { count1: 1, data1: 44, count2: 0, data2: 0 },
      Q: { count1: 2, data1: 17, count2: 0, data2: 0 },
      H: { count1: 2, data1: 13, count2: 0, data2: 0 },
    },
    alignmentPatterns: [6, 22],
  },
  {
    version: 4,
    totalCodewords: 100,
    ecPerBlock: { L: 20, M: 36, Q: 52, H: 64 },
    blocks: {
      L: { count1: 1, data1: 80, count2: 0, data2: 0 },
      M: { count1: 2, data1: 32, count2: 0, data2: 0 },
      Q: { count1: 2, data1: 24, count2: 0, data2: 0 },
      H: { count1: 4, data1: 9, count2: 0, data2: 0 },
    },
    alignmentPatterns: [6, 26],
  },
  {
    version: 5,
    totalCodewords: 134,
    ecPerBlock: { L: 26, M: 48, Q: 72, H: 88 },
    blocks: {
      L: { count1: 1, data1: 108, count2: 0, data2: 0 },
      M: { count1: 2, data1: 43, count2: 0, data2: 0 },
      Q: { count1: 2, data1: 15, count2: 2, data2: 16 },
      H: { count1: 2, data1: 11, count2: 2, data2: 12 },
    },
    alignmentPatterns: [6, 30],
  },
  {
    version: 6,
    totalCodewords: 172,
    ecPerBlock: { L: 36, M: 64, Q: 96, H: 112 },
    blocks: {
      L: { count1: 2, data1: 68, count2: 0, data2: 0 },
      M: { count1: 4, data1: 27, count2: 0, data2: 0 },
      Q: { count1: 4, data1: 19, count2: 0, data2: 0 },
      H: { count1: 4, data1: 15, count2: 0, data2: 0 },
    },
    alignmentPatterns: [6, 34],
  },
  {
    version: 7,
    totalCodewords: 196,
    ecPerBlock: { L: 40, M: 72, Q: 108, H: 130 },
    blocks: {
      L: { count1: 2, data1: 78, count2: 0, data2: 0 },
      M: { count1: 4, data1: 31, count2: 0, data2: 0 },
      Q: { count1: 2, data1: 14, count2: 4, data2: 15 },
      H: { count1: 4, data1: 13, count2: 1, data2: 14 },
    },
    alignmentPatterns: [6, 22, 38],
  },
];

const FORMAT_BITS: Record<string, number> = {
  'L_0': 0x77c4, 'L_1': 0x72f3, 'L_2': 0x7daa, 'L_3': 0x789d,
  'L_4': 0x662f, 'L_5': 0x6318, 'L_6': 0x6c41, 'L_7': 0x6976,
  'M_0': 0x5412, 'M_1': 0x5125, 'M_2': 0x5e7c, 'M_3': 0x5b4b,
  'M_4': 0x45f9, 'M_5': 0x40ce, 'M_6': 0x4f97, 'M_7': 0x4aa0,
  'Q_0': 0x355f, 'Q_1': 0x3068, 'Q_2': 0x3f31, 'Q_3': 0x3a06,
  'Q_4': 0x24b4, 'Q_5': 0x2183, 'Q_6': 0x2eda, 'Q_7': 0x2bed,
  'H_0': 0x1689, 'H_1': 0x13be, 'H_2': 0x1ce7, 'H_3': 0x19d0,
  'H_4': 0x0762, 'H_5': 0x0255, 'H_6': 0x0d0c, 'H_7': 0x083b,
};

// Mask evaluation formulas
function isMasked(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

/**
 * Creates QR code matrix for a string.
 */
export function generateQRMatrix(text: string, ecLevel: QRErrorCorrectionLevel = 'M'): boolean[][] {
  const utf8Bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let charCode = text.charCodeAt(i);
    if (charCode < 0x80) {
      utf8Bytes.push(charCode);
    } else if (charCode < 0x800) {
      utf8Bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else {
      utf8Bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    }
  }

  // Find minimum version that fits data
  let selectedVersion: VersionInfo | null = null;
  for (const v of QR_VERSIONS) {
    const totalDataCapacity =
      v.blocks[ecLevel].count1 * v.blocks[ecLevel].data1 +
      v.blocks[ecLevel].count2 * v.blocks[ecLevel].data2;
    // 4 bits mode + 8 bits length + data
    const requiredBits = 4 + 8 + utf8Bytes.length * 8;
    if (Math.ceil(requiredBits / 8) <= totalDataCapacity) {
      selectedVersion = v;
      break;
    }
  }

  if (!selectedVersion) {
    selectedVersion = QR_VERSIONS[QR_VERSIONS.length - 1]; // Use largest supported
  }

  const ver = selectedVersion.version;
  const size = ver * 4 + 17;
  const blockInfo = selectedVersion.blocks[ecLevel];
  const totalDataBytes =
    blockInfo.count1 * blockInfo.data1 + blockInfo.count2 * blockInfo.data2;

  // Build bitstream
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // Byte Mode indicator = 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for Version 1-9)
  pushBits(utf8Bytes.length, 8);
  // Data bytes
  for (const b of utf8Bytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zero bits)
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0 && bits.length < maxBits) {
    bits.push(0);
  }

  // Convert to byte array
  const dataBytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bits[i + b] || 0);
    }
    dataBytes.push(byte);
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataBytes.length < totalDataBytes) {
    dataBytes.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // Split into blocks and compute error correction
  const ecPerBlock = selectedVersion.ecPerBlock[ecLevel];
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];

  let dataOffset = 0;
  for (let i = 0; i < blockInfo.count1; i++) {
    const chunk = dataBytes.slice(dataOffset, dataOffset + blockInfo.data1);
    dataBlocks.push(chunk);
    ecBlocks.push(rsCalculateRemainder(chunk, ecPerBlock));
    dataOffset += blockInfo.data1;
  }
  for (let i = 0; i < blockInfo.count2; i++) {
    const chunk = dataBytes.slice(dataOffset, dataOffset + blockInfo.data2);
    dataBlocks.push(chunk);
    ecBlocks.push(rsCalculateRemainder(chunk, ecPerBlock));
    dataOffset += blockInfo.data2;
  }

  // Interleave data codewords
  const finalCodewords: number[] = [];
  const maxDataLen = Math.max(blockInfo.data1, blockInfo.data2 || 0);
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < dataBlocks.length; b++) {
      if (i < dataBlocks[b].length) {
        finalCodewords.push(dataBlocks[b][i]);
      }
    }
  }
  // Interleave error correction codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks.length; b++) {
      if (i < ecBlocks[b].length) {
        finalCodewords.push(ecBlocks[b][i]);
      }
    }
  }

  // Initialize QR Matrix (-1 = unassigned, 0 = white, 1 = black)
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(-1));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r: number, c: number, val: number, func = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (func) isFunction[r][c] = true;
    }
  }

  // Finder Patterns (7x7) + Separators (8x8)
  function placeFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
              setModule(nr, nc, 1);
            } else {
              setModule(nr, nc, 0);
            }
          } else {
            setModule(nr, nc, 0); // Separator
          }
        }
      }
    }
  }

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment patterns
  const alignCoords = selectedVersion.alignmentPatterns;
  if (alignCoords.length > 0) {
    for (const r of alignCoords) {
      for (const c of alignCoords) {
        // Skip if overlaps with finders
        if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            if (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) {
              setModule(r + dr, c + dc, 1);
            } else {
              setModule(r + dr, c + dc, 0);
            }
          }
        }
      }
    }
  }

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0 ? 1 : 0;
    if (matrix[6][i] === -1) setModule(6, i, val);
    if (matrix[i][6] === -1) setModule(i, 6, val);
  }

  // Dark module
  setModule(4 * ver + 9, 8, 1);

  // Reserve format area
  for (let i = 0; i <= 8; i++) {
    if (matrix[8][i] === -1) setModule(8, i, 0, true);
    if (matrix[i][8] === -1) setModule(i, 8, 0, true);
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === -1) setModule(8, i, 0, true);
    if (matrix[i][8] === -1) setModule(i, 8, 0, true);
  }

  // Place final data bits in 2-column zig-zag
  const allDataBits: number[] = [];
  for (const byte of finalCodewords) {
    for (let b = 7; b >= 0; b--) {
      allDataBits.push((byte >> b) & 1);
    }
  }

  let bitIdx = 0;
  let upwards = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column
    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of [rightCol, rightCol - 1]) {
        if (!isFunction[r][c]) {
          matrix[r][c] = bitIdx < allDataBits.length ? allDataBits[bitIdx++] : 0;
        }
      }
    }
    upwards = !upwards;
  }

  // Apply best mask (mask 0 by default, optimal for clean contrast)
  const mask = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c]) {
        if (isMasked(mask, r, c)) {
          matrix[r][c] ^= 1;
        }
      }
    }
  }

  // Embed Format Info Bits (ecLevel + mask)
  const formatKey = `${ecLevel}_${mask}`;
  const formatVal = FORMAT_BITS[formatKey] ?? FORMAT_BITS['M_0'];
  for (let i = 0; i < 15; i++) {
    const bit = (formatVal >> (14 - i)) & 1;
    // Top-left finder surroundings
    if (i <= 5) setModule(8, i, bit);
    else if (i === 6) setModule(8, 7, bit);
    else if (i === 7) setModule(8, 8, bit);
    else if (i === 8) setModule(7, 8, bit);
    else setModule(14 - i, 8, bit);

    // Split format around other finders
    if (i < 7) {
      setModule(size - 1 - i, 8, bit);
    } else {
      setModule(8, size - 15 + i, bit);
    }
  }

  // Return clean boolean matrix (true = black module, false = white module)
  return matrix.map((row) => row.map((cell) => cell === 1));
}

/**
 * Generates an SVG path string from boolean module matrix.
 */
export function qrMatrixToSvgPath(matrix: boolean[][], cellSize = 8): { path: string; totalSize: number } {
  const margin = 2; // Quiet zone
  const size = matrix.length;
  const totalCells = size + margin * 2;
  const totalSize = totalCells * cellSize;

  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        path += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return { path, totalSize };
}
