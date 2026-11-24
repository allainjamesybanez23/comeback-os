import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const svg = new URL('../build/icon.svg', import.meta.url)
const sizes = [16, 24, 32, 48, 64, 128, 256]
const pngs = await Promise.all(sizes.map(size => sharp(fileURLToPath(svg)).resize(size).png().toBuffer()))
const header = Buffer.alloc(6 + 16 * sizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = header.length
for (const [index, size] of sizes.entries()) {
  const entry = 6 + 16 * index
  header.writeUInt8(size % 256, entry)
  header.writeUInt8(size % 256, entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(pngs[index].length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += pngs[index].length
}
await writeFile(new URL('../build/icon.ico', import.meta.url), Buffer.concat([header, ...pngs]))
