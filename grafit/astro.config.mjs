import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mescout59.github.io',
  // Сайт лежит в подпапке общего портфолио на GitHub Pages:
  // https://mescout59.github.io/mescoutt/grafit/  (mescoutt — имя репозитория)
  base: '/mescoutt/grafit/',
  server: { host: true },
});