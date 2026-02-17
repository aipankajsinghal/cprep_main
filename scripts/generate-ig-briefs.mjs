import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '../src/content/blog');
const outputFile = path.join(__dirname, '../public/data/instagram-briefs.json');

async function parseFrontmatter(content) {
  // First try to match the frontmatter block (handles both LF and CRLF line endings)
  let fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  if (!fmMatch) {
    return null;
  }

  return parseFrontmatterText(fmMatch[1]);
}

function parseFrontmatterText(fmText) {
  const frontmatter = {};

  const lines = fmText.split(/\r?\n/);
  let currentKey = null;
  let arrayMode = false;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Handle array items
    if (arrayMode && line.match(/^\s*-\s/)) {
      const value = line.replace(/^\s*-\s/, '').trim().replace(/^['"]|['"]$/g, '');
      frontmatter[currentKey].push(value);
      continue;
    }

    // Handle key: value pairs
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const trimmedKey = key.trim();
      const value = valueParts.join(':').trim();

      if (trimmedKey === 'title') {
        frontmatter.title = value.replace(/^['"]|['"]$/g, '');
        currentKey = null;
        arrayMode = false;
      } else if (trimmedKey === 'description') {
        frontmatter.description = value.replace(/^['"]|['"]$/g, '');
        currentKey = null;
        arrayMode = false;
      } else if (trimmedKey === 'date') {
        frontmatter.date = new Date(value);
        currentKey = null;
        arrayMode = false;
      } else if (trimmedKey === 'publishDate') {
        frontmatter.publishDate = new Date(value);
        currentKey = null;
        arrayMode = false;
      } else if (trimmedKey === 'draft') {
        frontmatter.draft = value === 'true';
        currentKey = null;
        arrayMode = false;
      } else if (trimmedKey === 'tags') {
        frontmatter.tags = [];
        currentKey = 'tags';
        arrayMode = true;
      } else if (trimmedKey === 'cluster') {
        frontmatter.cluster = value;
        currentKey = null;
        arrayMode = false;
      }
    }
  }

  return frontmatter;
}

async function generateBriefs() {
  try {
    const briefs = [];
    
    let files;
    try {
      files = fs.readdirSync(contentDir).filter(f => f.endsWith('.mdx'));
    } catch (error) {
      console.error(`❌ Failed to read content directory: ${error.message}`);
      process.exit(1);
    }

    for (const file of files) {
      if (file === '_template.mdx') continue;

      try {
        const filePath = path.join(contentDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontmatter = await parseFrontmatter(content);

        // Validate required fields
        if (!frontmatter || !frontmatter.title || !frontmatter.description) {
          console.warn(`⚠️ Skipped ${file}: Missing required frontmatter fields (title, description)`);
          continue;
        }

        // Only include non-draft posts
        if (frontmatter.draft) continue;

        // Validate dates
        if (frontmatter.date && isNaN(new Date(frontmatter.date).getTime())) {
          console.warn(`⚠️ Skipped ${file}: Invalid date format`);
          continue;
        }

        if (frontmatter.publishDate && isNaN(new Date(frontmatter.publishDate).getTime())) {
          console.warn(`⚠️ Skipped ${file}: Invalid publishDate format`);
          continue;
        }

        const slug = file.replace('.mdx', '');
        const now = new Date();

        // Determine publish status
        let status = 'published';
        let daysUntilPublish = null;

        if (frontmatter.publishDate) {
          if (frontmatter.publishDate > now) {
            status = 'scheduled';
            daysUntilPublish = Math.ceil(
              (frontmatter.publishDate - now) / (1000 * 60 * 60 * 24)
            );
          }
        }

        // Create Instagram brief (max 300 chars for caption + hashtags)
        const brief = {
          slug,
          title: frontmatter.title,
          description: frontmatter.description,
          url: `https://www.championsprep.in/blog/${slug}/`,
          hashTags: frontmatter.tags && frontmatter.tags.length > 0
            ? frontmatter.tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '')}`).join(' ')
            : '#ChampionsPrep #Commerce #Exam',
          status,
          publishDate: frontmatter.publishDate?.toISOString().split('T')[0],
          daysUntilPublish,
          // Instagram caption template (ready to copy-paste)
          caption: [
            frontmatter.description,
            '',
            `Read full article: https://www.championsprep.in/blog/${slug}/`,
            '',
            frontmatter.tags && frontmatter.tags.length > 0
              ? frontmatter.tags.map(t => `#${t.toLowerCase().replace(/\s+/g, '')}`).join(' ')
              : '#ChampionsPrep #Commerce #Exam'
          ].join('\n')
        };

        briefs.push(brief);
      } catch (error) {
        console.warn(`⚠️ Failed to process ${file}: ${error.message}`);
        continue;
      }
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
