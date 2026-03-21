const path = require('path');
const fs = require('fs/promises');
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      const downloadsRoot = path.resolve(config.projectRoot, config.downloadsFolder);
      
on('task', {
    async deleteFolder(folderName) {
      const downloadsRoot = path.resolve(config.projectRoot, config.downloadsFolder);
      const target = path.resolve(config.projectRoot, folderName);
      if (target !== downloadsRoot && !target.startsWith(`${downloadsRoot}${path.sep}`)) {
        throw new Error(`Refusing to delete outside downloadsFolder: ${folderName}`);
      }
      await fs.rm(target, { force: true, recursive: true });
      return null;
    },
  });
      });

      return config;
    },
  },
});
