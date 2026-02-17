// Netlify scheduled function to trigger a site rebuild for publishing scheduled posts
// Runs daily at 00:00 UTC
// This allows posts with publishDate in the future to be automatically published
// Note: Uses Node's built-in fetch (available in Node 18+)

export default async (req, context) => {
  try {
    // Trigger a new deploy using Netlify Build API
    const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID;
    
    if (!netlifyToken || !siteId) {
      console.log('ℹ️ Scheduled rebuild skipped: Missing NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID');
      console.log('To enable automatic publishing of scheduled posts:');
      console.log('1. Set NETLIFY_AUTH_TOKEN in Netlify environment variables');
      console.log('2. Set NETLIFY_SITE_ID in Netlify environment variables');
      return {
        statusCode: 503,
        body: JSON.stringify({ message: 'Scheduled rebuild not configured' })
      };
    }

    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/builds`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Build API error: ${response.statusCode}`);
    }

    const data = await response.json();
    console.log(`✓ Scheduled rebuild triggered - Build ID: ${data.id}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Rebuild triggered for scheduled posts',
        buildId: data.id
      })
    };
  } catch (error) {
    console.error('Error triggering rebuild:', error.message);
    const isDev = process.env.NODE_ENV === 'development';
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: isDev ? error.message : 'Rebuild trigger failed'
      })
    };
  }
};

export const config = {
  schedule: '0 0 * * *' // Daily at 00:00 UTC
};
