import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '*Lu082010*',
  database: 'conexao_fitness',
  synchronize: false,
});

async function run() {
  await AppDataSource.initialize();
  const passwordHash = await bcrypt.hash('123456', 10);
  await AppDataSource.query(`UPDATE "users" SET "passwordHash" = $1 WHERE email IN ('lkbenq@hotmail.com', 'personal@test.com', 'academia@test.com')`, [passwordHash]);
  console.log('Passwords updated to 123456');
  await AppDataSource.destroy();
}

run().catch(console.error);
