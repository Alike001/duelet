import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const packages = JSON.parse(
  execFileSync('npm', ['query', '*', '--json'], { encoding: 'utf8' }),
)
  .filter((entry) => entry.location.startsWith('node_modules/'))
  .map(({ license, name, version }) => ({
    license: license ?? 'UNDECLARED',
    name,
    version,
  }))
  .sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );

const lines = [
  '# Installed dependency license inventory',
  '',
  'Generated from installed package metadata by `npm run licenses:generate`.',
  'The package lock is authoritative for the resolved dependency graph.',
  '',
  '| Package | Version | Declared license |',
  '| --- | ---: | --- |',
  ...packages.map(
    ({ license, name, version }) =>
      `| \`${name}\` | ${version} | ${String(license).replaceAll('|', '\\|')} |`,
  ),
  '',
];

writeFileSync(
  new URL('../docs/DEPENDENCY_LICENSES.md', import.meta.url),
  lines.join('\n'),
);
console.log(`Recorded ${packages.length} installed dependency entries.`);
