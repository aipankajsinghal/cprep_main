// CommonJS Sanity CLI config (CLI requires CommonJS when studio package is ESM)
module.exports = {
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'lnl0qvmy',
    dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  },
};
