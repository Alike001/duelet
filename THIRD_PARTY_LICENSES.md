# Third-party licenses

Dependency versions are locked in `package-lock.json`. This inventory covers
the direct dependencies selected through Phase 1. The complete installed transitive
inventory is generated in `docs/DEPENDENCY_LICENSES.md`; original notices remain
in each installed package.

| Dependency              | Version | License           | Planned use                          |
| ----------------------- | ------: | ----------------- | ------------------------------------ |
| Next.js                 |  16.4.0 | MIT               | Web application framework            |
| React                   |  19.2.8 | MIT               | Web rendering                        |
| React DOM               |  19.2.8 | MIT               | Browser rendering                    |
| Tailwind CSS            |   4.3.3 | MIT               | Styling foundation                   |
| Tailwind PostCSS plugin |   4.3.3 | MIT               | CSS build integration                |
| TypeScript              |   5.9.3 | Apache-2.0        | Static type checking                 |
| ESLint                  | 10.12.0 | MIT               | Web linting                          |
| `@eslint/js`            |  10.0.1 | MIT               | Core ESLint rule configuration       |
| typescript-eslint       |  8.71.2 | MIT               | TypeScript lint rules                |
| Prettier                |  3.9.10 | MIT               | Repository formatting                |
| OpenZeppelin Contracts  |   5.6.1 | MIT               | SafeERC20, Math, and ReentrancyGuard |
| Forge Standard Library  |  1.11.0 | MIT OR Apache-2.0 | Solidity testing utilities           |

## Reference-product source

- Request Network's `ERC20FeeProxy` is MIT-licensed. No Request source has
  been copied. If reused later, its copyright and license notice
  must be preserved.
- Sablier source is not copied. Duelet independently implements
  the documented financial behavior.
- Helio source is not copied. The reviewed EVM adapter declares
  AGPL-3.0-or-later.
- Peridot has no repository-wide license. File-level SPDX notices do not grant
  a blanket license over the repository.
