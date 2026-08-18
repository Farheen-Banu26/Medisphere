/**
 * Restarts patient-service only.
 * Mirrors the exact launch method used by start-backend.js.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const rootDir = path.join(__dirname, '..');
const serviceDir = path.join(rootDir, 'patient-service');
const logsDir = path.join(rootDir, 'logs');
const PID_FILE = path.join(rootDir, '.medisphere-pids.json');

if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, 'patient-service.log');
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

const mvnwCmd = 'mvnw.cmd';
const args = ['spring-boot:run', '-DskipTests', '-Dmaven.test.skip=true'];

console.log('Starting patient-service...');
console.log('Log -> logs/patient-service.log');

const child = spawn(mvnwCmd, args, {
  cwd: serviceDir,
  shell: true,
  env: { ...process.env, MAVEN_OPTS: '-Xms64m -Xmx256m' },
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
});

child.stdout.pipe(logStream);
child.stderr.pipe(logStream);

child.on('error', (err) => {
  console.error('Launch error:', err.message);
});

// Save PID
let pids = [];
if (fs.existsSync(PID_FILE)) {
  try { pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf8')); } catch (_) { pids = []; }
}
// Remove old patient-service entry
pids = pids.filter(p => p.serviceName !== 'patient-service');
pids.push({ pid: child.pid, serviceName: 'patient-service', port: 8989, startTime: new Date().toISOString() });
fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2), 'utf8');

child.unref();

console.log(`Launched patient-service PID: ${child.pid}`);
console.log('Polling health endpoint...');

// Poll until up
let attempts = 0;
const maxAttempts = 40;
const pollInterval = 3000;

function checkHealth() {
  attempts++;
  const req = http.get('http://localhost:8989/actuator/health', (res) => {
    if (res.statusCode === 200) {
      console.log(`\n✅ patient-service is UP! (attempt ${attempts}, ~${attempts * 3}s)`);
      process.exit(0);
    } else {
      console.log(`Attempt ${attempts}: HTTP ${res.statusCode}`);
      if (attempts < maxAttempts) setTimeout(checkHealth, pollInterval);
      else { console.log('❌ Timeout — check logs/patient-service.log'); process.exit(1); }
    }
  });
  req.on('error', () => {
    if (attempts % 5 === 0) console.log(`Waiting... (${attempts * 3}s)`);
    if (attempts < maxAttempts) setTimeout(checkHealth, pollInterval);
    else { console.log('❌ Timeout — check logs/patient-service.log'); process.exit(1); }
  });
  req.end();
}

setTimeout(checkHealth, pollInterval);
