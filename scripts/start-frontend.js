const { execSync } = require('child_process');
const { spawn } = require('child_process');
const path = require('path');
const { COLORS, logInfo, logWarn, savePid, isPortOpen } = require('./common');

const frontendDir = path.join(__dirname, '..', 'medisphere-frontend');

function killPort(port) {
  // On Windows, find the PID listening on the port and kill its process tree.
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const killed = new Set();
    for (const line of out.trim().split('\n')) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && !killed.has(pid)) {
        killed.add(pid);
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
        logInfo(`Cleared stale process (PID ${pid}) from port ${port}.`);
      }
    }
  } catch (_) {
    // Port was already free or taskkill already handled it
  }
}

async function startFrontend() {
  console.log(`${COLORS.bright}${COLORS.cyan}Starting MediSphere Frontend (React/Vite)...${COLORS.reset}\n`);

  // If port 5173 is occupied (stale previous run), evict it so Vite binds
  // to its configured port and Keycloak redirect URIs stay valid.
  const occupied = await isPortOpen(5173);
  if (occupied) {
    logWarn('Port 5173 is in use — clearing stale process before starting Vite...');
    if (process.platform === 'win32') {
      killPort(5173);
    }
    // Brief pause so the OS reclaims the port
    await new Promise((r) => setTimeout(r, 800));
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    stdio: 'inherit',
  });

  if (child.pid) {
    savePid(child.pid, 'medisphere-frontend', 5173);
  }

  child.on('error', (err) => {
    console.error(`Failed to start frontend: ${err.message}`);
  });
}

if (require.main === module) {
  startFrontend();
}

module.exports = { startFrontend };
