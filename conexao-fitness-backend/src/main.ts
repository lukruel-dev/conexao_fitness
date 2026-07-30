import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Middleware para suporte ao Private Network Access (PNA)
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  app.enableCors({
    origin: [
      /\.lovableproject\.com$/,
      /\.lovable\.app$/,
      /\.trycloudflare\.com$/,
      "http://localhost:5173",
      "http://localhost:8080",
      "http://192.168.1.8",
      "http://192.168.1.8:5173",
      "http://192.168.1.8:8081",
      /\.exp\.direct$/,
      '*' // Em ambiente de desenvolvimento local (reunião) é seguro deixar aberto
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Conexão Fitness API')
    .setDescription(
      'API oficial do marketplace Conexão Fitness para Alunos, Personais e Academias.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Conexão Fitness API running on port ${port}`);
}
bootstrap();