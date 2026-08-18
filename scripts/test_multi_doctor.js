/**
 * Multi-Doctor Verification Script
 * Tests Keycloak login & backend authorization for all 5 doctors:
 * - doctor    (D001 / Dr. Sarah Jenkins / Cardiology)
 * - dr_smith  (D002 / Dr. Robert Smith / Neurology)
 * - dr_jones  (D003 / Dr. Emily Jones / Pulmonology)
 * - dr_patel  (D004 / Dr. Rajesh Patel / General Medicine)
 * - dr_chen   (D005 / Dr. Michael Chen / Nephrology)
 */
const http = require('http');

const KC_HOST = 'localhost:8081';
const GW_HOST = 'localhost:8080';
const REALM = 'medisphere';
const CLIENT_ID = 'medisphere-frontend';

const DOCTORS = [
  { username: 'doctor',   docId: 'D001', expectedCount: 12, name: 'Dr. Sarah Jenkins' },
  { username: 'dr_smith', docId: 'D002', expectedCount: 10, name: 'Dr. Robert Smith' },
  { username: 'dr_jones', docId: 'D003', expectedCount: 10, name: 'Dr. Emily Jones' },
  { username: 'dr_patel', docId: 'D004', expectedCount: 9,  name: 'Dr. Rajesh Patel' },
  { username: 'dr_chen',  docId: 'D005', expectedCount: 9,  name: 'Dr. Michael Chen' },
];

const ALL_DOC_IDS = ['D001', 'D002', 'D003', 'D004', 'D005'];

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

async function getToken(username, password = 'password123') {
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

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
}

async function main() {
  console.log('\n====================================================');
  console.log('   MULTI-DOCTOR KEYCLOAK & ISOLATION TEST SUITE     ');
  console.log('====================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, label, actualInfo = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS | ${label}${actualInfo ? ' -> ' + actualInfo : ''}`);
    } else {
      console.log(`❌ FAIL | ${label}${actualInfo ? ' -> ' + actualInfo : ''}`);
    }
  }

  /* ────────────────────────────────────────────────────────
   * STEP A & B: Token Acquisition & Role Verification
   * ──────────────────────────────────────────────────────── */
  console.log('── STEP A & B: TOKEN ACQUISITION & ROLE VERIFICATION ──');
  const tokens = {};
  for (const doc of DOCTORS) {
    try {
      const tok = await getToken(doc.username);
      tokens[doc.username] = tok;
      const claims = parseJwt(tok);
      const roles = claims.realm_access?.roles || [];
      const hasDoctorRole = roles.includes('DOCTOR');
      assert(hasDoctorRole, `Token for ${doc.username} (${doc.docId}) fetched & contains DOCTOR role`, `Roles: [${roles.join(', ')}]`);
    } catch (e) {
      assert(false, `Token for ${doc.username} (${doc.docId}) fetched`, e.message);
    }
  }

  /* ────────────────────────────────────────────────────────
   * STEP C: Doctor Endpoint Isolation Test (/api/patients/doctor/{docId})
   * ──────────────────────────────────────────────────────── */
  console.log('\n── STEP C: DOCTOR ENDPOINT ISOLATION CHECKS ──');
  for (const currentDoc of DOCTORS) {
    const tok = tokens[currentDoc.username];
    if (!tok) continue;
    console.log(`\nTesting as ${currentDoc.username} (${currentDoc.docId} - ${currentDoc.name}):`);
    for (const targetDocId of ALL_DOC_IDS) {
      const isOwn = (targetDocId === currentDoc.docId);
      const expectedStatus = isOwn ? 200 : 403;
      const res = await request('GET', GW_HOST, `/api/patients/doctor/${targetDocId}`, { 'Authorization': 'Bearer ' + tok });
      assert(res.status === expectedStatus,
        `${currentDoc.username} -> GET /api/patients/doctor/${targetDocId} (Expected: ${expectedStatus})`,
        `Actual status: ${res.status}`
      );
    }
  }

  /* ────────────────────────────────────────────────────────
   * STEP D: General Patient Query Scoping (GET /api/patients)
   * ──────────────────────────────────────────────────────── */
  console.log('\n── STEP D: GENERAL PATIENT QUERY SCOPING (GET /api/patients) ──');
  for (const doc of DOCTORS) {
    const tok = tokens[doc.username];
    if (!tok) continue;
    const res = await request('GET', GW_HOST, '/api/patients', { 'Authorization': 'Bearer ' + tok });
    if (res.status !== 200) {
      assert(false, `${doc.username} -> GET /api/patients status 200`, `Actual status: ${res.status}`);
      continue;
    }
    const patients = JSON.parse(res.body);
    const countMatch = patients.length === doc.expectedCount;
    const onlyOwnPatients = patients.every(p => (p.assignedDoctorId || '').toUpperCase() === doc.docId);
    assert(countMatch && onlyOwnPatients,
      `${doc.username} (${doc.docId}) receives ONLY assigned patients (${doc.expectedCount})`,
      `Received: ${patients.length} patients, all assigned to ${doc.docId}: ${onlyOwnPatients}`
    );
  }

  console.log('\n====================================================');
  console.log(`MULTI-DOCTOR TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('✅ ALL MULTI-DOCTOR TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} TEST(S) FAILED!`);
  }
  console.log('====================================================\n');
}

main().catch(console.error);
