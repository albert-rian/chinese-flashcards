// Generates apple-touch-icon.png, icon-192.png, icon-512.png into /public
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')

// Flash card on green Duolingo background
// 字 = the Chinese word for "character / written word"
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Green background -->
  <rect width="512" height="512" fill="#58CC02"/>

  <!-- Card shadow -->
  <rect x="112" y="138" width="300" height="252" rx="26" fill="#46A302" opacity="0.5"/>

  <!-- White flash card -->
  <rect x="100" y="122" width="300" height="252" rx="26" fill="white"/>

  <!-- Top line decoration (like pinyin lines on a card) -->
  <line x1="120" y1="168" x2="380" y2="168" stroke="#E5E5E5" stroke-width="2"/>

  <!-- Chinese character 字 (meaning: character / written word) -->
  <text
    x="250" y="316"
    text-anchor="middle"
    font-family="'Microsoft YaHei','PingFang SC','Noto Sans CJK SC','SimHei','WenQuanYi Micro Hei',serif"
    font-size="172"
    font-weight="700"
    fill="#3C3C3C">字</text>
</svg>`

const sizes = [
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

const buf = Buffer.from(svg)

for (const { size, name } of sizes) {
  const outPath = path.join(publicDir, name)
  await sharp(buf, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outPath)
  console.log(`✓ ${name} (${size}×${size})`)
}

console.log('Done.')
