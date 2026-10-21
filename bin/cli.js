#!/usr/bin/env node

/**
 * Opuszenvix CLI - 1-Step Setup Tool
 * Usage: npx opuszenvix
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const GATEWAY_URL = 'https://api.opuszenvix.live/v1';

const BANNER = `
\x1b[38;2;234;88;12m   ___  ____  _   _ ____  _____ _   ___     _____  __ \x1b[0m
\x1b[38;2;234;88;12m  / _ \\|  _ \\| | | / ___||__  /| \\ | \\ \\   / /_ _| \\ \\/ / \x1b[0m
\x1b[38;2;234;88;12m | | | | |_) | | | \\___ \\  / / |  \\| |\\ \\ / / | |   \\  /  \x1b[0m
\x1b[38;2;234;88;12m | |_| |  __/| |_| |___) |/ /_ | |\\  | \\ V /  | |   /  \\  \x1b[0m
\x1b[38;2;234;88;12m  \\___/|_|    \\___/|____//____||_| \\_|  \\_/  |___| /_/\\_\\ \x1b[0m
\x1b[38;2;249;115;22m  Anthropic AI Proxy & Gateway • 1M Context • 5h Rolling Quota\x1b[0m
`;

console.log(BANNER);
console.log('\x1b[1m\x1b[32m✔ Gateway Endpoint:\x1b[0m ' + GATEWAY_URL + '\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  try {
    const rawKey = await ask('\x1b[1mEnter your Opuszenvix API Key\x1b[0m (opm-live-...): ');
    const apiKey = rawKey.trim();

    if (!apiKey) {
      console.log('\x1b[33m⚠ No key entered. Displaying default setup commands:\x1b[0m\n');
      printShellCommands('opm-live-your_key_here');
      rl.close();
      return;
    }

    console.log('\n\x1b[1mWhere would you like to configure Opuszenvix?\x1b[0m');
    console.log('  \x1b[36m1)\x1b[0m Claude Code CLI (~/.claude/settings.json)');
    console.log('  \x1b[36m2)\x1b[0m Cursor IDE');
    console.log('  \x1b[36m3)\x1b[0m Current Terminal Shell');
    console.log('  \x1b[36m4)\x1b[0m All of the above\n');

    const choice = (await ask('Select an option (1-4, default 4): ')).trim() || '4';

    if (choice === '1' || choice === '4') {
      setupClaudeCode(apiKey);
    }

    if (choice === '2' || choice === '4') {
      setupCursor(apiKey);
    }

    if (choice === '3' || choice === '4') {
      printShellCommands(apiKey);
    }

    console.log('\n\x1b[32m\x1b[1m✔ Setup complete!\x1b[0m Ready to code with unbuffered Claude 3.7 / Opus / Sonnet streaming.');
    console.log('\x1b[90mNeed help? Visit https://opuszenvix.live/docs or contact support.\x1b[0m\n');
  } catch (err) {
    console.error('\x1b[31mError during setup:\x1b[0m', err.message);
  } finally {
    rl.close();
  }
}

function setupClaudeCode(apiKey) {
  try {
    const claudeDir = path.join(os.homedir(), '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    const settingsPath = path.join(claudeDir, 'settings.json');
    let settings = {};

    if (fs.existsSync(settingsPath)) {
      try {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        settings = JSON.parse(raw);
      } catch {
        settings = {};
      }
    }

    settings.env = settings.env || {};
    settings.env.ANTHROPIC_AUTH_TOKEN = apiKey;
    settings.env.ANTHROPIC_BASE_URL = GATEWAY_URL;
    settings.env.ANTHROPIC_MODEL = settings.env.ANTHROPIC_MODEL || 'claude-opus-4-8';
    settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL = settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'claude-sonnet-4-6';
    settings.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
    settings.hasCompletedOnboarding = true;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('\x1b[32m✔ Updated Claude Code config:\x1b[0m ' + settingsPath);
  } catch (e) {
    console.log('\x1b[33m⚠ Could not automatically write ~/.claude/settings.json:\x1b[0m ' + e.message);
  }
}

function setupCursor(apiKey) {
  console.log('\n\x1b[1m\x1b[36m[Cursor IDE Instructions]\x1b[0m');
  console.log('1. Open Cursor Settings (\x1b[1mCtrl+,\x1b[0m or \x1b[1mCmd+,\x1b[0m)');
  console.log('2. Navigate to \x1b[1mModels > OpenAI / Anthropic API Key\x1b[0m');
  console.log('3. Set Override Base URL: \x1b[32m' + GATEWAY_URL + '\x1b[0m');
  console.log('4. Set API Key: \x1b[32m' + apiKey + '\x1b[0m');
}

function printShellCommands(apiKey) {
  const isWindows = process.platform === 'win32';
  console.log('\n\x1b[1m\x1b[36m[Terminal Environment Variables]\x1b[0m');

  console.log('\x1b[90m# Bash / Zsh / Linux / macOS:\x1b[0m');
  console.log(`export ANTHROPIC_BASE_URL="${GATEWAY_URL}"`);
  console.log(`export ANTHROPIC_API_KEY="${apiKey}"\n`);

  if (isWindows) {
    console.log('\x1b[90m# Windows PowerShell:\x1b[0m');
    console.log(`$env:ANTHROPIC_BASE_URL="${GATEWAY_URL}"`);
    console.log(`$env:ANTHROPIC_API_KEY="${apiKey}"\n`);
  }
}

main();
