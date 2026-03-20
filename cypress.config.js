const { defineConfig } = require('cypress');
const fs = require('fs/promises');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      on('task', {
        async deleteFolder(folderName) {
          await fs.rm(folderName, { force: true, recursive: true });
          return null;
        },
      });

      return config;
    },
  },
});
