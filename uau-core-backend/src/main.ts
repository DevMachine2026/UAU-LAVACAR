import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas (ex: /api/v1/auth/login)
  app.setGlobalPrefix('api/v1');

  // CORS deve vir antes do helmet para garantir os headers corretos
  const rawOrigins = process.env.ALLOWED_ORIGINS;
  const corsOrigin = rawOrigins
    ? rawOrigins.trim() === '*'
      ? '*'
      : rawOrigins.split(',').map((o) => o.trim())
    : '*';
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: false,
  });

  // Segurança básica
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Interceptor e Filtro globais (garantem o padrão de resposta do UAU+)
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger (A documentação interativa da API)
  if (process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('UAU+ API')
      .setDescription('A API oficial do UAU+ Lavacar')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API rodando na porta ${port}`);
}
bootstrap();
