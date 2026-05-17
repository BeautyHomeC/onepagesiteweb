import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontDir = '/tmp/livret-fonts';

const fontsCss = fs.readFileSync(path.join(fontDir, 'fonts.css'), 'utf8');

const embeddedFontsCss = fontsCss.replace(/url\((https:\/\/[^)]+\.ttf)\)/g, (match, url) => {
  const fname = crypto.createHash('md5').update(url).digest('hex') + '.ttf';
  const fpath = path.join(fontDir, fname);
  if (fs.existsSync(fpath)) {
    const b64 = fs.readFileSync(fpath).toString('base64');
    return `url(data:font/truetype;base64,${b64})`;
  }
  return match;
});

const htmlPath = path.resolve(__dirname, '../public/livret-accueil.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace Google Fonts link with self-contained embedded fonts
html = html.replace(
  /<link [^>]*googleapis[^>]*rel="stylesheet"[^>]*>/,
  `<style>${embeddedFontsCss}</style>`
);
// Also remove preconnect links
html = html.replace(/<link [^>]*googleapis[^>]*>/g, '');
html = html.replace(/<link [^>]*gstatic[^>]*>/g, '');

const tmpHtml = path.resolve(__dirname, '../public/_livret-tmp.html');
fs.writeFileSync(tmpHtml, html);

const pdfPath = path.resolve(__dirname, '../public/livret-accueil.pdf');

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

await browser.close();
fs.unlinkSync(tmpHtml);
console.log('PDF généré :', pdfPath);
console.log('Taille :', Math.round(fs.statSync(pdfPath).size / 1024), 'Ko');
