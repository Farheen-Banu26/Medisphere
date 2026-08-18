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

async function request(urlStr, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      host: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Fetching tokens...');
  const doctorToken = await getToken('doctor', 'password123');
  const patientToken = await getToken('patient', 'password123');
  const adminToken = await getToken('admin', 'password123');

  console.log('\n====================================================');
  console.log('       PHASE 2 SECONDARY API SECURITY TEST SUITE    ');
  console.log('====================================================\n');

  // TEST 1: Patient P1002 -> P1002 Health Twin
  const t1 = await request('http://127.0.0.1:8080/api/twins/P1002', patientToken);
  console.log(`TEST 1 (Patient P1002 -> P1002 Health Twin): Expected 200 -> Actual ${t1.status} | PASS: ${t1.status === 200}`);

  // TEST 2: Patient P1002 -> P1001 Health Twin
  const t2 = await request('http://127.0.0.1:8080/api/twins/P1001', patientToken);
  console.log(`TEST 2 (Patient P1002 -> P1001 Health Twin): Expected 403 -> Actual ${t2.status} | PASS: ${t2.status === 403}`);

  // TEST 3: Patient P1002 -> P1002 Vitals
  const t3 = await request('http://127.0.0.1:8080/api/vitals/P1002', patientToken);
  console.log(`TEST 3 (Patient P1002 -> P1002 Vitals): Expected 200 -> Actual ${t3.status} | PASS: ${t3.status === 200}`);

  // TEST 4: Patient P1002 -> P1001 Vitals
  const t4 = await request('http://127.0.0.1:8080/api/vitals/P1001', patientToken);
  console.log(`TEST 4 (Patient P1002 -> P1001 Vitals): Expected 403 -> Actual ${t4.status} | PASS: ${t4.status === 403}`);

  // TEST 5: Patient P1002 -> P1002 Care Plan
  const t5 = await request('http://127.0.0.1:8080/api/careplans/P1002', patientToken);
  console.log(`TEST 5 (Patient P1002 -> P1002 Care Plan): Expected 200/404 -> Actual ${t5.status} | PASS: ${t5.status === 200 || t5.status === 404}`);

  // TEST 6: Patient P1002 -> P1001 Care Plan
  const t6 = await request('http://127.0.0.1:8080/api/careplans/P1001', patientToken);
  console.log(`TEST 6 (Patient P1002 -> P1001 Care Plan): Expected 403 -> Actual ${t6.status} | PASS: ${t6.status === 403}`);

  // TEST 7: Doctor D001 -> assigned patient (P1002) Health Twin & Vitals
  const t7a = await request('http://127.0.0.1:8080/api/twins/P1002', doctorToken);
  const t7b = await request('http://127.0.0.1:8080/api/vitals/P1002', doctorToken);
  console.log(`TEST 7 (Doctor D001 -> Assigned P1002 Twin & Vitals): Expected 200 -> Actual Twin:${t7a.status}, Vitals:${t7b.status} | PASS: ${t7a.status === 200 && t7b.status === 200}`);

  // TEST 8: Doctor D001 -> D002 patient (PT00009) resources
  const t8a = await request('http://127.0.0.1:8080/api/twins/PT00009', doctorToken);
  const t8b = await request('http://127.0.0.1:8080/api/vitals/PT00009', doctorToken);
  console.log(`TEST 8 (Doctor D001 -> D002 Patient PT00009 Twin & Vitals): Expected 403 -> Actual Twin:${t8a.status}, Vitals:${t8b.status} | PASS: ${t8a.status === 403 && t8b.status === 403}`);

  // TEST 9: No JWT -> protected resources
  const t9a = await request('http://127.0.0.1:8080/api/twins/P1002');
  const t9b = await request('http://127.0.0.1:8080/api/vitals/P1002');
  console.log(`TEST 9 (No JWT -> Protected Twin & Vitals): Expected 401 -> Actual Twin:${t9a.status}, Vitals:${t9b.status} | PASS: ${t9a.status === 401 && t9b.status === 401}`);

  // TEST 10: Admin -> legitimate resources
  const t10a = await request('http://127.0.0.1:8080/api/twins/P1001', adminToken);
  const t10b = await request('http://127.0.0.1:8080/api/vitals/P1001', adminToken);
  console.log(`TEST 10 (Admin -> Legitimate Twin & Vitals): Expected 200 -> Actual Twin:${t10a.status}, Vitals:${t10b.status} | PASS: ${t10a.status === 200 && t10b.status === 200}`);
}

runTests();
