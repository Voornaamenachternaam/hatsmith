// eslint.config.js (CommonJS)
const js = require('@eslint/js');
const globals = require('globals');
const nextPlugin = require('@next/eslint-plugin-next');
const reactHooks = require('eslint-plugin-react-hooks');
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

  // React/Next.js specific configuration
  {
    files: ['src/**/*.{js,jsx}', 'pages/**/*.{js,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-html-link-for-pages': 'off'
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
