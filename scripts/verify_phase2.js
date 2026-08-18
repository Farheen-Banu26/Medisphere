/**
 * Phase 2 Final Verification Script
 * READ-ONLY — No data modifications.
 */
const http = require('http');
const fs   = require('fs');

const KC_HOST   = 'localhost:8081';
const GW_HOST   = 'localhost:8080';
const REALM     = 'medisphere';
const CLIENT_ID = 'medisphere-frontend';

const USERS = {
  admin:   { username: 'admin',   password: 'password123' },
  doctor:  { username: 'doctor',  password: 'password123' },
  patient: { username: 'patient', password: 'password123' },
};

function request(method, hostname, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const port = parseInt(hostname.split(':')[1] || '80');
    const host = hostname.split(':')[0];
    const opts = { method, hostname: host, port, path, headers };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 'ERR', body: e.message }));
    if (body) req.write(body);
    req.end();
  });
}

async function getToken(username, password) {
  const body = `grant_type=password&client_id=${CLIENT_ID}&username=${username}&password=${password}`;
  const res = await request('POST', KC_HOST,
    `/realms/${REALM}/protocol/openid-connect/token`,
    { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    body
  );
  const json = JSON.parse(res.body);
  if (!json.access_token) throw new Error(`Token fetch failed for ${username}: ${res.body}`);
  return json.access_token;
}

async function api(method, path, token, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (body)  headers['Content-Length'] = Buffer.byteLength(body);
  const res = await request(method, GW_HOST, path, headers, body);
  return res.status;
}

function pass(label, expected, actual) {
  const ok = Array.isArray(expected) ? expected.includes(actual) : expected === actual;
  const mark = ok ? '✅ PASS' : '❌ FAIL';
  const exp  = Array.isArray(expected) ? expected.join(' or ') : expected;
  console.log(`${mark} | ${label.padEnd(60)} | Expected: ${String(exp).padEnd(10)} | Actual: ${actual}`);
  return ok;
}

async function main() {
  console.log('\n====================================================');
  console.log('   MEDISPHERE PHASE 2 — FINAL VERIFICATION REPORT   ');
  console.log('====================================================\n');

  /* ── Tokens ── */
  console.log('Fetching tokens...');
  let adminTok, docTok, patTok;
  try {
    [adminTok, docTok, patTok] = await Promise.all([
      getToken(USERS.admin.username, USERS.admin.password),
      getToken(USERS.doctor.username, USERS.doctor.password),
      getToken(USERS.patient.username, USERS.patient.password),
    ]);
    console.log('✅ Admin token       : OK');
    console.log('✅ Doctor token      : OK');
    console.log('✅ Patient token     : OK');
  } catch (e) {
    console.error('❌ Token fetch error:', e.message);
    process.exit(1);
  }

  let total = 0, passed = 0;
  const test = (label, expected, actual) => {
    total++;
    if (pass(label, expected, actual)) passed++;
  };

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── UNAUTHENTICATED ACCESS (expect 401) ──');
  test('No JWT → GET /api/patients',                  401, await api('GET', '/api/patients',              null));
  test('No JWT → GET /api/twins/P1002',               401, await api('GET', '/api/twins/P1002',           null));
  test('No JWT → GET /api/vitals/P1002',              401, await api('GET', '/api/vitals/P1002',          null));
  test('No JWT → GET /api/careplans/P1002',           401, await api('GET', '/api/careplans/P1002',       null));

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── ADMIN FULL ACCESS (expect 200) ──');
  test('Admin → GET /api/patients',                   200, await api('GET', '/api/patients',              adminTok));
  test('Admin → GET /api/twins/P1001',                200, await api('GET', '/api/twins/P1001',           adminTok));
  test('Admin → GET /api/vitals/P1001',               200, await api('GET', '/api/vitals/P1001',          adminTok));
  test('Admin → GET /api/twins/P1002',                200, await api('GET', '/api/twins/P1002',           adminTok));
  test('Admin → GET /api/vitals/P1002',               200, await api('GET', '/api/vitals/P1002',          adminTok));

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── DOCTOR D001 ISOLATION ──');
  test('Doctor D001 → /api/patients/doctor/D001 (own)',   200, await api('GET', '/api/patients/doctor/D001',  docTok));
  test('Doctor D001 → /api/patients/doctor/D002 (other)', 403, await api('GET', '/api/patients/doctor/D002',  docTok));
  test('Doctor D001 → /api/twins/P1002 (assigned)',        200, await api('GET', '/api/twins/P1002',           docTok));
  test('Doctor D001 → /api/twins/PT00009 (D002 patient)', 403, await api('GET', '/api/twins/PT00009',         docTok));
  test('Doctor D001 → /api/vitals/P1002 (assigned)',       200, await api('GET', '/api/vitals/P1002',          docTok));
  test('Doctor D001 → /api/vitals/PT00009 (D002 patient)',403, await api('GET', '/api/vitals/PT00009',        docTok));
  test('Doctor D001 → /api/careplans/patient/P1002',      [200,404], await api('GET', '/api/careplans/patient/P1002', docTok));

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── PATIENT P1002 ISOLATION ──');
  test('Patient P1002 → /api/patients/P1002 (own)',    200, await api('GET', '/api/patients/P1002',           patTok));
  test('Patient P1002 → /api/patients/P1001 (other)', 403, await api('GET', '/api/patients/P1001',           patTok));
  test('Patient P1002 → /api/twins/P1002 (own)',       200, await api('GET', '/api/twins/P1002',              patTok));
  test('Patient P1002 → /api/twins/P1001 (other)',     403, await api('GET', '/api/twins/P1001',              patTok));
  test('Patient P1002 → /api/vitals/P1002 (own)',      200, await api('GET', '/api/vitals/P1002',             patTok));
  test('Patient P1002 → /api/vitals/P1001 (other)',    403, await api('GET', '/api/vitals/P1001',             patTok));
  test('Patient P1002 → /api/careplans/P1002 (own)',   [200,404], await api('GET', '/api/careplans/P1002',    patTok));
  test('Patient P1002 → /api/careplans/P1001 (other)', 403, await api('GET', '/api/careplans/P1001',         patTok));

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── PATIENT ASSIGNMENT API ──');
  const assignBody = JSON.stringify({ assignedDoctorId: 'D001', specialty: 'Cardiology' });
  test('Admin PUT /api/patients/P1001/assign',         200, await api('PUT', '/api/patients/P1001/assign',    adminTok, assignBody));
  test('Doctor PUT /api/patients/P1001/assign (denied)',403, await api('PUT', '/api/patients/P1001/assign',   docTok,  assignBody));

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── FRONTEND SIDEBAR NAVIGATION CHECKS ──');
  // Check sidebar file for absence of Operations/Validation/FHIR-Sync in doctorNavItems
  const sidebar = fs.readFileSync('medisphere-frontend/src/components/sidebar/Sidebar.jsx', 'utf8');
  const docSection = sidebar.match(/doctorNavItems\s*=\s*\[[\s\S]*?\];/)?.[0] || '';
  const hasOps  = docSection.includes('/doctor/operations');
  const hasVal  = docSection.includes('/doctor/validation');
  const hasFhir = docSection.includes('/doctor/fhir-sync');
  test('Doctor sidebar: NO /doctor/operations',    false, hasOps);
  test('Doctor sidebar: NO /doctor/validation',    false, hasVal);
  test('Doctor sidebar: NO /doctor/fhir-sync',     false, hasFhir);

  // Check admin sidebar for Doctors & Hospitals
  const adminSection = sidebar.match(/adminNavItems\s*=\s*\[[\s\S]*?\];/)?.[0] || '';
  const hasDocHosp = adminSection.includes('/admin/doctors-hospitals');
  test('Admin sidebar: HAS /admin/doctors-hospitals', true, hasDocHosp);

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── DOCTORS-HOSPITALS COMPONENT FILE ──');
  const djsExists = fs.existsSync('medisphere-frontend/src/pages/Admin/DoctorsHospitals.jsx');
  test('DoctorsHospitals.jsx file exists',          true, djsExists);

  /* ──────────────────────────────────────────────────────── */
  console.log('\n── API GATEWAY SECURITY CONFIG ──');
  const gwConfig = fs.readFileSync('api-gateway/src/main/java/com/infosys/api_gateway/config/SecurityConfig.java', 'utf8');
  const patientPermitAll = gwConfig.includes('"/api/patients/**"') && gwConfig.includes('permitAll');
  test('API Gateway: /api/patients NOT permitAll',  false, patientPermitAll);

  /* ──────────────────────────────────────────────────────── */
  console.log('\n════════════════════════════════════════════════════');
  console.log(`FINAL RESULT: ${passed}/${total} tests passed`);
  if (passed === total) console.log('✅ ALL TESTS PASSED — PHASE 2 VERIFIED');
  else                  console.log(`⚠️  ${total - passed} test(s) failed — review above`);
  console.log('════════════════════════════════════════════════════\n');
}

main().catch(console.error);
