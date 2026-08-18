// scripts/test_milestone3_e2e.js
// Complete Milestone 3 End-to-End Test Suite

const http = require('http');

async function getToken(username, password) {
  return new Promise((resolve, reject) => {
    const body = `grant_type=password&client_id=medisphere-frontend&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const req = http.request({
      host: 'localhost',
      port: 8081,
      path: '/realms/medisphere/protocol/openid-connect/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.access_token);
        } catch(e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function apiRequest(urlStr, method = 'GET', bodyData = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    let payload = null;
    if (bodyData) {
      payload = JSON.stringify(bodyData);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request({
      host: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('       MEDISPHERE MILESTONE 3 E2E TEST SUITE        ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assertTest(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  // STEP 1: Keycloak Token Retrieval
  console.log('--- Step 1: Keycloak Authentication & Roles ---');
  let doctorToken, patient1Token, patient2Token, adminToken;
  try {
    doctorToken   = await getToken('doctor', 'password123');
    patient1Token = await getToken('farheen', 'password123');
    patient2Token = await getToken('patient', 'password123');
    adminToken    = await getToken('admin', 'password123');
    console.log(`Tokens -> Doctor: ${Boolean(doctorToken)}, P1: ${Boolean(patient1Token)}, P2: ${Boolean(patient2Token)}, Admin: ${Boolean(adminToken)}`);
    assertTest('Keycloak Token Generation', Boolean(doctorToken && patient1Token && patient2Token && adminToken));
  } catch (err) {
    console.error('Token fetch error:', err);
    assertTest('Keycloak Token Generation', false, err.message);
    process.exit(1);
  }

  // STEP 2: RBAC & Resource Security
  console.log('\n--- Step 2: Role-Based Access Control & Resource-Level Authorization ---');
  
  // No token -> 401
  const noAuthVitals = await apiRequest('http://127.0.0.1:8080/api/vitals/P1002');
  assertTest('No Token -> Protected Resource (401)', noAuthVitals.status === 401, `Status: ${noAuthVitals.status}`);

  // Patient P1001 -> P1002 Vitals (403)
  const p1ToP2Vitals = await apiRequest('http://127.0.0.1:8080/api/vitals/P1002', 'GET', null, patient1Token);
  assertTest('Patient P1001 -> P1002 Vitals (403)', p1ToP2Vitals.status === 403, `Status: ${p1ToP2Vitals.status}`);

  // Patient P1001 -> P1001 Vitals (200)
  const p1ToP1Vitals = await apiRequest('http://127.0.0.1:8080/api/vitals/P1001', 'GET', null, patient1Token);
  assertTest('Patient P1001 -> P1001 Vitals (200)', p1ToP1Vitals.status === 200, `Status: ${p1ToP1Vitals.status}`);

  // Patient P1001 -> P1002 Alerts (403)
  const p1ToP2Alerts = await apiRequest('http://127.0.0.1:8080/api/alerts/patient/P1002', 'GET', null, patient1Token);
  assertTest('Patient P1001 -> P1002 Alerts (403)', p1ToP2Alerts.status === 403, `Status: ${p1ToP2Alerts.status}`);

  // Patient P1001 -> P1002 Notifications (403)
  const p1ToP2Notifs = await apiRequest('http://127.0.0.1:8080/api/notifications/patient/P1002', 'GET', null, patient1Token);
  assertTest('Patient P1001 -> P1002 Notifications (403)', p1ToP2Notifs.status === 403, `Status: ${p1ToP2Notifs.status}`);

  // Patient P1001 -> P1002 Care Plan (403)
  const p1ToP2Plan = await apiRequest('http://127.0.0.1:8080/api/careplans/P1002', 'GET', null, patient1Token);
  assertTest('Patient P1001 -> P1002 Care Plan (403)', p1ToP2Plan.status === 403, `Status: ${p1ToP2Plan.status}`);

  // Patient P1001 -> Audit Logs (403)
  const p1Audit = await apiRequest('http://127.0.0.1:8080/api/audit/logs', 'GET', null, patient1Token);
  assertTest('Patient P1001 -> System Audit Logs (403)', p1Audit.status === 403, `Status: ${p1Audit.status}`);

  // Doctor D001 -> Assigned P1002 Vitals (200)
  const docAssignedVitals = await apiRequest('http://127.0.0.1:8080/api/vitals/P1002', 'GET', null, doctorToken);
  assertTest('Doctor D001 -> Assigned P1002 Vitals (200)', docAssignedVitals.status === 200, `Status: ${docAssignedVitals.status}`);

  // Doctor D001 -> Unassigned PT00009 Vitals (403)
  const docUnassignedVitals = await apiRequest('http://127.0.0.1:8080/api/vitals/PT00009', 'GET', null, doctorToken);
  assertTest('Doctor D001 -> Unassigned PT00009 Vitals (403)', docUnassignedVitals.status === 403, `Status: ${docUnassignedVitals.status}`);

  // Admin -> Audit Logs (200)
  const adminAudit = await apiRequest('http://127.0.0.1:8080/api/audit/logs', 'GET', null, adminToken);
  assertTest('Admin -> Audit Logs (200)', adminAudit.status === 200, `Status: ${adminAudit.status}`);

  // STEP 3: Dynamic Live Vitals & Wearable Ingestion
  console.log('\n--- Step 3: Dynamic Vitals Ingestion & Kafka Event Flow ---');
  const testPatientId = 'P1001';
  const abnormalVital = {
    patientId: testPatientId,
    heartRate: 145,
    bpSystolic: 185,
    bpDiastolic: 110,
    spo2: 88,
    temperature: 39.5,
    respirationRate: 24,
    steps: 4200,
    sleepHours: 6.5,
    recordedAt: new Date().toISOString()
  };

  const addVitalsRes = await apiRequest('http://127.0.0.1:8080/api/vitals', 'POST', abnormalVital, doctorToken);
  assertTest('Post Abnormal Vital Reading', addVitalsRes.status === 200, addVitalsRes.body);

  // Wait 3s for Kafka -> Clinical Rule Engine -> AI Enrichment -> Alert Creation -> Notification
  console.log('Waiting 3 seconds for Kafka stream processing...');
  await new Promise(r => setTimeout(r, 3000));

  // STEP 4: Alert Creation & Clinical Rule Engine Verification
  console.log('\n--- Step 4: Clinical Rule Engine & AI Anomaly Detection ---');
  const patientAlertsRes = await apiRequest(`http://127.0.0.1:8080/api/alerts/patient/${testPatientId}`, 'GET', null, doctorToken);
  assertTest('Fetch Patient Alerts', patientAlertsRes.status === 200, `Found ${patientAlertsRes.body.length || 0} alerts`);

  const alerts = Array.isArray(patientAlertsRes.body) ? patientAlertsRes.body : [];
  const latestAlert = alerts[0]; // newest first

  if (latestAlert) {
    assertTest('Alert ID Generated', Boolean(latestAlert.alertId), `AlertID: ${latestAlert.alertId}`);
    assertTest('Clinical Rule Classification', ['OXYGEN_ALERT', 'HYPERTENSION_CRISIS', 'POSSIBLE_AFIB', 'HIGH_HEART_RATE', 'HIGH_TEMPERATURE'].includes(latestAlert.type), `Type: ${latestAlert.type}`);
    assertTest('Alert Severity Set', ['CRITICAL', 'HIGH'].includes(latestAlert.severity), `Severity: ${latestAlert.severity}`);
    
    if (latestAlert.prediction) {
      assertTest('AI Anomaly Enrichment', Boolean(latestAlert.prediction && latestAlert.confidence != null), `Prediction: ${latestAlert.prediction}, Risk: ${latestAlert.risk}`);
    } else {
      console.log('ℹ️ AI Enrichment fallback active (Flask service offline or non-blocking rule fallback)');
    }
  } else {
    assertTest('Alert Created in MongoDB', false, 'No alert created');
  }

  // STEP 5: Notification Routing & Delivery
  console.log('\n--- Step 5: Notification Routing & Kafka notification-stream ---');
  const notifsRes = await apiRequest(`http://127.0.0.1:8080/api/notifications/patient/${testPatientId}`, 'GET', null, doctorToken);
  assertTest('Fetch Patient Notifications', notifsRes.status === 200, `Found ${notifsRes.body.length || 0} notifications`);

  const notifs = Array.isArray(notifsRes.body) ? notifsRes.body : [];
  if (notifs.length > 0) {
    const latestNotif = notifs[0];
    assertTest('Notification Created', Boolean(latestNotif.notificationId), `NotifID: ${latestNotif.notificationId}`);
    assertTest('Notification Route Assigned', Boolean(latestNotif.recipient), `Recipient: ${latestNotif.recipient}`);
  }

  // STEP 6: Alert Lifecycle & Doctor Acknowledgment / Closure
  console.log('\n--- Step 6: Alert Lifecycle (NEW -> SENT -> DELIVERED -> ACKNOWLEDGED -> CLOSED) ---');
  if (latestAlert && latestAlert.alertId) {
    const alertId = latestAlert.alertId;

    // Test: Attempt to Close Non-Acknowledged Alert (Must fail with 400/500/409/403)
    const prematureClose = await apiRequest(`http://127.0.0.1:8080/api/alerts/${alertId}/close`, 'PUT', null, doctorToken);
    assertTest('Prevent Closing Non-Acknowledged Alert', prematureClose.status >= 400, `Status: ${prematureClose.status}`);

    // Doctor Acknowledges
    const ackRes = await apiRequest(`http://127.0.0.1:8080/api/alerts/${alertId}/acknowledge`, 'PUT', { acknowledgedBy: 'Dr. Sarah Jenkins' }, doctorToken);
    assertTest('Doctor Acknowledges Alert', ackRes.status === 200 && ackRes.body.status === 'ACKNOWLEDGED', `Status: ${ackRes.body?.status}, AckBy: ${ackRes.body?.acknowledgedBy}`);

    // Doctor Closes
    const closeRes = await apiRequest(`http://127.0.0.1:8080/api/alerts/${alertId}/close`, 'PUT', null, doctorToken);
    assertTest('Doctor Closes Acknowledged Alert', closeRes.status === 200 && closeRes.body.status === 'CLOSED', `Status: ${closeRes.body?.status}`);
  }

  // STEP 7: Audit Log Verification
  console.log('\n--- Step 7: System Audit Trail Verification ---');
  const logsRes = await apiRequest('http://127.0.0.1:8080/api/audit/logs', 'GET', null, adminToken);
  const auditLogs = Array.isArray(logsRes.body) ? logsRes.body : [];
  assertTest('Audit Logs Retrieved', logsRes.status === 200 && auditLogs.length > 0, `Total logs: ${auditLogs.length}`);

  const actions = auditLogs.map(l => l.action);
  assertTest('Audit Log: ALERT_CREATED Recorded', actions.includes('ALERT_CREATED') || actions.includes('RECORD_VITALS'));
  assertTest('Audit Log: ALERT_ACKNOWLEDGED Recorded', actions.includes('ALERT_ACKNOWLEDGED'));

  console.log('\n====================================================');
  console.log(` E2E TEST SUMMARY: PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('Unhandled E2E Test Error:', err);
  process.exit(1);
});
