async function checkEureka() {
  try {
    const res = await fetch('http://localhost:8761/eureka/apps', {
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    console.log('Eureka Applications:');
    const apps = data.applications?.application || [];
    apps.forEach(app => {
      console.log(` - ${app.name} (${app.instance?.length || 0} instances)`);
    });
  } catch (err) {
    console.error('Eureka check failed:', err.message);
  }
}
checkEureka();
