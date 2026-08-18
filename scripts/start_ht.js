const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const serviceDir = path.join(__dirname, '..', 'health-twin-service');
const logFile = path.join(__dirname, '..', 'logs', 'health-twin-service-live.log');
const out = fs.openSync(logFile, 'a');
const err = fs.openSync(logFile, 'a');

const mvnwCmd = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
const child = spawn(mvnwCmd, ['spring-boot:run', '-DskipTests'], {
  cwd: serviceDir,
  detached: true,
  stdio: ['ignore', out, err],
  shell: true
});

child.unref();
console.log(`health-twin-service spawned with PID ${child.pid}`);
