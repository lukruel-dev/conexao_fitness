import { DataSource } from 'typeorm';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

async function main() {
  console.log('--- 1. VERIFICANDO USUÁRIO personal@finex.net.br ---');
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await ds.initialize();
  const users = await ds.query("SELECT id, name, email, role, status, \"stripeAccountId\" FROM users WHERE email = 'personal@finex.net.br'");
  console.log('Usuário encontrado:', JSON.stringify(users, null, 2));

  console.log('\n--- 2. CRIANDO PLANOS RECORRENTES NA STRIPE ---');
  const plansToCreate = [
    // Planos para Profissionais
    { name: 'Plano Personal Start', priceCents: 4990, role: 'PERSONAL' },
    { name: 'Plano Personal Pro', priceCents: 14990, role: 'PERSONAL' },
    { name: 'Plano Personal Elite', priceCents: 29990, role: 'PERSONAL' },
    // Planos para Academias
    { name: 'Plano Academia Essencial', priceCents: 9990, role: 'ACADEMIA' },
    { name: 'Plano Academia Destaque', priceCents: 24990, role: 'ACADEMIA' },
    { name: 'Plano Academia Elite', priceCents: 44990, role: 'ACADEMIA' },
    // Planos para Alunos
    { name: 'Plano Aluno Start', priceCents: 9990, role: 'STUDENT' },
    { name: 'Plano Aluno Plus', priceCents: 17990, role: 'STUDENT' },
  ];

  const createdPrices: Record<string, string> = {};

  for (const p of plansToCreate) {
    try {
      const product = await stripe.products.create({
        name: p.name,
        metadata: { roleCategory: p.role },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: p.priceCents,
        currency: 'brl',
        recurring: { interval: 'month' },
        metadata: { roleCategory: p.role, planName: p.name },
      });
      console.log(`✅ Criado: ${p.name} -> Price ID: ${price.id}`);
      createdPrices[p.name] = price.id;
    } catch (e: any) {
      console.error(`Erro ao criar ${p.name}:`, e.message);
    }
  }

  console.log('\n--- RESUMO DOS PRICE_IDS GERADOS ---');
  console.log(JSON.stringify(createdPrices, null, 2));

  await ds.destroy();
}

main().catch(console.error);
