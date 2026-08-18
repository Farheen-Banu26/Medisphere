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

async function runTest() {
  console.log('Fetching doctor token...');
  const doctorToken = await getToken('doctor', 'password123');
  console.log('Doctor token obtained:', doctorToken ? 'YES' : 'NO');

  console.log('\nFetching GET http://localhost:8080/api/patients with Doctor token...');
  const docRes = await fetch('http://localhost:8080/api/patients', {
    headers: { 'Authorization': `Bearer ${doctorToken}` }
  });
  console.log('Doctor Request Status:', docRes.status);
  const docBody = await docRes.json();
  console.log('Doctor Patients Count:', Array.isArray(docBody) ? docBody.length : docBody);

  console.log('\nFetching patient token...');
  const patientToken = await getToken('patient', 'password123');
  console.log('Fetching GET http://localhost:8080/api/patients with Patient token...');
  const patRes = await fetch('http://localhost:8080/api/patients', {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  console.log('Patient Request Status:', patRes.status);
}

runTest();
