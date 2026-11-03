import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mescoutt.github.io',
  // Сайт лежит в подпапке /mtvare/ общего портфолио на GitHub Pages
  base: '/mtvare/',
  // host: true — сайт открывается и по localhost, и по 127.0.0.1, и с телефона в той же Wi-Fi
  server: { host: true },
});
