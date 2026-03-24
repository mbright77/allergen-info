import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const publicDir = resolve(projectRoot, 'public')
const faviconPath = resolve(publicDir, 'favicon.svg')
const manifestPath = resolve(publicDir, 'manifest.webmanifest')
const metaPath = resolve(projectRoot, 'src', 'app', 'build-meta.ts')
const appBasePath = process.env.VITE_APP_BASE_PATH || '/'

const favicon = await readFile(faviconPath, 'utf8')
const version = createHash('sha256').update(favicon).update(String(Date.now())).digest('hex').slice(0, 12)

const manifest = {
  name: 'SafeScan',
  short_name: 'SafeScan',
  description: 'A mobile-first allergen scanner for safer grocery decisions.',
  start_url: appBasePath,
  scope: appBasePath,
  display: 'standalone',
  background_color: '#fcf9f8',
  theme_color: '#00442d',
  lang: 'en',
  icons: [
    {
      src: `${appBasePath}favicon.svg`,
      sizes: '48x46',
      type: 'image/svg+xml',
      purpose: 'any maskable',
    },
  ],
}

await mkdir(resolve(projectRoot, 'src', 'app'), { recursive: true })
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
await writeFile(
  metaPath,
  `export const APP_BUILD_VERSION = '${version}'\n`,
  'utf8',
)
