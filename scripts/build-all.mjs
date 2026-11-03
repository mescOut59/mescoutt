// Собирает все 5 проектов в один сайт в папке _site/:
//   _site/          ← vitrina (портфолио)
//   _site/grafit/   ← барбершоп
//   _site/pudra/    ← салон красоты
//   _site/mtvare/   ← ресторан
//   _site/penka/    ← кофейня
//
// Запуск из папки «Портфолио»:  node scripts/build-all.mjs
// Посмотреть результат:          npx serve _site   (или любой статический сервер)
// На GitHub то же самое делает .github/workflows/deploy.yml при каждом push.

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');
const demos = ['grafit', 'pudra', 'mtvare', 'penka'];
const all = ['vitrina', ...demos];

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

for (const p of all) {
  const dir = path.join(root, p);
  console.log(`\n=== ${p}`);
  if (!fs.existsSync(path.join(dir, 'node_modules'))) run('npm ci', dir);
  run('npm run build', dir);
}

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'vitrina', 'dist'), out, { recursive: true });
for (const p of demos) {
  fs.cpSync(path.join(root, p, 'dist'), path.join(out, p), { recursive: true });
}

console.log(`\nГотово: ${out}`);
