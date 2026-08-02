import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = './temporary screenshots';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 960 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 300));

const fs = await import('node:fs');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
let n = 1;
while (fs.existsSync(`${dir}/screenshot-${n}${label ? '-' + label : ''}.png`)) n += 1;
const path = `${dir}/screenshot-${n}${label ? '-' + label : ''}.png`;
await page.screenshot({ path, fullPage: true });
console.log(path);

await browser.close();
