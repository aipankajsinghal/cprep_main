import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, '../public/data/instagram-briefs.json');

async function generateBriefs() {
  try {
    // Check if required Sanity environment variables are set
    if (!process.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID.includes('your_project_id')) {
      console.log('⏭️  Skipping Instagram briefs generation: SANITY_PROJECT_ID not configured');
      console.log('   Configure Sanity environment variables in Vercel to enable briefs generation');
      return;
    }

    const briefs = [];

    // Initialize Sanity Client
    const { createClient } = await import('@sanity/client');
    const client = createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET || 'production',
      apiVersion: process.env.SANITY_API_VERSION || '2024-01-01',
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    });

    const query = `*[_type == "post" && draft != true] {
      "slug": slug.current,
      title,
      description,
      tags,
      publishDate
    }`;

    const posts = await client.fetch(query);

    const now = new Date();

    for (const post of posts) {
      if (!post.slug || !post.title || !post.description) {
        console.warn(`⚠️ Skipped post: Missing required fields (slug/title/description)`);
        continue;
      }

      const publishDate = post.publishDate ? new Date(post.publishDate) : null;

      // Determine publish status
      let status = 'published';
      let daysUntilPublish = null;

      if (publishDate && publishDate > now) {
        status = 'scheduled';
        daysUntilPublish = Math.ceil(
          (publishDate - now) / (1000 * 60 * 60 * 24)
        );
      }

      // Create Instagram brief (max 300 chars for caption + hashtags)
      const brief = {
        slug: post.slug,
        title: post.title,
        description: post.description,
        url: `https://www.championsprep.in/blog/${post.slug}/`,
        hashTags: post.tags && post.tags.length > 0
          ? post.tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '')}`).join(' ')
          : '#ChampionsPrep #Commerce #Exam',
        status,
        publishDate: publishDate?.toISOString().split('T')[0],
        daysUntilPublish,
        // Instagram caption template (ready to copy-paste)
        caption: [
          post.description,
          '',
          `Read full article: https://www.championsprep.in/blog/${post.slug}/`,
          '',
          post.tags && post.tags.length > 0
            ? post.tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '')}`).join(' ')
            : '#ChampionsPrep #Commerce #Exam'
        ].join('\n')
      };

      briefs.push(brief);
    }

    // Sort by publish date (scheduled first, then published by date descending)
    briefs.sort((a, b) => {
      if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
      if (a.status !== 'scheduled' && b.status === 'scheduled') return 1;
      if (a.publishDate && b.publishDate) {
        return new Date(b.publishDate) - new Date(a.publishDate);
      }
      return 0;
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      try {
        fs.mkdirSync(outputDir, { recursive: true });
      } catch (error) {
        console.error(`❌ Failed to create output directory: ${error.message}`);
        process.exit(1);
      }
    }

    // Write to JSON file
    try {
      fs.writeFileSync(outputFile, JSON.stringify(briefs, null, 2), 'utf-8');
    } catch (error) {
      console.error(`❌ Failed to write briefs file: ${error.message}`);
      process.exit(1);
    }

    console.log(`✓ Generated ${briefs.length} Instagram briefs`);
    console.log(`✓ Saved to ${outputFile}`);

    // Log scheduled posts
    const scheduled = briefs.filter(b => b.status === 'scheduled');
    if (scheduled.length > 0) {
      console.log('\n📅 Scheduled Posts:');
      scheduled.forEach(b => {
        console.log(`  • ${b.title} (in ${b.daysUntilPublish} days)`);
      });
    }
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

generateBriefs().catch(err => {
  console.error('Error generating briefs:', err);
  process.exit(1);
});
