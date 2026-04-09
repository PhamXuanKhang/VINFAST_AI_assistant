import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';

const logPath = '/home/z/my-project/dev.log';
const logStream = openSync(logPath, 'w');

const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  stdio: ['ignore', logStream, logStream],
  detached: true,
  shell: false,
});

child.unref();
console.log(`Started Next.js dev server PID: ${child.pid}`);
