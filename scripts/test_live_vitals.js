const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
          } else {
            resolve({ status: res.statusCode, error: data });
          }
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'POST' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testLiveVitals() {
  console.log('=== STARTING LIVE VITALS STREAM VERIFICATION ===');
  
  // 1. Ensure simulator is running
  try {
    const simStatus = await httpPost('http://localhost:8995/api/simulator/start');
    console.log('Wearable simulator start status:', simStatus);
  } catch (err) {
    console.log('Simulator call notice:', err.message);
  }

  // 2. Poll 5 consecutive readings for patient P1001
  const patientId = 'P1001';
  console.log(`\nMonitoring 5 consecutive readings for Patient: ${patientId}\n`);

  for (let i = 1; i <= 5; i++) {
    try {
      const latest = await httpGet(`http://localhost:8992/api/vitals/latest/${patientId}`);
      console.log(`[Reading ${i}] Timestamp: ${latest.recordedAt || new Date().toISOString()}`);
      console.log(`           Heart Rate  : ${latest.heartRate} BPM`);
      console.log(`           BloodPress  : ${latest.bpSystolic}/${latest.bpDiastolic} mmHg`);
      console.log(`           SpO2        : ${latest.spo2}%`);
      console.log(`           Temperature : ${latest.temperature} °C`);
      console.log('----------------------------------------------------');
    } catch (err) {
      console.error(`[Reading ${i}] Error fetching vitals:`, err.message);
    }
    if (i < 5) {
      await new Promise(r => setTimeout(r, 4000));
    }
  }

  console.log('\n=== LIVE VITALS STREAM VERIFICATION COMPLETE ===');
}

testLiveVitals();
