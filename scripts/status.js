const {
  COLORS,
  isPortOpen,
  checkHttp,
  SERVICES,
  INFRA_SERVICES,
} = require('./common');

async function checkStatus() {
  console.log(`\n${COLORS.bright}${COLORS.cyan}========================================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}                   MediSphere Local Status Overview                      ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}========================================================================${COLORS.reset}\n`);

  console.log(`${COLORS.bright}Infrastructure Containers:${COLORS.reset}`);
  console.log('------------------------------------------------------------------------');
  for (const s of INFRA_SERVICES) {
    const open = await isPortOpen(s.port);
    const statusStr = open
      ? `${COLORS.green}RUNNING / READY${COLORS.reset}`
      : `${COLORS.red}STOPPED${COLORS.reset}`;
    console.log(`  ${s.name.padEnd(24)} | Port: ${s.port.toString().padEnd(6)} | Status: ${statusStr}`);
  }

  console.log(`\n${COLORS.bright}Microservices & Core Services:${COLORS.reset}`);
  console.log('------------------------------------------------------------------------');
  for (const s of SERVICES) {
    const open = await isPortOpen(s.port);
    let extra = '';
    if (open && s.health) {
      const httpOk = await checkHttp(s.health);
      extra = httpOk ? ` ${COLORS.dim}(HTTP OK)${COLORS.reset}` : ` ${COLORS.dim}(Port Open)${COLORS.reset}`;
    }
    const statusStr = open
      ? `${COLORS.green}UP${COLORS.reset}${extra}`
      : `${COLORS.red}DOWN${COLORS.reset}`;
    console.log(`  ${s.name.padEnd(24)} | Port: ${s.port.toString().padEnd(6)} | Status: ${statusStr}`);
  }

  console.log(`\n${COLORS.bright}Frontend Application:${COLORS.reset}`);
  console.log('------------------------------------------------------------------------');

  // isPortOpen now tries both 127.0.0.1 and ::1, so Vite on IPv6 is correctly detected.
  // Scan 5173-5175 in case Vite fell back to a higher port (port-in-use fallback).
  const vitePorts = [5173, 5174, 5175];
  let fePort = null;
  for (const p of vitePorts) {
    if (await isPortOpen(p)) { fePort = p; break; }
  }

  let feStatus;
  if (fePort !== null) {
    const httpOk = await checkHttp(`http://localhost:${fePort}/`);
    feStatus = httpOk
      ? `${COLORS.green}UP (HTTP OK) \u2014 http://localhost:${fePort}${COLORS.reset}`
      : `${COLORS.green}UP (Port Open)${COLORS.reset}`;
  } else {
    feStatus = `${COLORS.red}DOWN${COLORS.reset}`;
  }

  const displayPort = (fePort ?? 5173).toString().padEnd(6);
  console.log(`  ${'medisphere-frontend'.padEnd(24)} | Port: ${displayPort} | Status: ${feStatus}`);

  console.log(`\n${COLORS.bright}${COLORS.cyan}========================================================================${COLORS.reset}\n`);
}

if (require.main === module) {
  checkStatus();
}
