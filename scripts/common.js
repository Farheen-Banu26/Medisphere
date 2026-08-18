const net = require('net');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(__dirname, '..', '.medisphere-pids.json');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function logInfo(msg) {
  console.log(`${COLORS.cyan}[INFO]${COLORS.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${COLORS.green}[SUCCESS]${COLORS.reset} ${msg}`);
}

function logWarn(msg) {
  console.log(`${COLORS.yellow}[WARN]${COLORS.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${COLORS.red}[ERROR]${COLORS.reset} ${msg}`);
}

function logStep(stepNum, totalSteps, msg) {
  console.log(`\n${COLORS.bright}${COLORS.blue}[${stepNum}/${totalSteps}]${COLORS.reset} ${COLORS.bright}${msg}${COLORS.reset}`);
}

function isPortOpen(port, host = null, timeout = 1200) {
  // If no explicit host is given, try both IPv4 and IPv6 loopback in parallel.
  // Return true if EITHER address is reachable (handles Vite on ::1, Flask on 127.0.0.1, etc.).
  // NOTE: Promise.any() cannot be used here because isPortOpen always resolves (never rejects),
  // so Promise.any would return the first to resolve which may be false.
  if (host === null) {
    return Promise.all([
      isPortOpen(port, '127.0.0.1', timeout),
      isPortOpen(port, '::1', timeout),
    ]).then(([v4, v6]) => v4 || v6);
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', () => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}

function checkHttp(urlStr, expectedStatus = [200, 301, 302, 401, 404]) {
  return new Promise((resolve) => {
    try {
      const url = new URL(urlStr);
      const client = url.protocol === 'https:' ? https : http;
      const req = client.get(urlStr, { timeout: 1500 }, (res) => {
        const isOk = expectedStatus.includes(res.statusCode);
        resolve(isOk);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

async function waitFor(name, checkFn, maxAttempts = 20, intervalMs = 1500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ready = await checkFn();
    if (ready) {
      logSuccess(`${name} is READY! (attempt ${attempt}/${maxAttempts})`);
      return true;
    }
    logInfo(`Waiting for ${name}... attempt ${attempt}/${maxAttempts}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  logWarn(`${name} failed to become ready after ${maxAttempts} attempts.`);
  return false;
}

async function waitForAll(services, maxTimeoutMs = 60000, intervalMs = 1500) {
  const startTime = Date.now();
  const pending = new Set(services.map((s) => s.name));
  const results = {};

  logInfo(`Polling readiness for ${services.length} domain services in parallel (max timeout: ${maxTimeoutMs / 1000}s)...`);

  while (pending.size > 0 && Date.now() - startTime < maxTimeoutMs) {
    const checkPromises = Array.from(pending).map(async (serviceName) => {
      const s = services.find((srv) => srv.name === serviceName);
      if (!s) return;

      const open = await isPortOpen(s.port);
      if (open) {
        logSuccess(`${s.name} (Port ${s.port}) is READY! (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
        results[s.name] = true;
        pending.delete(s.name);
      }
    });

    await Promise.all(checkPromises);

    if (pending.size > 0) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  for (const serviceName of pending) {
    const s = services.find((srv) => srv.name === serviceName);
    logWarn(`${s.name} (Port ${s.port}) not ready within ${(maxTimeoutMs / 1000).toFixed(0)}s — still starting in background. Run 'npm run status' shortly.`);
    results[s.name] = false;
  }

  return results;
}

function savePid(pid, serviceName, port) {
  let pids = [];
  if (fs.existsSync(PID_FILE)) {
    try {
      pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
    } catch (e) {
      pids = [];
    }
  }
  pids.push({ pid, serviceName, port, startTime: new Date().toISOString() });
  fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2), 'utf8');
}

function getSavedPids() {
  if (fs.existsSync(PID_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function clearPids() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

const SERVICES = [
  { name: 'eureka-server', dir: 'eureka-server', port: 8761, type: 'boot', health: 'http://localhost:8761/eureka/apps', core: true },
  { name: 'config-server', dir: 'config-server', port: 8888, type: 'boot', health: 'http://localhost:8888/patient-service/default', core: true },
  { name: 'flask-ai-service', dir: 'flask-ai-service', port: 5000, type: 'python', health: 'http://localhost:5000/health', core: true },
  { name: 'patient-service', dir: 'patient-service', port: 8989, type: 'boot', health: 'http://localhost:8989/actuator/health', core: true },
  { name: 'vitals-service', dir: 'vitals-service', port: 8992, type: 'boot', health: 'http://localhost:8992/actuator/health', core: true },
  { name: 'health-twin-service', dir: 'health-twin-service', port: 8990, type: 'boot', health: 'http://localhost:8990/actuator/health', core: true },
  { name: 'api-gateway', dir: 'api-gateway', port: 8080, type: 'boot', health: 'http://localhost:8080/actuator/health', core: true },
  { name: 'consent-service', dir: 'consent-service', port: 8991, type: 'boot', health: 'http://localhost:8991/actuator/health', core: false },
  { name: 'fhir-service', dir: 'fhir-service', port: 8993, type: 'boot', health: 'http://localhost:8993/actuator/health', core: false },
  { name: 'dashboard-service', dir: 'dashboard-service', port: 8997, type: 'boot', health: 'http://localhost:8997/actuator/health', core: false },
  { name: 'audit-service', dir: 'audit-service', port: 8994, type: 'boot', health: 'http://localhost:8994/actuator/health', core: false },
  { name: 'wearable-simulator', dir: 'wearable-simulator', port: 8995, type: 'boot', health: 'http://localhost:8995/actuator/health', core: false },
  { name: 'ai-prediction-service', dir: 'ai-prediction-service', port: 8985, type: 'boot', health: 'http://localhost:8985/actuator/health', core: false },
  { name: 'prediction-service', dir: 'prediction-service', port: 8986, type: 'boot', health: 'http://localhost:8986/actuator/health', core: false },
  { name: 'explainability-service', dir: 'explainability-service', port: 8998, type: 'boot', health: 'http://localhost:8998/actuator/health', core: false },
  { name: 'model-management-service', dir: 'model-management-service', port: 9001, type: 'boot', health: 'http://localhost:9001/actuator/health', core: false },
  { name: 'alert-service', dir: 'alert-service', port: 9002, type: 'boot', health: 'http://localhost:9002/actuator/health', core: false },
  { name: 'notification-service', dir: 'notification-service', port: 9003, type: 'boot', health: 'http://localhost:9003/actuator/health', core: false },
  { name: 'careplan-service', dir: 'careplan-service', port: 9004, type: 'boot', health: 'http://localhost:9004/actuator/health', core: false },
];

const INFRA_SERVICES = [
  { name: 'MongoDB', port: 27017, type: 'docker' },
  { name: 'Kafka', port: 9092, type: 'docker' },
  { name: 'Keycloak', port: 8081, type: 'docker', health: 'http://localhost:8081/realms/medisphere' },
];

module.exports = {
  COLORS,
  logInfo,
  logSuccess,
  logWarn,
  logError,
  logStep,
  isPortOpen,
  checkHttp,
  waitFor,
  waitForAll,
  savePid,
  getSavedPids,
  clearPids,
  SERVICES,
  INFRA_SERVICES,
};
