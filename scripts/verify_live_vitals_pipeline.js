// scripts/verify_live_vitals_pipeline.js
const http = require('http');
const { execSync } = require('child_process');

function fetchLatestVital(patientId) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8992/api/vitals/latest/${patientId}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function getMongoLatest(patientId) {
  const cmd = `mongosh test --quiet --eval "console.log(JSON.stringify(db.vitals.find({patientId: '${patientId}'}).sort({_id: -1}).limit(1).toArray()))"`;
  const res = execSync(cmd, { encoding: 'utf8' }).trim();
  return JSON.parse(res)[0];
}

async function run() {
  const patientId = 'P1001';
  console.log(`=== LIVE VITALS CONTINUOUS FLOW TEST FOR ${patientId} ===\n`);

  console.log('Sampling Reading 1...');
  const r1 = await fetchLatestVital(patientId);
  const m1 = getMongoLatest(patientId);
  console.log('Reading 1 (API):', JSON.stringify(r1, null, 2));
  console.log('Reading 1 (Mongo doc ID):', m1._id, 'RecordedAt:', m1.recordedAt);

  console.log('\nWaiting 6 seconds for Wearable Simulator -> Kafka -> MongoDB -> Vitals Service...');
  await new Promise(res => setTimeout(res, 6000));

  console.log('Sampling Reading 2...');
  const r2 = await fetchLatestVital(patientId);
  const m2 = getMongoLatest(patientId);
  console.log('Reading 2 (API):', JSON.stringify(r2, null, 2));
  console.log('Reading 2 (Mongo doc ID):', m2._id, 'RecordedAt:', m2.recordedAt);

  console.log('\nWaiting 6 seconds for Wearable Simulator -> Kafka -> MongoDB -> Vitals Service...');
  await new Promise(res => setTimeout(res, 6000));

  console.log('Sampling Reading 3...');
  const r3 = await fetchLatestVital(patientId);
  const m3 = getMongoLatest(patientId);
  console.log('Reading 3 (API):', JSON.stringify(r3, null, 2));
  console.log('Reading 3 (Mongo doc ID):', m3._id, 'RecordedAt:', m3.recordedAt);

  console.log('\n================ COMPARISON SUMMARY ================');
  console.log(`Reading 1 RecordedAt: ${r1.recordedAt} | HR: ${r1.heartRate} | BP: ${r1.bpSystolic}/${r1.bpDiastolic} | SpO2: ${r1.spo2}% | Temp: ${r1.temperature}°C | RR: ${r1.respirationRate}/min`);
  console.log(`Reading 2 RecordedAt: ${r2.recordedAt} | HR: ${r2.heartRate} | BP: ${r2.bpSystolic}/${r2.bpDiastolic} | SpO2: ${r2.spo2}% | Temp: ${r2.temperature}°C | RR: ${r2.respirationRate}/min`);
  console.log(`Reading 3 RecordedAt: ${r3.recordedAt} | HR: ${r3.heartRate} | BP: ${r3.bpSystolic}/${r3.bpDiastolic} | SpO2: ${r3.spo2}% | Temp: ${r3.temperature}°C | RR: ${r3.respirationRate}/min`);

  const distinctTimestamps = new Set([r1.recordedAt, r2.recordedAt, r3.recordedAt]).size === 3;
  console.log(`\nDistinct Timestamps Across All 3 Readings: ${distinctTimestamps ? '✅ YES (PASS)' : '❌ NO'}`);
}

run().catch(console.error);
