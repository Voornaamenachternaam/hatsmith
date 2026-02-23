// eslint.config.js (CommonJS)
const js = require('@eslint/js');
const globals = require('globals');
const reactHooks = require('eslint-plugin-react-hooks');
const { reactRefresh } = require('eslint-plugin-react-refresh');
const nextPlugin = require('@next/eslint-plugin-next');
const cypress = require('eslint-plugin-cypress');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // Global ignores - must be first
  {
    ignores: [
      '.next/**/*',
      'out/**/*',
      'node_modules/**/*',
      'public/service-worker.js'
    ]
  },

  // Base JavaScript configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn'
    }
  },

  // React/Next.js specific configuration for src files
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh.plugin,
      '@next/next': nextPlugin
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }
      ]
    }
  },

  // Next.js pages and app directory configuration
  {
    files: ['pages/**/*.js', 'app/**/*.js'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh.plugin,
      '@next/next': nextPlugin
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },

  // Service worker specific configuration
  {
    files: ['service-worker/**/*.js', '**/service-worker.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        self: 'readonly'
      }
    }
  },

  // Cypress test configuration
  {
    files: ['cypress/**/*.js'],
    ...cypress.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.mocha
      }
    },
    rules: {
      'cypress/no-unnecessary-waiting': 'off' // Allow cy.wait() for animations
    }
  },

  // Configuration files (less strict)
  {
    files: ['*.config.js', '.*.js'],
    rules: {
      'no-console': 'off'
    }
  }
];
