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

async function request(url, token = null) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, data: json };
}

async function diagnose() {
  console.log('--- DIAGNOSTIC SCRIPT START ---');
  const token = await getToken('doctor', 'password123');
  console.log('Doctor token obtained:', token ? 'YES' : 'NO');

  console.log('\n1. API Gateway Vitals: GET http://localhost:8080/api/vitals/latest/P1001');
  const gatewayVitals = await request('http://localhost:8080/api/vitals/latest/P1001', token);
  console.log('Status:', gatewayVitals.status, 'Data:', JSON.stringify(gatewayVitals.data));

  console.log('\n2. Direct Vitals Service: GET http://localhost:8992/api/vitals/latest/P1001');
  const directVitals = await request('http://localhost:8992/api/vitals/latest/P1001', token);
  console.log('Status:', directVitals.status, 'Data:', JSON.stringify(directVitals.data));

  console.log('\n3. API Gateway HealthTwin: GET http://localhost:8080/api/twins/P1001');
  const gatewayTwin = await request('http://localhost:8080/api/twins/P1001', token);
  console.log('Status:', gatewayTwin.status, 'Data:', JSON.stringify(gatewayTwin.data));

  console.log('\n4. Direct HealthTwin Service: GET http://localhost:8990/api/twins/P1001');
  const directTwin = await request('http://localhost:8990/api/twins/P1001', token);
  console.log('Status:', directTwin.status, 'Data:', JSON.stringify(directTwin.data));

  console.log('\n5. API Gateway Labs P1001: GET http://localhost:8080/api/labs/P1001');
  const labsP1001 = await request('http://localhost:8080/api/labs/P1001', token);
  console.log('Status:', labsP1001.status, 'Data:', JSON.stringify(labsP1001.data));

  console.log('\n6. API Gateway Labs PT00039: GET http://localhost:8080/api/labs/PT00039');
  const labsPT00039 = await request('http://localhost:8080/api/labs/PT00039', token);
  console.log('Status:', labsPT00039.status, 'Data:', JSON.stringify(labsPT00039.data));
}

diagnose();
