import { createClient } from '@sanity/client';
import matter from 'gray-matter';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

// Configuration
const PROJECT_ID = 'lnl0qvmy';
const DATASET = 'production';
const TOKEN = process.env.SANITY_WRITE_TOKEN; // Required for write operations

if (!TOKEN) {
  console.warn('⚠️ SANITY_WRITE_TOKEN is missing. Direct upload disabled. Generating NDJSON only.');
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: false,
  token: TOKEN,
  apiVersion: '2024-01-01',
});

const WEB_CONTENT_DIR = 'd:/Apps/ChampionsPrep/CPrep_Web/src/content';
const OUT_FILE = 'sanity-web-import.ndjson';
const documents = [];

async function migrateSubjects() {
  console.log('--- Migrating Subjects ---');
  const dir = join(WEB_CONTENT_DIR, 'subjects');
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));

  const classMap = {
    'accountancy': '11',
    'economics': '11',
    'business-studies': '11',
    'mathematics': '11',
    'english': '11'
  };

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = file.replace('.md', '');
    const subjectClass = classMap[slug] || '11';

    const doc = {
      _type: 'subject',
      _id: `subject-${slug}`,
      title: data.title,
      slug: { _type: 'slug', current: slug },
      description: data.description,
      icon: data.icon,
      keyTopics: data.keyTopics || [],
      chapters: (data.chapters || []).map(c => ({
        _key: Math.random().toString(36).substring(2, 11),
        name: c.name,
        price: c.price,
        description: c.description
      })),
      class: subjectClass,
      body: content,
    };

    try {
      documents.push(doc);
      if (TOKEN) {
        await client.createOrReplace(doc);
        console.log(`✅ Migrated Subject: ${slug} (Class ${subjectClass})`);
      }
    } catch (err) {
      console.error(`❌ Failed Subject: ${slug}`, err.message);
    }
  }
}

async function migrateExams() {
  console.log('--- Migrating Exams ---');
  const dir = join(WEB_CONTENT_DIR, 'exams');
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = file.replace('.md', '');

    const doc = {
      _type: 'exam',
      _id: `exam-${slug}`,
      title: data.title,
      slug: { _type: 'slug', current: slug },
      description: data.description,
      examDate: data.examDate,
      eligibility: data.eligibility,
      chapters: data.chapters || [],
      body: content,
    };

    try {
      documents.push(doc);
      if (TOKEN) {
        await client.createOrReplace(doc);
        console.log(`✅ Migrated Exam: ${slug}`);
      }
    } catch (err) {
      console.error(`❌ Failed Exam: ${slug}`, err.message);
    }
  }
}

async function migratePages() {
  console.log('--- Migrating Pages ---');
  const dir = join(WEB_CONTENT_DIR, 'pages');
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf-8');
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace('.md', '');

    const doc = {
      _type: 'page',
      _id: `page-${slug}`,
      title: data.title,
      slug: { _type: 'slug', current: slug },
      description: data.description,
      metaTitle: data.metaTitle,
      noIndex: !!data.noIndex,
      body: content,
    };

    try {
      documents.push(doc);
      if (TOKEN) {
        await client.createOrReplace(doc);
        console.log(`✅ Migrated Page: ${slug}`);
      }
    } catch (err) {
      console.error(`❌ Failed Page: ${slug}`, err.message);
    }
  }
}

async function migrateJSONCollections() {
  console.log('--- Migrating JSON Collections ---');
  
  // Testimonials
  const testimonialsRaw = JSON.parse(readFileSync(join(WEB_CONTENT_DIR, 'testimonials/index.json'), 'utf-8'));
  for (const t of testimonialsRaw.testimonials) {
    const id = `testimonial-${t.author.toLowerCase().replace(/\s+/g, '-')}`;
    const doc = {
      _type: 'testimonial',
      _id: id,
      author: t.author,
      role: t.role,
      content: t.content,
      rating: t.rating,
    };
    documents.push(doc);
    if (TOKEN) {
      await client.createOrReplace(doc);
      console.log(`✅ Migrated Testimonial: ${t.author}`);
    }
  }

  // FAQs
  const faqsRaw = JSON.parse(readFileSync(join(WEB_CONTENT_DIR, 'faqs/index.json'), 'utf-8'));
  for (const [idx, f] of faqsRaw.questions.entries()) {
    const id = `faq-${idx}`;
    const doc = {
      _type: 'faq',
      _id: id,
      question: f.name,
      answer: f.answer,
      order: idx
    };
    documents.push(doc);
    if (TOKEN) {
      await client.createOrReplace(doc);
      console.log(`✅ Migrated FAQ: ${f.name}`);
    }
  }

  // Features
  const featuresRaw = JSON.parse(readFileSync(join(WEB_CONTENT_DIR, 'features/index.json'), 'utf-8'));
  for (const f of featuresRaw.features) {
    const id = `feature-${f.title.toLowerCase().replace(/\s+/g, '-')}`;
    const doc = {
      _type: 'feature',
      _id: id,
      title: f.title,
      description: f.description,
      icon: f.icon
    };
    documents.push(doc);
    if (TOKEN) {
      await client.createOrReplace(doc);
      console.log(`✅ Migrated Feature: ${f.title}`);
    }
  }

  // Pricing
  const pricingRaw = JSON.parse(readFileSync(join(WEB_CONTENT_DIR, 'pricing/plans.json'), 'utf-8'));
  for (const [idx, p] of pricingRaw.plans.entries()) {
    const id = `pricing-${p.name.toLowerCase().replace(/\s+/g, '-')}`;
    const doc = {
      _type: 'pricingPlan',
      _id: id,
      name: p.name,
      price: p.price,
      description: p.description,
      features: p.features,
      highlighted: !!p.highlighted,
      order: idx
    };
    documents.push(doc);
    if (TOKEN) {
      await client.createOrReplace(doc);
      console.log(`✅ Migrated Pricing: ${p.name}`);
    }
  }
}

async function writeNDJSON() {
  const { writeFileSync } = await import('fs');
  writeFileSync(OUT_FILE, documents.map(d => JSON.stringify(d)).join('\n'), 'utf-8');
  console.log(`\n📄 Exported documents to ${OUT_FILE}`);
}

async function run() {
  try {
    await migrateSubjects();
    await migrateExams();
    await migratePages();
    await migrateJSONCollections();
    await writeNDJSON();
    console.log('\n🌟 Migration Completed successfully!');
  } catch (err) {
    console.error('FATAL ERROR:', err);
  }
}

run();
