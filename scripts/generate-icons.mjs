// Erzeugt App-Icons (PNG) ohne externe Abhängigkeiten – pures zlib.
// Zeichnet einen Farbverlauf-Hintergrund + weiße Hantel.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/icons')
mkdirSync(OUT, { recursive: true })

const C1 = [0x1f, 0x74, 0xff] // Curaçao-Blau
const C2 = [0x16, 0xd6, 0xff] // Cyan
const PLATE = [0xe3, 0xff, 0x39] // Neongelb (Hantel)

function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function render(size, { pad = 0 } = {}) {
  const buf = Buffer.alloc(size * size * 4)
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const i = (y * size + x) * 4
    buf[i] = r
    buf[i + 1] = g
    buf[i + 2] = b
    buf[i + 3] = a
  }
  // Hintergrund: diagonaler Verlauf
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size)
      set(x, y, lerp(C1, C2, t))
    }
  }
  // Hantel (weiß), zentriert; pad lässt Rand für maskable.
  const s = size
  const inset = pad
  const cx = s / 2
  const cy = s / 2
  const fillRect = (x0, y0, w, h) => {
    for (let y = Math.round(y0); y < Math.round(y0 + h); y++)
      for (let x = Math.round(x0); x < Math.round(x0 + w); x++) set(x, y, PLATE)
  }
  const usable = s - inset * 2
  const barLen = usable * 0.5
  const barH = usable * 0.085
  // Stange
  fillRect(cx - barLen / 2, cy - barH / 2, barLen, barH)
  // Gewichtsscheiben (zwei pro Seite)
  const plateW = usable * 0.07
  const gap = usable * 0.02
  const innerH = usable * 0.30
  const outerH = usable * 0.20
  const leftInnerX = cx - barLen / 2 - gap - plateW
  const leftOuterX = leftInnerX - gap - plateW
  const rightInnerX = cx + barLen / 2 + gap
  const rightOuterX = rightInnerX + gap + plateW
  fillRect(leftInnerX, cy - innerH / 2, plateW, innerH)
  fillRect(leftOuterX, cy - outerH / 2, plateW, outerH)
  fillRect(rightInnerX, cy - innerH / 2, plateW, innerH)
  fillRect(rightOuterX, cy - outerH / 2, plateW, outerH)
  return buf
}

// ---- minimaler PNG-Encoder ----
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crc])
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  // raw mit Filter-Byte 0 pro Zeile
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

const targets = [
  ['icon-512.png', 512, { pad: 60 }],
  ['icon-192.png', 192, { pad: 22 }],
  ['icon-maskable-512.png', 512, { pad: 110 }], // mehr Rand für Safe-Zone
  ['apple-touch-icon.png', 180, { pad: 20 }],
]
for (const [name, size, opt] of targets) {
  writeFileSync(resolve(OUT, name), encodePNG(size, render(size, opt)))
  console.log('✓', name)
}
console.log('Icons erzeugt in', OUT)
