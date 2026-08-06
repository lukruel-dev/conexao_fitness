const { Client } = require('pg');

async function checkBookings() {
  const client = new Client({
    connectionString: 'postgresql://postgres.koonegmqzmtpmppasjgl:ixLambxcLMDGtEq6@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Query users
    const users = await client.query('SELECT id, name, email, role FROM users;');
    console.log('\n--- Users ---');
    users.rows.forEach(u => console.log(`${u.id.substring(0, 8)} | ${u.name} | ${u.role} | ${u.email}`));

    // Query services for fisio
    const services = await client.query('SELECT * FROM services WHERE "providerId" = \'9c6cc64f\';');
    console.log('\n--- Fisio Services ---');
    console.log(services.rows);
    
  } catch (err) {
    console.error('Error connecting or querying', err.message);
  } finally {
    await client.end();
  }
}

checkBookings();
