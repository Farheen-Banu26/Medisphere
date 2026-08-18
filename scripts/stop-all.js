const { execSync } = require('child_process');
const path = require('path');
const {
  COLORS,
  logInfo,
  logSuccess,
  logWarn,
  logError,
  getSavedPids,
  clearPids,
  SERVICES,
  isPortOpen,
} = require('./common');

const rootDir = path.join(__dirname, '..');

async function stopAll() {
  console.log(`${COLORS.bright}${COLORS.yellow}====================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.yellow}       Stopping MediSphere Local Services           ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.yellow}====================================================${COLORS.reset}\n`);

  const savedPids = getSavedPids();

  if (savedPids.length > 0) {
    logInfo(`Found ${savedPids.length} tracked MediSphere process(es). Stopping...`);

    for (const p of savedPids) {
      try {
        logInfo(`Stopping ${p.serviceName} (PID: ${p.pid}, Port: ${p.port})...`);
        if (process.platform === 'win32') {
          execSync(`taskkill /F /T /PID ${p.pid}`, { stdio: 'ignore' });
        } else {
          process.kill(-p.pid, 'SIGTERM');
        }
      } catch (err) {
        // Process might already have exited
      }
    }
    clearPids();
    logSuccess('Stopped tracked processes.');
  } else {
    logInfo('No tracked PID file found. Checking listening ports for MediSphere services...');
  }

  // Double check any remaining open ports for MediSphere microservices
  logInfo('Checking ports to clean up any remaining MediSphere processes...');

  // Include Vite frontend ports in the cleanup scan
  const allPorts = [
    ...SERVICES.map((s) => ({ port: s.port, name: s.name })),
    { port: 5173, name: 'medisphere-frontend' },
    { port: 5174, name: 'medisphere-frontend (fallback)' },
    { port: 5175, name: 'medisphere-frontend (fallback)' },
  ];

  for (const s of allPorts) {
    const open = await isPortOpen(s.port);
    if (open) {
      logWarn(`Port ${s.port} (${s.name}) is still listening.`);
      if (process.platform === 'win32') {
        try {
          const out = execSync(`netstat -ano | findstr :${s.port}`, { encoding: 'utf8' });
          const lines = out.trim().split('\n');
          const killed = new Set();
          for (const line of lines) {
            if (!line.includes('LISTENING')) continue;
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && !killed.has(pid)) {
              killed.add(pid);
              logInfo(`Killing process tree on port ${s.port} (PID: ${pid})...`);
              execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
            }
          }
        } catch (e) {
          // Ignore netstat errors
        }
      }
    }
  }

  const stopInfra = process.argv.includes('--stop-infra');
  if (stopInfra) {
    logInfo('Stopping Docker infrastructure containers...');
    try {
      execSync('docker compose down', { cwd: rootDir, stdio: 'inherit' });
      logSuccess('Docker infrastructure stopped.');
    } catch (e) {
      logError('Failed to stop Docker infrastructure containers.');
    }
  } else {
    logInfo('Docker infrastructure remains running (use npm run infra:stop to stop containers).');
  }

  console.log(`\n${COLORS.bright}${COLORS.green}✔ MediSphere services stopped cleanly.${COLORS.reset}\n`);
}

if (require.main === module) {
  stopAll();
}

module.exports = { stopAll };
