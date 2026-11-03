import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mescoutt.github.io',
  // Сайт лежит в подпапке /grafit/ общего портфолио на GitHub Pages
  base: '/grafit/',
  server: { host: true },
});