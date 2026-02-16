import fs from 'fs';

function parseVars(css, selector) {
  const re = new RegExp(selector + "\\s*\\{([\\s\\S]*?)\\}", 'm');
  const m = css.match(re);
  if (!m) return {};
  const body = m[1];
  const vars = {};
  body.split(/;\s*\n/).forEach(line => {
    const l = line.trim();
    if (!l) return;
    const mm = l.match(/--([a-zA-Z0-9-]+)\s*:\s*(.+)$/);
    if (mm) vars[mm[1]] = mm[2].trim().replace(/;$/, '');
  });
  return vars;
}

function hexToRgb(hex) {
  if (!hex) return null;
  hex = hex.trim();
  // handle color-mix() etc - return null
  if (!hex.startsWith('#')) return null;
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    hex = '#' + r + r + g + g + b + b;
  }
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function srgbToLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(rgb) {
  const [r,g,b] = rgb;
  return 0.2126 * srgbToLin(r) + 0.7152 * srgbToLin(g) + 0.0722 * srgbToLin(b);
}

function contrastRatio(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const L1 = Math.max(l1, l2);
  const L2 = Math.min(l1, l2);
  return (L1 + 0.05) / (L2 + 0.05);
}

function pick(vars, name) {
  if (!vars[name]) return null;
  let v = vars[name];
  // remove surrounding quotes
  v = v.replace(/^"|"$/g, '').trim();
  return v;
}

const css = fs.readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const root = parseVars(css, ':root');
const dark = parseVars(css, 'html.dark');

function resolve(varName, modeVars) {
  let v = pick(modeVars, varName) || pick(root, varName);
  if (!v) return null;
  // handle aliases like var(--color-purple-deep)
  const varRef = v.match(/var\(--([a-z0-9-]+)\)/i);
  if (varRef) return resolve(varRef[1], modeVars);
  // strip color-mix(...) or other functions
  if (v.includes('color-mix') || v.includes('transparent')) return null;
  // trim and return
  return v.split(/\s+/)[0];
}

const checks = [
  {name: 'body text on bg', fg: 'color-text-primary', bg: 'color-bg'},
  {name: 'heading on bg', fg: 'color-text-heading', bg: 'color-bg'},
  {name: 'secondary on bg', fg: 'color-text-secondary', bg: 'color-bg'},
  {name: 'link on bg', fg: 'color-link', bg: 'color-bg'},
  {name: 'cta text on cta bg', fg: 'color-cta-text', bg: 'color-cta-bg'},
  {name: 'exam-tip bg vs text', fg: 'color-text-primary', bg: 'color-lavender-soft'},
  {name: 'exam-tip heading vs bg', fg: 'color-text-heading', bg: 'color-lavender-soft'},
  {name: 'border on bg', fg: 'color-border', bg: 'color-bg'},
];

function runMode(modeName, modeVars) {
  console.log('\n---- ' + modeName + ' ----');
  console.log('Variable snapshot (selected):');
  ['color-text-primary','color-text-heading','color-text-secondary','color-bg','color-link','color-cta-bg','color-cta-text','color-lavender-soft','color-border'].forEach(k=>{
    console.log('  --' + k + ':', resolve(k, modeVars));
  });

  checks.forEach(ch => {
    const fgRaw = resolve(ch.fg, modeVars);
    const bgRaw = resolve(ch.bg, modeVars);
    const fg = hexToRgb(fgRaw);
    const bg = hexToRgb(bgRaw);
    let note = '';
    if (!fg) note += ' (fg unresolved)';
    if (!bg) note += ' (bg unresolved)';
    if (fg && bg) {
      const cr = contrastRatio(fg,bg);
      const passAA = cr >= 4.5;
      const passLarge = cr >= 3.0;
      const passAAA = cr >= 7.0;
      console.log(`- ${ch.name}: ${cr.toFixed(2)}  AA:${passAA? 'PASS':'FAIL'}  Large:${passLarge? 'PASS':'FAIL'}  AAA:${passAAA? 'PASS':'FAIL'}`);
    } else {
      console.log(`- ${ch.name}: unable to compute${note}`);
    }
  });
}

runMode('Light mode', root);
runMode('Dark mode', dark);

console.log('\nNotes:');
console.log('- AA (normal text) requires contrast >= 4.5');
console.log('- AA (large text) requires contrast >= 3.0');
console.log('- AAA requires contrast >= 7.0');

// Suggest improvements for border and dark-mode link
function toHex([r,g,b]){
  return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function findGrayscaleForContrast(bgHex, targetContrast, preferDarker){
  const bg = hexToRgb(bgHex);
  if (!bg) return null;
  if (preferDarker) {
    for (let v=255; v>=0; v--) {
      const rgb = [v,v,v];
      const cr = contrastRatio(rgb, bg);
      if (cr >= targetContrast) return toHex(rgb);
    }
  } else {
    for (let v=0; v<=255; v++){
      const rgb = [v,v,v];
      const cr = contrastRatio(rgb, bg);
      if (cr >= targetContrast) return toHex(rgb);
    }
  }
  return null;
}

function blendToWhite(hex, t){
  const c = hexToRgb(hex);
  if (!c) return null;
  const blended = c.map(v => Math.round(v + (255 - v) * t));
  return blended;
}

function findBlendForContrast(fgHex, bgHex, targetContrast){
  for (let i=0;i<=100;i++){
    const t = i/100;
    const rgb = blendToWhite(fgHex, t);
    if (!rgb) continue;
    const cr = contrastRatio(rgb, hexToRgb(bgHex));
    if (cr >= targetContrast) return toHex(rgb);
  }
  return null;
}

const lightBg = resolve('color-bg', root);
const darkBg = resolve('color-bg', dark);
const lightBorderSuggest = findGrayscaleForContrast(lightBg, 3.0, true);
const darkBorderSuggest = findGrayscaleForContrast(darkBg, 3.0, false);
const darkLinkSuggest = findBlendForContrast(resolve('color-link', dark), darkBg, 4.5);

console.log('\nSuggested token adjustments to meet Non-text contrast (>=3:1) and link AA:');
console.log('- Light mode: --color-border ->', lightBorderSuggest || 'no suggestion');
console.log('- Dark mode:  --color-border ->', darkBorderSuggest || 'no suggestion');
console.log('- Dark mode:  --color-link  ->', darkLinkSuggest || 'no suggestion (try lighter/paler purple)');
