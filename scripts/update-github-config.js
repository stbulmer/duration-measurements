const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

const configPath = path.join(__dirname, '../static/github-config.js');
const config = {
  token: process.env.GITHUB_TOKEN || '',
  owner: process.env.GITHUB_OWNER || '',
  repo: process.env.GITHUB_REPO || '',
};

const content = `window.GITHUB_CONFIG = ${JSON.stringify(config, null, 2)};`;

fs.writeFileSync(configPath, content);
console.log('GitHub configuration updated successfully!'); 