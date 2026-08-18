const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { startInfra } = require('./start-infra');
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
  waitForAll,
  savePid,
  SERVICES,
} = require('./common');

const rootDir = path.join(__dirname, '..');
const logsDir = path.join(rootDir, 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function getPythonExecutable() {
  const venvPaths = [
    path.join(rootDir, '.venv', 'Scripts', 'python.exe'),
    path.join(rootDir, 'Medisphere_AI', 'venv', 'Scripts', 'python.exe'),
    path.join(rootDir, '.venv', 'bin', 'python'),
    path.join(rootDir, 'Medisphere_AI', 'venv', 'bin', 'python'),
  ];
  for (const p of venvPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function spawnSpringBootService(service) {
  const serviceDir = path.join(rootDir, service.dir);
  const mvnwCmd = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
  const logFile = path.join(logsDir, `${service.name}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'w' });
  
  const args = [
    'spring-boot:run',
    '-DskipTests',
    '-Dmaven.test.skip=true'
  ];

  logInfo(`Launching ${service.name} (Port ${service.port}) -> logs/${service.name}.log`);

  const child = spawn(mvnwCmd, args, {
    cwd: serviceDir,
    shell: true,
    env: {
      ...process.env,
      MAVEN_OPTS: '-Xms64m -Xmx256m',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  if (child.pid) {
    savePid(child.pid, service.name, service.port);
  }

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  child.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('ERROR') || msg.includes('APPLICATION FAILED')) {
      process.stderr.write(`[${service.name}] ${COLORS.red}${msg.trim()}${COLORS.reset}\n`);
    }
  });

  child.on('error', (err) => {
    logError(`Failed to start ${service.name}: ${err.message}`);
  });

  return child;
}

function spawnPythonService(service) {
  const serviceDir = path.join(rootDir, service.dir);
  const pythonCmd = getPythonExecutable();
  const appFile = path.join(serviceDir, 'app.py');
  const logFile = path.join(logsDir, `${service.name}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'w' });

  logInfo(`Launching Python ${service.name} (Port ${service.port}) -> logs/${service.name}.log`);

  const child = spawn(pythonCmd, [appFile], {
    cwd: serviceDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  if (child.pid) {
    savePid(child.pid, service.name, service.port);
  }

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  child.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('ERROR') || msg.includes('Traceback')) {
      process.stderr.write(`[${service.name}] ${COLORS.red}${msg.trim()}${COLORS.reset}\n`);
    }
  });

  return child;
}

async function startBackend() {
  const args = process.argv.slice(2);
  const modeArg = args.find((a) => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'full';

  console.log(`${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}       MediSphere Backend Orchestrator              ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}       Mode: ${mode.toUpperCase()}                             ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}\n`);

  const startTime = Date.now();

  // Phase 1: Infrastructure
  await startInfra();

  // Phase 2: Eureka Server
  const eurekaService = SERVICES.find((s) => s.name === 'eureka-server');
  if (eurekaService) {
    logStep(2, 6, 'Starting Service Discovery (Eureka Server)');
    const isOpen = await isPortOpen(eurekaService.port);
    if (isOpen) {
      logWarn(`Eureka Server is already listening on port ${eurekaService.port}`);
    } else {
      spawnSpringBootService(eurekaService);
      const eurekaReady = await waitFor('Eureka Server', async () => {
        return (await checkHttp(eurekaService.health)) || (await isPortOpen(eurekaService.port));
      }, 30, 1500);
      if (!eurekaReady) {
        logWarn('Eureka Server port not yet fully verified, continuing...');
      }
    }
  }

  // Phase 3: Config Server
  const configService = SERVICES.find((s) => s.name === 'config-server');
  if (configService) {
    logStep(3, 6, 'Starting Centralized Configuration (Config Server)');
    const isOpen = await isPortOpen(configService.port);
    if (isOpen) {
      logWarn(`Config Server is already listening on port ${configService.port}`);
    } else {
      spawnSpringBootService(configService);
      const configReady = await waitFor('Config Server', async () => {
        return (await checkHttp(configService.health)) || (await isPortOpen(configService.port));
      }, 30, 1500);
      if (!configReady) {
        logWarn('Config Server port not yet fully verified, continuing...');
      }
    }
  }

  // Phase 4: Flask AI Service
  const flaskService = SERVICES.find((s) => s.name === 'flask-ai-service');
  if (flaskService) {
    logStep(4, 6, 'Starting AI Inference Service (Flask AI)');
    const isOpen = await isPortOpen(flaskService.port);
    if (isOpen) {
      logWarn(`Flask AI Service is already listening on port ${flaskService.port}`);
    } else {
      spawnPythonService(flaskService);
      await waitFor('Flask AI Service', async () => {
        return (await checkHttp(flaskService.health)) || (await isPortOpen(flaskService.port));
      }, 20, 1500);
    }
  }

  // Phase 5: Domain Microservices (Staggered Parallel Batch Launching)
  const targetServices = SERVICES.filter((s) => {
    if (['eureka-server', 'config-server', 'flask-ai-service', 'api-gateway'].includes(s.name)) {
      return false;
    }
    return mode === 'core' ? s.core : true;
  });

  logStep(5, 6, `Starting ${targetServices.length} Domain Microservices (${mode} mode) in staggered batches`);

  const BATCH_SIZE = 3;
  for (let i = 0; i < targetServices.length; i += BATCH_SIZE) {
    const batch = targetServices.slice(i, i + BATCH_SIZE);
    for (const s of batch) {
      const isOpen = await isPortOpen(s.port);
      if (isOpen) {
        logWarn(`${s.name} is already running on port ${s.port}`);
        continue;
      }
      spawnSpringBootService(s);
    }
    if (i + BATCH_SIZE < targetServices.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Wait for all domain services to become ready.
  // core: 60s  — covers core services (3-14s startup) + Maven resource-copy overhead
  // full: 120s — covers all 15 services; on resource-constrained machines the JVM scheduler
  //              can delay later-launched services. Services not ready within the window
  //              will continue starting in the background.
  const domainTimeout = mode === 'core' ? 60000 : 120000;
  await waitForAll(targetServices, domainTimeout, 1500);

  // Phase 6: API Gateway
  const gatewayService = SERVICES.find((s) => s.name === 'api-gateway');
  if (gatewayService) {
    logStep(6, 6, 'Starting Central API Gateway');
    const isOpen = await isPortOpen(gatewayService.port);
    if (isOpen) {
      logWarn(`API Gateway is already listening on port ${gatewayService.port}`);
    } else {
      spawnSpringBootService(gatewayService);
      await waitFor('API Gateway', async () => {
        return (await checkHttp(gatewayService.health)) || (await isPortOpen(gatewayService.port));
      }, 30, 1500);
    }
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${COLORS.bright}${COLORS.green}====================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.green}    ✔ MediSphere Backend Started (${elapsedSec}s)           ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.green}====================================================${COLORS.reset}`);
  console.log(`  Eureka Dashboard: ${COLORS.cyan}http://localhost:8761${COLORS.reset}`);
  console.log(`  Config Server:    ${COLORS.cyan}http://localhost:8888${COLORS.reset}`);
  console.log(`  API Gateway:      ${COLORS.cyan}http://localhost:8080${COLORS.reset}`);
  console.log(`  Keycloak Console: ${COLORS.cyan}http://localhost:8081${COLORS.reset}`);
  console.log(`  Flask AI API:     ${COLORS.cyan}http://localhost:5000${COLORS.reset}`);
  console.log(`\nRun ${COLORS.yellow}npm run status${COLORS.reset} to view service port statuses.`);
  console.log(`Run ${COLORS.yellow}npm run stop${COLORS.reset} to stop all backend services.\n`);
}

if (require.main === module) {
  startBackend();
}

module.exports = { startBackend };
