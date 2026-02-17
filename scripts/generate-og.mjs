import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import fg from "fast-glob";
import matter from "gray-matter";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const cwd = process.cwd();
const postsPattern = "src/content/blog/**/*.{md,mdx}";
const ogOutDir = path.join(cwd, "public", "blog", "og");

// Font now stored locally in the repo
const fontPath = path.join(cwd, "public", "fonts", "inter-600-normal.woff");

function toSlug(filePath) {
  const rel = path.relative(path.join(cwd, "src", "content", "blog"), filePath);
  return rel.replace(/\\/g, "/").replace(/\.(md|mdx)$/i, "");
}

function cleanTitle(title) {
  return String(title || "ChampionsPrep Blog").trim().slice(0, 120);
}

async function generateOne({ title, slug, fontData, logoDataUri = null }) {
  const element = {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        backgroundColor: "#ffffff",
        color: "#111827",
        fontFamily: "Inter"
      },
      children: [
        // Brand block (logo + label)
        logoDataUri
          ? {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "180px",
                        height: "44px",
                        backgroundImage: `url(${logoDataUri})`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "left center"
                      }
                    }
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        color: "#6D5CF5",
                        fontSize: "30px",
                        fontWeight: 600
                      },
                      children: "ChampionsPrep Blog"
                    }
                  }
                ]
              }
            }
          : {
              type: "div",
              props: {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: "#6D5CF5",
                  fontSize: "30px",
                  fontWeight: 600
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "14px",
                        height: "14px",
                        transform: "rotate(45deg)",
                        backgroundColor: "#8B7CF6"
                      }
                    }
                  },
                  "ChampionsPrep Blog"
                ]
              }
            },
        {
          type: "div",
          props: {
            style: {
              fontSize: "60px",
              lineHeight: 1.15,
              fontWeight: 600,
              maxWidth: "1000px"
            },
            children: cleanTitle(title)
          }
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: "28px",
              color: "#4B5563"
            },
            children: `championsprep.in/blog/${slug}`
          }
        }
      ]
    }
  };

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: fontData,
        weight: 600,
        style: "normal"
      }
    ]
  });

  const pngData = new Resvg(svg).render().asPng();
  const outFile = path.join(ogOutDir, `${slug}.png`);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, pngData);
}

async function main() {
  try {
    // Verify font file exists
    try {
      await fs.access(fontPath);
    } catch {
      console.error(`❌ Font file not found at: ${fontPath}`);
      console.error(`Please run: cp node_modules/@fontsource/inter/files/inter-latin-600-normal.woff public/fonts/inter-600-normal.woff`);
      process.exit(1);
    }

    const fontData = await fs.readFile(fontPath);
    // Attempt to load site logo for embedding into OG images
    const logoPath = path.join(cwd, 'public', 'icons', 'insights-logo.svg');
    let logoDataUri = null;
    try {
      const logoRaw = await fs.readFile(logoPath, 'utf8');
      logoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(logoRaw)}`;
    } catch (e) {
      // logo optional
      logoDataUri = null;
    }
    const files = await fg(postsPattern, { cwd, absolute: true });

    await fs.mkdir(ogOutDir, { recursive: true });

    let generated = 0;
    let skipped = 0;
    let failed = 0;
    const now = new Date();

    for (const file of files) {
      const base = path.basename(file);
      if (base.startsWith("_")) {
        skipped++;
        continue;
      }

      try {
        const raw = await fs.readFile(file, "utf8");
        const parsed = matter(raw);
        
        // Skip draft posts
        if (parsed.data.draft) {
          skipped++;
          continue;
        }

        // Skip posts with future publishDate
        if (parsed.data.publishDate && new Date(parsed.data.publishDate) > now) {
          skipped++;
          continue;
        }

        const slug = toSlug(file);
        await generateOne({
          title: parsed.data.title,
          slug,
          fontData,
          logoDataUri
        });
        generated++;
      } catch (error) {
        console.warn(`⚠️  Failed to generate OG for ${file}: ${error.message}`);
        failed++;
      }
    }

    console.log(`✅ Generated ${generated} OG images (${skipped} skipped${failed > 0 ? `, ${failed} failed` : ''})`);
  } catch (error) {
    console.error(`❌ Build error:`, error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
