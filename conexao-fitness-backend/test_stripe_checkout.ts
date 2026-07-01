import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PaymentsService } from './src/modules/payments/payments.service';
import { User } from './src/modules/users/entities/user.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const paymentsService = app.get(PaymentsService);

  console.log('1. Buscando um usuário Profissional para testar...');
  const userRepo = dataSource.getRepository(User);
  const provider = await userRepo.findOne({ where: { role: 'PERSONAL' } });

  if (!provider) {
    console.log('Erro: Nenhum usuário PERSONAL encontrado no banco.');
    process.exit(1);
  }
  console.log(`Profissional escolhido: ${provider.name} (ID: ${provider.id})`);

  console.log('\n2. Criando Produto e Preço no Stripe (Plano Premium)...');
  const product = await paymentsService.stripe.products.create({
    name: 'Plano Premium - Conexão Fitness',
    description: 'Destaque nos resultados de busca',
  });

  const price = await paymentsService.stripe.prices.create({
    product: product.id,
    unit_amount: 4990, // R$ 49,90
    currency: 'brl',
    recurring: {
      interval: 'month',
    },
  });
  console.log(`Preço criado com sucesso: ${price.id}`);

  console.log('\n3. Gerando Sessão de Checkout (Link de Pagamento)...');
  const checkout = await paymentsService.createSubscriptionCheckout(provider.id, price.id);
  
  console.log('\n======================================================');
  console.log('Tudo pronto! Clique no link abaixo para pagar:');
  console.log('👉', checkout.checkoutUrl);
  console.log('======================================================\n');
  console.log('DICA: Use o cartão de teste do Stripe: 4242 4242 4242 4242');
  console.log('Vencimento: qualquer data futura (ex: 12/28)');
  console.log('CVC: qualquer número de 3 dígitos (ex: 123)');

  await app.close();
}

bootstrap().catch(console.error);
