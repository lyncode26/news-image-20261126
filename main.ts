// News Image entry for 26 November 2025 (make.fun news-image-20261126).
//
// The artwork lives beside this file as entry.png: a one-page editorial
// collage of the day — Hong Kong's Tai Po tower fire as the lead story,
// with panels for the Guinea-Bissau coup, the White House guardsmen
// shooting, Bitcoin reclaiming $90,000 as Texas buys in, and the Thailand
// floods. This program validates the PNG against the gate's limits and
// then publishes it to the output directory byte for byte, so the judge
// sees exactly the image that ships in this repository.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_BYTES = 1024 * 1024; // the gate takes at most 1 MiB
const EXPECTED_SIZE = 1024; // and at most 1024 x 1024 pixels

function fail(message: string): never {
  console.error(`news-image: ${message}`);
  process.exit(1);
}

const imagePath = new URL('./entry.png', import.meta.url);
const bytes = readFileSync(imagePath);

if (bytes.length > MAX_BYTES) {
  fail(`entry.png is ${bytes.length} bytes, over the 1 MiB gate limit`);
}
if (!PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) {
  fail('entry.png does not start with a PNG signature');
}

// IHDR sits right after the signature: length(4) + "IHDR"(4), then the
// width and height as big-endian uint32s.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width !== EXPECTED_SIZE || height !== EXPECTED_SIZE) {
  fail(`entry.png is ${width}x${height}, expected ${EXPECTED_SIZE}x${EXPECTED_SIZE}`);
}
// A truncated upload would still pass the checks above, so require the
// IEND chunk at the very end of the file as well.
const trailer = bytes.subarray(bytes.length - 12);
if (trailer.readUInt32BE(4) !== 0x49454e44) {
  // "IEND"
  fail('entry.png is missing its IEND trailer (file looks truncated)');
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), bytes);
const digest = createHash('sha256').update(bytes).digest('hex');
console.log(
  `news-image: wrote ${bytes.length} bytes (${width}x${height}, sha256 ${digest}) to ${join(outDir, 'entry.png')}`,
);
