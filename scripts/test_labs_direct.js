async function testLabsDirect() {
  const tokenRes = await fetch('http://localhost:8081/realms/medisphere/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=password&client_id=medisphere-frontend&username=doctor&password=password123',
  });
  const tokenJson = await tokenRes.json();
  const token = tokenJson.access_token;

  console.log('Testing direct health-twin-service /api/labs/P1001...');
  const res1 = await fetch('http://localhost:8990/api/labs/P1001', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Direct Status P1001:', res1.status, 'Data:', await res1.text());

  console.log('Testing direct health-twin-service /api/labs/PT00039...');
  const res2 = await fetch('http://localhost:8990/api/labs/PT00039', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Direct Status PT00039:', res2.status, 'Data:', await res2.text());
}
testLabsDirect();
