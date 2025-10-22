#!/usr/bin/env node
/**
 * Kill process listening on a given port (macOS/Linux).
 */

const { execSync } = require('child_process');

const portArg = process.argv[2];

if (!portArg) {
  console.error('Usage: node scripts/kill-port.js <port>');
  process.exit(1);
}

const port = Number(portArg);

if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid port: ${portArg}`);
  process.exit(1);
}

try {
  const command = process.platform === 'darwin' || process.platform === 'linux'
    ? `lsof -ti tcp:${port}`
    : null;

  if (!command) {
    console.error('kill-port script currently supports macOS and Linux only.');
    process.exit(1);
  }

  const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();

  if (!output) {
    console.log(`No process found on port ${port}.`);
    process.exit(0);
  }

  const pids = output.split('\n').filter(Boolean);
  pids.forEach((pid) => {
    execSync(`kill -9 ${pid}`);
    console.log(`Killed process ${pid} on port ${port}.`);
  });

  console.log(`Port ${port} is now free.`);
} catch (error) {
  if (error.status === 1) {
    console.log(`No process found on port ${port}.`);
    process.exit(0);
  }

  console.error(`Failed to free port ${port}: ${error.message}`);
  process.exit(1);
}
