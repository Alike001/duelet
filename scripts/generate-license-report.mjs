import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const packages = JSON.parse(
  execFileSync('npm', ['query', '*', '--json'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }),
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
  'Original Duelet source remains MIT-licensed. Third-party packages retain',
  'their own licenses and are not relicensed by Duelet.',
  '',
  '`@walletconnect/ethereum-provider` is distributed under the WalletConnect',
  'Community License Agreement rather than MIT. The owner accepted that license',
  'before integration. Its required notice is: “Portions © 2025 Reown, Inc. All',
  'Rights Reserved.” The exact agreement is preserved at',
  '`docs/licenses/WALLETCONNECT_COMMUNITY_LICENSE.md`.',
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
