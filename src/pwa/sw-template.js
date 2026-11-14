/* Service worker do Simulador 3D de Física (gerado no build — não editar dist/sw.js).
 * - Pré-armazena o "esqueleto" do app (HTML, JS, CSS, fontes, ícones) na instalação,
 *   para o app abrir mesmo sem internet.
 * - Texturas, modelos 3D e cenários (pasta /assets/) são guardados na primeira vez
 *   em que cada aula é aberta e depois servidos do aparelho.
 */
const VERSION = "__VERSION__";
const PRECACHE = `fisica-precache-${VERSION}`;
const RUNTIME = "fisica-runtime-v1";
const PRECACHE_URLS = __PRECACHE_URLS__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("fisica-precache-") && k !== PRECACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Páginas (rotas do React Router): tenta a rede e, sem internet, usa o index.html salvo.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html", { cacheName: PRECACHE }))
    );
    return;
  }

  // Demais arquivos: primeiro do aparelho; se não tiver, baixa e guarda.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
