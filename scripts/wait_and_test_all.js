async function getToken() {
  const tokenRes = await fetch('http://localhost:8081/realms/medisphere/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=medisphere-frontend&username=doctor&password=password123',
  });
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

async function request(url, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, data: json };
}

async function runFullVerification() {
  console.log('Waiting for health-twin-service on port 8990...');
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const h = await fetch('http://localhost:8990/actuator/health');
      if (h.status === 200) {
        ready = true;
        console.log('health-twin-service is READY on port 8990!');
        break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 1500));
  }

  if (!ready) {
    console.log('Warning: health-twin-service actuator health check did not return 200 within timeout.');
  }

  const token = await getToken();

  console.log('\n========================================================================');
  console.log('                   HEALTH TWIN & VITALS END-TO-END VERIFICATION');
  console.log('========================================================================\n');

  console.log('1. Vitals Service Direct: GET http://localhost:8992/api/vitals/latest/P1001');
  const r1 = await request('http://localhost:8992/api/vitals/latest/P1001', token);
  console.log(` -> Status: ${r1.status}`);
  console.log(` -> Payload:`, JSON.stringify(r1.data));

  console.log('\n2. Vitals API via Gateway: GET http://localhost:8080/api/vitals/latest/P1001');
  const r2 = await request('http://localhost:8080/api/vitals/latest/P1001', token);
  console.log(` -> Status: ${r2.status}`);
  console.log(` -> Payload:`, JSON.stringify(r2.data));

  console.log('\n3. Health Twin Direct: GET http://localhost:8990/api/twins/P1001');
  const r3 = await request('http://localhost:8990/api/twins/P1001', token);
  console.log(` -> Status: ${r3.status}`);
  console.log(` -> Payload:`, JSON.stringify(r3.data));

  console.log('\n4. Health Twin via Gateway: GET http://localhost:8080/api/twins/P1001');
  const r4 = await request('http://localhost:8080/api/twins/P1001', token);
  console.log(` -> Status: ${r4.status}`);
  console.log(` -> Payload:`, JSON.stringify(r4.data));

  console.log('\n5. Labs API via Gateway for P1001: GET http://localhost:8080/api/labs/P1001');
  const r5 = await request('http://localhost:8080/api/labs/P1001', token);
  console.log(` -> Status: ${r5.status}`);
  console.log(` -> Payload:`, JSON.stringify(r5.data));

  console.log('\n6. Labs API via Gateway for PT00039: GET http://localhost:8080/api/labs/PT00039');
  const r6 = await request('http://localhost:8080/api/labs/PT00039', token);
  console.log(` -> Status: ${r6.status}`);
  console.log(` -> Payload:`, JSON.stringify(r6.data));

  console.log('\n========================================================================');
  console.log('                          TEST RESULTS SUMMARY');
  console.log('========================================================================');
  console.log(` - Vitals Service (8992 / 8080)   : ${r2.status === 200 ? 'PASS (Status 200)' : 'FAIL'}`);
  console.log(` - Health Twin Service (8990/8080): ${r4.status === 200 ? 'PASS (Status 200)' : 'FAIL'}`);
  console.log(` - Labs API P1001                 : ${r5.status === 200 ? 'PASS (Status 200)' : 'FAIL'}`);
  console.log(` - Labs API PT00039               : ${r6.status === 200 ? 'PASS (Status 200)' : 'FAIL'}`);
  console.log('========================================================================\n');
}

runFullVerification();
