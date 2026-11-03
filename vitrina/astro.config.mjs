import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mescout59.github.io',
  // Витрина лежит в корне репозитория mescoutt на GitHub Pages: https://mescout59.github.io/mescoutt/
  base: '/mescoutt/',
  // host: true — сайт открывается и по localhost, и по 127.0.0.1, и с телефона в той же Wi-Fi
  server: { host: true },
});
