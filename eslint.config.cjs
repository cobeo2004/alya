const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', 'eslint.config.cjs', '.prettierrc.cjs'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parser: require('espree'),
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 2020,
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
    },
  },
  {
    files: ['src/lib/translator.ts'],
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
];
