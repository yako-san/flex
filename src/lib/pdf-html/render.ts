import chromium from '@sparticuz/chromium-min';
import puppeteer, { type Browser } from 'puppeteer-core';

// Pack Chromium hébergé sur GitHub releases (chargé une fois par cold start
// depuis /tmp). Versionné avec @sparticuz/chromium-min — bumper ensemble.
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar';

let browserPromise: Promise<Browser> | null = null;

async function launchBrowser(): Promise<Browser> {
  // Local dev (macOS/Linux) : tente le Chrome système si existant, sinon télécharge.
  // Vercel : utilise le pack Sparticuz/chromium.
  const isVercel = process.env['VERCEL'] === '1' || process.env['NEXT_RUNTIME'] === 'nodejs-prod';
  const executablePath = isVercel
    ? await chromium.executablePath(CHROMIUM_PACK_URL)
    : process.env['PUPPETEER_EXECUTABLE_PATH'] ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  return puppeteer.launch({
    args: isVercel
      ? chromium.args
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    executablePath,
    headless: true,
    defaultViewport: { width: 816, height: 1056, deviceScaleFactor: 2 }, // Letter @ 96 dpi
  });
}

// Rend un HTML en PDF (Letter format). Réutilise une instance de browser
// par lambda invocation (cold start).
export async function htmlToPdf(html: string): Promise<Buffer> {
  if (!browserPromise) browserPromise = launchBrowser();
  const browser = await browserPromise;

  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15_000 });
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
