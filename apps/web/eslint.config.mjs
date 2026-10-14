import eslint from '@eslint/js';
import typescriptEslint from 'typescript-eslint';

export default typescriptEslint.config(
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
);
