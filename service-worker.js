// SERVICE WORKER PARA RAYAN APP PWA
console.log('[Service Worker] Iniciando...');

// Nombre de cache - cambiar versión para actualizar
const CACHE_NAME = 'rayan-app-v4';

// Archivos a cachear (rutas relativas)
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cacheando archivos');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[Service Worker] Instalado correctamente');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Error al cachear:', error);
            })
    );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activando...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Borrando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activado correctamente');
            return self.clients.claim();
        })
    );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
    // Ignorar peticiones que no sean HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si está en cache, devolver cache
                if (response) {
                    return response;
                }
                
                // Si no, buscar en red
                return fetch(event.request)
                    .then((response) => {
                        // Si la respuesta no es válida, devolverla sin cachear
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // Clonar la respuesta
                        const responseToCache = response.clone();
                        
                        // Cachear solo recursos de la misma app
                        if (event.request.url.indexOf('http') === 0) {
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        
                        return response;
                    })
                    .catch((error) => {
                        console.log('[Service Worker] Error de red:', error);
                        // Intentar devolver página principal desde cache
                        return caches.match('./index.html');
                    });
            })
    );
});

console.log('[Service Worker] Configurado y listo');
