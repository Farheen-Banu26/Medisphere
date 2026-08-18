// scripts/verify_doctor_monitoring_fix.js
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
        'Content-Length': Buffer.byteLength(body),
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data).access_token);
        } else {
          reject(new Error(`Failed to get token: HTTP ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function testEndpoint(name, options, origin = 'http://localhost:5173') {
  return new Promise((resolve, reject) => {
    const reqOpts = {
      ...options,
      headers: {
        ...(options.headers || {}),
        'Origin': origin,
      }
    };
    const req = http.request(reqOpts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[${name}] Status: ${res.statusCode} | CORS Allow-Origin: ${res.headers['access-control-allow-origin'] || 'NONE'}`);
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testSSE(token) {
  return new Promise((resolve, reject) => {
    console.log('\n--- Testing SSE Stream through API Gateway ---');
    const req = http.request({
      host: 'localhost',
      port: 8080,
      path: `/api/notifications/stream?token=${encodeURIComponent(token)}`,
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5173',
        'Accept': 'text/event-stream',
      }
    }, res => {
      console.log(`[SSE Stream] Status: ${res.statusCode} | Content-Type: ${res.headers['content-type']}`);
      console.log(`[SSE Stream] CORS Header: ${res.headers['access-control-allow-origin']}`);
      
      let chunkReceived = false;
      res.on('data', chunk => {
        chunkReceived = true;
        console.log(`[SSE Stream] Chunk received: ${chunk.toString().trim()}`);
      });

      setTimeout(() => {
        req.destroy();
        resolve({ status: res.statusCode, cors: res.headers['access-control-allow-origin'], received: chunkReceived });
      }, 2500);
    });

    req.on('error', reject);
    req.end();
  });
}

async function sampleVitals(token, patientId, count = 3) {
  console.log(`\n--- Sampling ${count} Real Readings for ${patientId} ---`);
  const readings = [];
  for (let i = 1; i <= count; i++) {
    const res = await testEndpoint(`Vitals Sample ${i}`, {
      host: 'localhost',
      port: 8080,
      path: `/api/vitals/latest/${patientId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const parsed = JSON.parse(res.body);
    console.log(`Reading ${i}: RecordedAt=${parsed.recordedAt} | HR=${parsed.heartRate} | BP=${parsed.bpSystolic}/${parsed.bpDiastolic} | SpO2=${parsed.spo2}% | Temp=${parsed.temperature}°C`);
    readings.push(parsed);
    if (i < count) {
      await new Promise(r => setTimeout(r, 6000));
    }
  }
  return readings;
}

async function main() {
  try {
    console.log('Step 1: Authenticating Keycloak Doctor user...');
    const doctorToken = await getToken('doctor', 'password123');
    console.log('✅ Doctor Keycloak JWT obtained successfully.');

    console.log('\nStep 2: Testing API Gateway Endpoints for Monitoring Dashboard...');
    
    // Test Patients
    await testEndpoint('GET /api/patients', {
      host: 'localhost',
      port: 8080,
      path: '/api/patients',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });

    // Test Active Alerts
    await testEndpoint('GET /api/alerts/active', {
      host: 'localhost',
      port: 8080,
      path: '/api/alerts/active',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });

    // Test Notifications REST endpoint
    await testEndpoint('GET /api/notifications', {
      host: 'localhost',
      port: 8080,
      path: '/api/notifications',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });

    // Test SSE Stream & CORS
    const sseResult = await testSSE(doctorToken);

    // Test Live Vitals Polling
    const vitals = await sampleVitals(doctorToken, 'P1001', 3);

    console.log('\n========================================');
    console.log('           VERIFICATION SUMMARY         ');
    console.log('========================================');
    console.log(`SSE Status: ${sseResult.status === 200 ? '✅ 200 OK' : '❌ ' + sseResult.status}`);
    console.log(`SSE CORS: ${sseResult.cors === 'http://localhost:5173' ? '✅ ALLOWED (http://localhost:5173)' : '❌ ' + sseResult.cors}`);
    console.log(`Distinct Vitals Timestamps: ${vitals[0].recordedAt !== vitals[1].recordedAt && vitals[1].recordedAt !== vitals[2].recordedAt ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

main();
