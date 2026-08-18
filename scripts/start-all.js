const { startBackend } = require('./start-backend');
const { startFrontend } = require('./start-frontend');
const { COLORS } = require('./common');

async function startAll() {
  console.log(`${COLORS.bright}${COLORS.magenta}====================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.magenta}       MediSphere Complete Environment Setup        ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.magenta}====================================================${COLORS.reset}\n`);

  await startBackend();
  startFrontend();
}

if (require.main === module) {
  startAll();
}
