import fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import sharp from 'sharp';
import archiver from 'archiver';
import pngToIco from 'png-to-ico';

const repoRoot = process.cwd();
const BRANDKIT_DIR = path.join(repoRoot, 'brandkit');
const folders = [
  '01_Logos',
  '02_App_Icons',
  '03_Favicons',
  '04_OpenGraph',
  '05_Typography',
  '06_Color_System',
  '07_Social_Assets',
  '08_Web_Ready'
];

const sourceIconDirs = [
  path.join(repoRoot, 'public', 'icons'),
];

const pngSizes = [1024, 512, 192, 180, 32, 16];

async function ensureFolders() {
  await fs.mkdir(BRANDKIT_DIR, { recursive: true });
  for (const f of folders) {
    await fs.mkdir(path.join(BRANDKIT_DIR, f), { recursive: true });
  }
}

async function copySVGs() {
  const logosDir = path.join(BRANDKIT_DIR, '01_Logos');
  let found = 0;
  for (const d of sourceIconDirs) {
    try {
      if (!existsSync(d)) continue;
      const files = await fs.readdir(d);
      for (const f of files) {
        if (f.toLowerCase().endsWith('.svg')) {
          const src = path.join(d, f);
          const dest = path.join(logosDir, f);
          await fs.copyFile(src, dest);
          console.log(`Copied: ${src} -> ${dest}`);
          found++;
        }
      }
    } catch (err) {
      console.warn(`Failed reading ${d}: ${err.message}`);
    }
  }
  if (found === 0) console.warn('No SVG logo files were found in expected locations.');
}

async function generatePNGs() {
  const logosDir = path.join(BRANDKIT_DIR, '01_Logos');
  const webReadyDir = path.join(BRANDKIT_DIR, '08_Web_Ready');
  const files = await fs.readdir(logosDir).catch(() => []);
  let generated = 0;
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.svg')) continue;
    const basename = path.parse(file).name;
    const svgPath = path.join(logosDir, file);
    for (const size of pngSizes) {
      const outName = `${basename}-${size}.png`;
      const outPath = path.join(webReadyDir, outName);
      try {
        await sharp(svgPath)
          .resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ quality: 90 })
          .toFile(outPath);
        generated++;
      } catch (err) {
        console.warn(`Failed to generate ${outPath}: ${err.message}`);
      }
    }
  }
  console.log(`Generated ${generated} PNG files into ${webReadyDir}`);
}

async function generateFavicons() {
  const webReadyDir = path.join(BRANDKIT_DIR, '08_Web_Ready');
  const favDir = path.join(BRANDKIT_DIR, '03_Favicons');
  const files = await fs.readdir(webReadyDir).catch(() => []);
  // try find 32 and 16 pngs from generated files
  const png32 = files.find(f => f.endsWith('-32.png'));
  const png16 = files.find(f => f.endsWith('-16.png'));
  if (!png32 || !png16) {
    console.warn('Missing generated 32px or 16px PNGs for favicon creation.');
    return;
  }
  const buf32 = await fs.readFile(path.join(webReadyDir, png32));
  const buf16 = await fs.readFile(path.join(webReadyDir, png16));
  try {
    const icoBuffer = await pngToIco([buf16, buf32]);
    const icoPath = path.join(favDir, 'favicon.ico');
    await fs.writeFile(icoPath, icoBuffer);
    console.log(`Created favicon: ${icoPath}`);
  } catch (err) {
    console.warn(`Failed to create favicon.ico: ${err.message}`);
  }
}

async function createSiteManifest() {
  const manifest = {
    name: 'Insights by ChampionsPrep',
    short_name: 'ChampionsPrep',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c4dff',
    icons: [
      { src: './08_Web_Ready/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: './08_Web_Ready/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
  const siteManifestPath = path.join(BRANDKIT_DIR, 'site.webmanifest');
  await fs.writeFile(siteManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Wrote ${siteManifestPath}`);
}

async function createBrandGuidelines() {
  const md = `# BRAND GUIDELINES\n\n## Logo Usage\n- Use the provided SVG logo files for all print and vector use.\n- Use the PNG exports for raster contexts; prefer the highest resolution available.\n- Do not alter the logo proportions.\n- Do not change logo colors except where a monochrome white or black variant is explicitly provided.\n\n## Clear Space\n- Maintain a minimum clear space equal to the height of the logo's uppercase letter around the logo.\n- Do not place other elements within this clear space.\n\n## Color Tokens\n- --color-primary: #7c4dff (Lavender Accent)\n- --color-text: #1f2937\n- --color-bg: #ffffff\n- Provide tints and shades as needed.\n\n## Typography\n- Heading: "Source Serif 4" or fallback serif, sizes: H1 48px, H2 36px, H3 24px\n- Body: "Inter" or fallback system sans-serif, sizes: 16px (base), 20px (lead)\n\n## File Formats Provided\n- SVG: Vector logos (use for print, scaling)\n- PNG: Raster exports at multiple sizes (web/app icons)\n- ICO: favicon multi-resolution file\n- site.webmanifest: Web manifest for PWA usage\n\n## Contact\nFor brand questions, contact the design team.
`;
  const guidelinesPath = path.join(BRANDKIT_DIR, 'BRAND_GUIDELINES.md');
  await fs.writeFile(guidelinesPath, md, 'utf-8');
  console.log(`Wrote ${guidelinesPath}`);
}

async function zipBrandkit() {
  const zipName = 'Insights-by-ChampionsPrep-BrandKit-v1.0.zip';
  const zipPath = path.join(repoRoot, zipName);
  const output = (await import('fs')).createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`Created ZIP: ${zipPath} (${archive.pointer()} bytes)`);
      resolve(zipPath);
    });
    archive.on('error', err => reject(err));
    archive.pipe(output);
    archive.directory(BRANDKIT_DIR, 'brandkit');
    archive.finalize();
  });
}

async function run() {
  console.log('Starting brandkit generation...');
  await ensureFolders();
  await copySVGs();
  await generatePNGs();
  await generateFavicons();
  await createSiteManifest();
  await createBrandGuidelines();
  await zipBrandkit();
  console.log('Brandkit generation complete.');
}

run().catch(err => {
  console.error('Brandkit generation failed:', err);
  process.exit(1);
});
