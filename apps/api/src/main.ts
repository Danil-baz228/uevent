import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { mkdirSync } from 'fs';
import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(process.cwd(), 'apps', 'api', 'uploads');

  mkdirSync(uploadsPath, { recursive: true });
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.APP_ORIGIN?.split(',') ?? true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Uevent API')
    .setDescription('API scaffold for the Uevent platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
