import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Gera dist/sw.js (service worker do PWA) com a lista de arquivos do build para
// funcionar sem internet. Os arquivos grandes de /assets/ (texturas, modelos 3D)
// não entram na pré-instalação: são guardados quando cada aula é aberta.
function serviceWorker() {
  let outDir = 'dist'
  return {
    name: 'fisica-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const files = []
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name)
          if (statSync(full).isDirectory()) walk(full)
          else files.push('/' + relative(outDir, full).split(sep).join('/'))
        }
      }
      walk(outDir)
      const urls = files.filter(
        (f) =>
          f !== '/sw.js' &&
          !f.startsWith('/assets/env/') &&
          !f.startsWith('/assets/models/') &&
          !f.startsWith('/assets/planets/')
      )
      const template = readFileSync('src/pwa/sw-template.js', 'utf8')
      const sw = template
        .replace('__VERSION__', Date.now().toString(36))
        .replace('__PRECACHE_URLS__', JSON.stringify(urls, null, 2))
      writeFileSync(join(outDir, 'sw.js'), sw)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
})
