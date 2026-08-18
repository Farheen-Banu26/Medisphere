const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch (e) { resolve({ status: res.statusCode, raw: buf }); }
      });
    }).on('error', reject);
  });
}

async function inspectData() {
  console.log('=== INSPECTING PATIENTS FROM PATIENT-SERVICE ===');
  try {
    const patients = await httpGet('http://localhost:8989/api/patients');
    console.log(`Found ${patients.length || 0} patients:`);
    if (Array.isArray(patients)) {
      patients.forEach(p => {
        console.log(` - ID: ${p.id}, patientId: ${p.patientId}, Name: ${p.firstName} ${p.lastName}, Email: ${p.email}`);
      });
    } else {
      console.log('Response:', patients);
    }
  } catch (err) {
    console.error('Error fetching patients:', err.message);
  }

  console.log('\n=== INSPECTING CARE PLANS FROM CAREPLAN-SERVICE ===');
  try {
    const summary = await httpGet('http://localhost:9004/api/careplans/dashboard/summary');
    console.log('Dashboard summary:', summary);
  } catch (err) {
    console.error('Error fetching careplan summary:', err.message);
  }
}

inspectData();
