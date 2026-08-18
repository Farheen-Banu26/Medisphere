async function testLabsGateway() {
  const tokenRes = await fetch('http://localhost:8081/realms/medisphere/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=medisphere-frontend&username=doctor&password=password123',
  });
  const tokenJson = await tokenRes.json();
  const token = tokenJson.access_token;

  console.log('1. Testing API Gateway /api/labs/P1001...');
  const res1 = await fetch('http://localhost:8080/api/labs/P1001', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Gateway P1001 Status:', res1.status, 'Data:', await res1.text());

  console.log('\n2. Testing API Gateway /api/labs/PT00039...');
  const res2 = await fetch('http://localhost:8080/api/labs/PT00039', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Gateway PT00039 Status:', res2.status, 'Data:', await res2.text());

  console.log('\n3. Testing API Gateway /api/twins/P1001...');
  const res3 = await fetch('http://localhost:8080/api/twins/P1001', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Gateway Twin Status:', res3.status, 'Data:', await res3.text());

  console.log('\n4. Testing API Gateway /api/vitals/latest/P1001...');
  const res4 = await fetch('http://localhost:8080/api/vitals/latest/P1001', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Gateway Vitals Status:', res4.status, 'Data:', await res4.text());
}

testLabsGateway();
