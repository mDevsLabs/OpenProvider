import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['gui/**', 'docs-site/**', 'dist/**', 'node_modules/**', 'tests/fixtures/**', 'coverage/**', '**/.tmp*', 'test_acl_*/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-control-regex': 'off',
      'no-useless-escape': 'off',
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
      'no-unsafe-finally': 'off',
      'require-yield': 'off',
      'prefer-const': 'off',
      'no-fallthrough': 'off',
      'no-empty': 'off',
      'no-useless-catch': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    },
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
