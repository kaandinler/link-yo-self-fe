import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import * as pluginReactHooks from 'eslint-plugin-react-hooks';

// Import your rules from the old config
const customRules = {
  'array-callback-return': 'error',
  eqeqeq: 'error',
  'no-alert': 'error',
  'no-return-assign': 'error',
  'no-undef': 'error',
  'no-unused-vars': 'warn',
  'no-empty-pattern': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  // Allow auto-fixing when using --fix
  'prefer-const': 'warn',
  'no-extra-semi': 'warn',
  semi: ['warn', 'always'],
  quotes: [
    'warn',
    'single',
    { avoidEscape: true, allowTemplateLiterals: true },
  ],
  // Add other rules as needed from your .eslintrc.json file
};

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    rules: {
      ...js.configs.recommended.rules,
      ...customRules,
    },
    linterOptions: {
      reportUnusedDisableDirectives: true, // Migrated from old config
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.node,
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Disable the React import requirement for JSX
      'react/prop-types': 'off', // Optional: Disable prop-types as you're using TypeScript
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }], // Allow apostrophes and quotes
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade any type to warning
      '@typescript-eslint/no-unused-vars': 'warn', // Downgrade unused vars to warning
      '@typescript-eslint/no-empty-object-type': 'warn', // Downgrade empty object type to warning
      'react-hooks/rules-of-hooks': 'error', // Add rules of hooks
      'react-hooks/exhaustive-deps': 'warn', // Add exhaustive deps
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': ['warn', { fixToUnknown: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-constant-binary-expression': 'warn',
    },
  },
  {
    ignores: ['**/node_modules/**', 'build/**', '.next/**', 'dist/**'], // Equivalent to old ignorePatterns
  },
];
