const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env');
const envTestPath = path.join(projectRoot, '.env.test');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return acc;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    acc[key] = value;
    return acc;
  }, {});
}

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.error('Usage: node scripts/with-test-env.js <command> [...args]');
  process.exit(1);
}

const env = {
  ...process.env,
  ...parseEnvFile(envPath),
  ...parseEnvFile(envTestPath),
  NODE_ENV: 'test',
};

if (env.TEST_DATABASE_URL) {
  env.DATABASE_URL = env.TEST_DATABASE_URL;
  env.DIRECT_URL = env.TEST_DATABASE_URL;
}

if (!fs.existsSync(envTestPath) && !env.TEST_DATABASE_URL) {
  console.error(
    'Test database not configured. Create uau-core-backend/.env.test or set TEST_DATABASE_URL.',
  );
  process.exit(1);
}

env.DIRECT_URL = env.DIRECT_URL || env.DATABASE_URL;

const result = spawnSync(command, args, {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
