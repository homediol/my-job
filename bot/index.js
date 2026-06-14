#!/usr/bin/env node

/**
 * Aviator Bot — Main Runner (Node.js / Playwright).
 *
 * Reads credentials from data/bot/config.json and orchestrates:
 *   1. Launch persistent Chromium (uses existing Chrome profile or bot profile)
 *   2. Login to winner.rw (skips if session cookies already valid)
 *   3. Navigate to Aviator crash game
 *   4. Monitor rounds until shutdown signal
 *
 * Usage:
 *   node index.js
 *
 * Environment variables (override config.json):
 *   WINNER_PHONE, WINNER_PASSWORD, BOT_HEADLESS (true/false)
 *   BOT_CHROME_USER_DATA (path to Chrome profile)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { launchBrowser, closeBrowser, getPage } from './browser.js';
import { authenticateAndEnterGame, monitorRounds } from './scraper.js';
import { createLogger } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'data', 'bot', 'config.json');
const STATUS_PATH = path.join(ROOT, 'data', 'bot', 'status.json');

const log = createLogger('main');

// ═════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════

function readJSON(filepath, defaultVal = null) {
  try {
    if (!fs.existsSync(filepath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return defaultVal;
  }
}

function writeJSON(filepath, data) {
  const dir = path.dirname(filepath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = filepath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filepath);
}

function loadCredentials() {
  const config = readJSON(CONFIG_PATH, {});
  return {
    phone:     process.env.WINNER_PHONE     || config.phone     || '',
    password:  process.env.WINNER_PASSWORD  || config.password  || '',
    headless:  (process.env.BOT_HEADLESS || String(config.headless || 'false')).toLowerCase() === 'true',
  };
}

function writeStatus(payload) {
  writeJSON(STATUS_PATH, payload);
}

// ═════════════════════════════════════════════════════════════════════
// Signal handling (graceful shutdown)
// ═════════════════════════════════════════════════════════════════════

let _shuttingDown = false;
const abortController = new AbortController();

async function shutdown() {
  if (_shuttingDown) return;
  _shuttingDown = true;
  abortController.abort();

  log.info('Shutting down bot...');
  writeStatus({ ...readJSON(STATUS_PATH, {}), status: 'stopped', updated_at: new Date().toISOString() });
  await closeBrowser();
  log.info('Bot terminated.');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (err) => {
  log.error(`Uncaught exception: ${err.message}`);
  writeStatus({ ...readJSON(STATUS_PATH, {}), status: 'error', error: err.message, updated_at: new Date().toISOString() });
  shutdown();
});
process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled rejection: ${reason}`);
});

// ═════════════════════════════════════════════════════════════════════
// Main
// ═════════════════════════════════════════════════════════════════════

async function main() {
  const { phone, password, headless } = loadCredentials();

  if (!phone || !password) {
    log.error('Phone and password are required. Set via config.json or WINNER_PHONE/WINNER_PASSWORD env vars.');
    writeStatus({ status: 'error', error: 'Missing credentials', updated_at: new Date().toISOString() });
    process.exit(1);
  }

  log.info(`Starting bot for phone ${phone.slice(-4).padStart(phone.length, '*')} (headless=${headless})`);

  writeStatus({
    status: 'starting',
    phone,
    headless,
    pid: process.pid,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rounds_seen: 0,
    last_round: null,
    error: null,
  });

  try {
    // Step 1 — Launch browser (persistent context)
    await launchBrowser({ headless });
    writeStatus({ ...readJSON(STATUS_PATH, {}), status: 'running', updated_at: new Date().toISOString() });

    // Step 2 — Get active page
    const page = await getPage();

    // Step 3 — Login + navigate to Aviator
    log.info('Authenticating and entering game...');
    writeStatus({ ...readJSON(STATUS_PATH, {}), status: 'logging_in', updated_at: new Date().toISOString() });

    const ready = await authenticateAndEnterGame(page, phone, password);
    if (!ready) {
      log.error('Failed to authenticate or reach Aviator page');
      await shutdown();
      return;
    }

    // Step 4 — Monitor rounds until interrupted
    log.info('Entering monitoring loop...');
    writeStatus({ ...readJSON(STATUS_PATH, {}), status: 'monitoring', updated_at: new Date().toISOString() });

    await monitorRounds(page, {
      interval: 3000,
      signal: abortController.signal,
    });

  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    if (err.stack) log.error(err.stack);
    writeStatus({
      ...readJSON(STATUS_PATH, {}),
      status: 'error',
      error: err.message,
      updated_at: new Date().toISOString(),
    });
  } finally {
    await shutdown();
  }
}

main();

