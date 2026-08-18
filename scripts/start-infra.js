const { spawnSync, execSync, spawn } = require('child_process');
const path = require('path');
const {
  COLORS,
  logInfo,
  logSuccess,
  logWarn,
  logError,
  logStep,
  isPortOpen,
  checkHttp,
  waitFor,
  INFRA_SERVICES,
} = require('./common');

async function isDockerRunning() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

async function ensureDockerDaemon() {
  logInfo('Checking Docker daemon status...');
  let running = await isDockerRunning();

  if (running) {
    logSuccess('Docker daemon is active.');
    return true;
  }

  logWarn('Docker daemon is NOT running. Attempting to start Docker Desktop...');

  if (process.platform === 'win32') {
    const dockerPaths = [
      'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
      'C:\\Program Files (x86)\\Docker\\Docker\\Docker Desktop.exe',
    ];

    let started = false;
    for (const p of dockerPaths) {
      if (require('fs').existsSync(p)) {
        spawn(p, [], { detached: true, stdio: 'ignore' }).unref();
        started = true;
        break;
      }
    }

    if (!started) {
      logWarn('Docker Desktop executable not found in standard paths.');
    }
  }

  logInfo('Waiting for Docker daemon to become responsive...');
  const dockerReady = await waitFor('Docker Engine', isDockerRunning, 15, 2000);

  if (!dockerReady) {
    logError('Docker daemon failed to start within timeout. Please start Docker Desktop manually.');
    return false;
  }

  logSuccess('Docker daemon is ready.');
  return true;
}

async function startInfra() {
  logStep(1, 6, 'Starting MediSphere Infrastructure Containers (MongoDB, Kafka, Keycloak)');

  const dockerOk = await ensureDockerDaemon();
  if (!dockerOk) {
    process.exit(1);
  }

  const rootDir = path.join(__dirname, '..');
  logInfo('Executing: docker compose up -d (streaming output)');

  const res = spawnSync('docker', ['compose', 'up', '-d'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (res.status !== 0) {
    logError('Failed to execute docker compose up -d');
    process.exit(1);
  }

  logInfo('Verifying infrastructure readiness...');
  for (const s of INFRA_SERVICES) {
    const checkFn = async () => {
      if (s.health) {
        const httpOk = await checkHttp(s.health);
        if (httpOk) return true;
      }
      return await isPortOpen(s.port);
    };

    // 15 attempts, 1.5s interval = ~22s max timeout per infra service
    const ready = await waitFor(`${s.name} (Port ${s.port})`, checkFn, 15, 1500);
    if (!ready) {
      logWarn(`${s.name} on port ${s.port} did not become fully ready within timeout, but continuing...`);
    }
  }

  logSuccess('MediSphere Infrastructure phase complete!\n');
}

if (require.main === module) {
  startInfra();
}

module.exports = { startInfra };
