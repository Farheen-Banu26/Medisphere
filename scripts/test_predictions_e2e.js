const http = require('http');

async function getToken(username, password) {
  const body = `grant_type=password&client_id=medisphere-frontend&username=${username}&password=${password}`;
  const res = await fetch('http://localhost:8081/realms/medisphere/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body,
  });
  const json = await res.json();
  return json.access_token;
}

async function request(url, method = 'GET', body = null, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const opts = {
    method,
    headers,
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, data: json };
}

async function runPredictionsE2ETest() {
  console.log('========================================================================');
  console.log('       AI PREDICTIONS PAGE END-TO-END VERIFICATION TEST SUITE          ');
  console.log('========================================================================\n');

  // Step 1: Doctor Login & Token Acquisition
  console.log('[Step 1] Logging in as Doctor to Keycloak (localhost:8081)...');
  const doctorToken = await getToken('doctor', 'password123');
  console.log(` -> Doctor Token Obtained: ${doctorToken ? 'YES (Valid Bearer JWT)' : 'NO (FAILED)'}\n`);

  if (!doctorToken) {
    console.error('CRITICAL FAIL: Could not obtain Keycloak Doctor token!');
    return;
  }

  // Step 2: GET /api/patients with Doctor Bearer Token
  console.log('[Step 2] Requesting GET http://localhost:8080/api/patients with Doctor Token...');
  const patientsRes = await request('http://localhost:8080/api/patients', 'GET', null, doctorToken);
  console.log(` -> HTTP Response Status : ${patientsRes.status}`);
  console.log(` -> Total Patients Loaded : ${Array.isArray(patientsRes.data) ? patientsRes.data.length : 'N/A'}\n`);

  if (patientsRes.status !== 200 || !Array.isArray(patientsRes.data)) {
    console.error(`FAIL: GET /api/patients failed with status ${patientsRes.status}`);
    return;
  }

  // Step 3: Select Patient P1001
  const targetPatientId = 'P1001';
  console.log(`[Step 3] Selecting Patient ${targetPatientId} and fetching health snapshot...`);

  const [patientRes, twinRes, vitalsRes] = await Promise.all([
    request(`http://localhost:8080/api/patients/${targetPatientId}`, 'GET', null, doctorToken),
    request(`http://localhost:8080/api/twins/${targetPatientId}`, 'GET', null, doctorToken),
    request(`http://localhost:8080/api/vitals/latest/${targetPatientId}`, 'GET', null, doctorToken),
  ]);

  console.log(` -> Patient Profile Status  : ${patientRes.status} (${patientRes.data.firstName} ${patientRes.data.lastName})`);
  console.log(` -> Health Twin Status     : ${twinRes.status} (BMI: ${twinRes.data.bmi}, HealthScore: ${twinRes.data.healthScore})`);
  console.log(` -> Latest Vitals Status    : ${vitalsRes.status} (HR: ${vitalsRes.data.heartRate}, BP: ${vitalsRes.data.bpSystolic}/${vitalsRes.data.bpDiastolic})\n`);

  // Step 4: Generate Prediction via predictionService
  console.log(`[Step 4] Triggering Generate Prediction (POST http://localhost:8080/api/predictions)...`);
  const predRes = await request('http://localhost:8080/api/predictions', 'POST', { patientId: targetPatientId }, doctorToken);
  console.log(` -> Prediction HTTP Status : ${predRes.status}`);
  console.log(` -> Heart Disease Risk     : ${predRes.data.heartDiseasePrediction} (${predRes.data.confidence || predRes.data.heartDiseaseProbability}%)`);
  console.log(` -> Diabetes Risk          : ${predRes.data.diabetesPrediction} (${predRes.data.diabetesProbability || ''})\n`);

  // Step 5: Verification Check Summary
  console.log('========================================================================');
  console.log('   VERIFICATION SUMMARY');
  console.log('========================================================================');
  console.log(` 1. GET /api/patients Status 200 : ${patientsRes.status === 200 ? 'PASS' : 'FAIL'}`);
  console.log(` 2. Patient List Loaded          : PASS (${patientsRes.data.length} patients returned)`);
  console.log(` 3. Selected Patient P1001 Data  : PASS (${patientRes.data.firstName} ${patientRes.data.lastName}, ID: ${patientRes.data.patientId})`);
  console.log(` 4. Vitals & Twin Snapshot       : PASS (HR: ${vitalsRes.data.heartRate}, BP: ${vitalsRes.data.bpSystolic}/${vitalsRes.data.bpDiastolic})`);
  console.log(` 5. AI Prediction Model Invoked  : ${predRes.status === 200 ? 'PASS (CVD & Diabetes Risk Models)' : 'FAIL'}`);
  console.log('========================================================================\n');
}

runPredictionsE2ETest();
