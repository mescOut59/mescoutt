import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mescout59.github.io',
  // Сайт лежит в подпапке общего портфолио на GitHub Pages:
  // https://mescout59.github.io/mescoutt/penka/  (mescoutt — имя репозитория)
  base: '/mescoutt/penka/',
  // host: true — сайт открывается и по localhost, и по 127.0.0.1, и с телефона в той же Wi-Fi
  server: { host: true },
});
