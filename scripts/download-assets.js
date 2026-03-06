#!/usr/bin/env node
/**
 * Download WoW class and spec icons from the Blizzard Game Data API.
 *
 * Prerequisites:
 *   1. Create a Battle.net developer account at https://develop.battle.net
 *   2. Create a client application to get a client_id and client_secret
 *   3. Copy .env.example to .env and fill in your credentials
 *
 * Usage:
 *   node scripts/download-assets.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found. Copy .env.example and fill in your credentials.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    process.env[key.trim()] = rest.join('=').trim();
  }
}

loadEnv();

const CLIENT_ID = process.env.BNET_CLIENT_ID;
const CLIENT_SECRET = process.env.BNET_CLIENT_SECRET;
const REGION = (process.env.BNET_REGION || 'eu').toLowerCase();

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: BNET_CLIENT_ID and BNET_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const TOKEN_URL = `https://${REGION}.battle.net/oauth/token`;
const API_BASE = `https://${REGION}.api.blizzard.com`;
const NAMESPACE = `static-${REGION}`;
const LOCALE = 'en_US';

const CLASSES_DIR = path.join(__dirname, '..', 'public', 'icons', 'classes');
const SPECS_DIR = path.join(__dirname, '..', 'public', 'icons', 'specs');

fs.mkdirSync(CLASSES_DIR, { recursive: true });
fs.mkdirSync(SPECS_DIR, { recursive: true });

// Ambiguous spec names that need class prefix
const AMBIGUOUS_SPECS = new Set(['frost', 'protection', 'holy', 'restoration']);

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function specSlug(specName, className) {
  const spec = slugify(specName);
  const cls = slugify(className);
  if (AMBIGUOUS_SPECS.has(spec)) return `${spec}-${cls}`;
  return spec;
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, options).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const body = 'grant_type=client_credentials';
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = JSON.parse(res.body.toString());
  if (!data.access_token) {
    console.error('Failed to get access token:', data);
    process.exit(1);
  }
  return data.access_token;
}

async function apiGet(token, path) {
  const url = `${API_BASE}${path}?namespace=${NAMESPACE}&locale=${LOCALE}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) {
    throw new Error(`API error ${res.status} for ${url}\nResponse: ${res.body.toString().slice(0, 300)}`);
  }
  return JSON.parse(res.body.toString());
}

async function downloadFile(url, destPath, extraHeaders = {}) {
  if (fs.existsSync(destPath)) {
    console.log(`  → Already exists, skipping: ${path.basename(destPath)}`);
    return;
  }
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      ...extraHeaders,
    },
  });
  if (res.status !== 200) throw new Error(`Download failed ${res.status} for ${url}`);
  fs.writeFileSync(destPath, res.body);
  console.log(`  ✓ Downloaded: ${path.basename(destPath)}`);
}

async function main() {
  console.log(`Authenticating with Battle.net (region: ${REGION})...`);
  const token = await getToken();
  console.log('Token obtained.\n');

  // --- Classes ---
  console.log('Fetching class list...');
  const classIndex = await apiGet(token, '/data/wow/playable-class/index');

  for (const cls of classIndex.classes) {
    console.log(`Processing class: ${cls.name}`);
    try {
      const media = await apiGet(token, `/data/wow/media/playable-class/${cls.id}`);
      const iconAsset = media.assets?.find((a) => a.key === 'icon');
      if (!iconAsset) { console.log(`  ! No icon for ${cls.name}`); continue; }

      const slug = slugify(cls.name);
      const ext = path.extname(new URL(iconAsset.value).pathname) || '.jpg';
      await downloadFile(iconAsset.value, path.join(CLASSES_DIR, `${slug}${ext}`));
    } catch (e) {
      console.error(`  ! Error for class ${cls.name}: ${e.message}`);
    }
  }

  // --- Specs ---
  console.log('\nFetching spec list...');
  const specIndex = await apiGet(token, '/data/wow/playable-specialization/index');

  for (const spec of specIndex.character_specializations) {
    console.log(`Processing spec: ${spec.name}`);
    try {
      const specDetail = await apiGet(token, `/data/wow/playable-specialization/${spec.id}`);
      const className = specDetail.playable_class?.name ?? 'Unknown';
      const media = await apiGet(token, `/data/wow/media/playable-specialization/${spec.id}`);
      const iconAsset = media.assets?.find((a) => a.key === 'icon');
      if (!iconAsset) { console.log(`  ! No icon for ${spec.name}`); continue; }

      const slug = specSlug(spec.name, className);
      const ext = path.extname(new URL(iconAsset.value).pathname) || '.jpg';
      await downloadFile(iconAsset.value, path.join(SPECS_DIR, `${slug}${ext}`));
    } catch (e) {
      console.error(`  ! Error for spec ${spec.name}: ${e.message}`);
    }
  }

  console.log('\nDone! All icons downloaded to public/icons/');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
