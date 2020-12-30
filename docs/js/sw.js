"use strict";
const ctx = self;
ctx.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open('qrcode-caches');
        await cache.addAll([
            '../',
            '../index.html',
            '../js/main.js',
            '../css/main.css',
            '../js/sw.js',
        ]);
    })());
});
ctx.addEventListener('fetch', event => {
    event.respondWith((async () => {
        const response = await caches.match(event.request);
        return response || (await fetch(event.request));
    })());
});
