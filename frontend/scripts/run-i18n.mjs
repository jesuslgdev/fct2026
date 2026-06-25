import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const checker = isWindows ? 'where' : 'which';
const check = spawnSync(checker, ['bundle'], { stdio: 'ignore', shell: false });

if (check.status !== 0) {
  console.warn('[i18n] bundle was not found in PATH. Skipping localize and using committed translations.');
  process.exit(0);
}

const result = spawnSync('bundle', ['exec', 'localize'], {
  stdio: 'inherit',
  shell: false
});

if (result.error) {
  console.error('[i18n] Failed to execute bundle exec localize:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
