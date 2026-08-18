const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const logsDir = path.join(rootDir, 'logs');

function startService(dirName, name) {
  const serviceDir = path.join(rootDir, dirName);
  const mvnwCmd = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
  const logFile = path.join(logsDir, `${name}.log`);
  const outFd = fs.openSync(logFile, 'a');

  const child = spawn(mvnwCmd, ['spring-boot:run', '-DskipTests'], {
    cwd: serviceDir,
    shell: true,
    stdio: ['ignore', outFd, outFd]
  });
  console.log(`Started ${name} (PID: ${child.pid})`);
  return child;
}

startService('health-twin-service', 'health-twin-service');
startService('api-gateway', 'api-gateway');
