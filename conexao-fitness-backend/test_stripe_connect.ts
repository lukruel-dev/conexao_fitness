import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

async function run() {
  console.log('--- TESTE 1: Recarga de Carteira (Finex Wallet Top-Up) ---');
  const topupIntent = await stripe.paymentIntents.create({
    amount: 10000, // R$ 100,00
    currency: 'brl',
    metadata: {
      purpose: 'WALLET_TOPUP',
      userId: 'user-aluno-teste-123',
    },
  });
  console.log('-> Sucesso! PaymentIntent de Recarga criado:', topupIntent.id);
  console.log('Client Secret disponível para o frontend:', topupIntent.client_secret ? 'SIM' : 'NÃO');

  console.log('\n--- TESTE 2: Nova Conta Connect para Personal Trainer ---');
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'BR',
    email: 'personal.pro@conexaofitness.com',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  console.log('-> Conta criada na Stripe:', account.id);

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: 'http://localhost:5173/perfil?stripe=refresh',
    return_url: 'http://localhost:5173/perfil?stripe=success',
    type: 'account_onboarding',
  });
  console.log('-> Link de Onboarding gerado para o personal:');
  console.log(link.url);
}

run().catch(console.error);
