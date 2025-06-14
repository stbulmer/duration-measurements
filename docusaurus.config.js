const config = {
  // ... other config options ...

  customFields: {
    githubToken: process.env.GITHUB_TOKEN || '',
    githubOwner: process.env.GITHUB_OWNER || '',
    githubRepo: process.env.GITHUB_REPO || '',
  },

  themeConfig: {
    // ... other theme config ...
  },

  // Add this section to expose environment variables to the client
  scripts: [
    {
      src: '/github-config.js',
      async: true,
    },
  ],

  // ... rest of config ...
};

module.exports = config; 