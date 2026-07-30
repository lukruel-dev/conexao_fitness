import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'conexao_fitness',
});

async function run() {
  await dataSource.initialize();
  
  const roles = ['ADMIN', 'STUDENT', 'PERSONAL', 'ACADEMIA'];
  
  for (const role of roles) {
    const res = await dataSource.query(`SELECT email, name FROM "users" WHERE role = $1 LIMIT 1`, [role]);
    if (res.length > 0) {
      console.log(`Role: ${role} | Email: ${res[0].email} | Nome: ${res[0].name}`);
    } else {
      console.log(`Role: ${role} | NENHUM USUARIO ENCONTRADO`);
    }
  }
  
  await dataSource.destroy();
}

run().catch(console.error);
