import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { UPLOADS_ROOT, WEB_DIST_ROOT, WEB_INDEX_PATH } from './utils/paths';

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  mkdirSync(UPLOADS_ROOT, { recursive: true });
  app.useStaticAssets(UPLOADS_ROOT, {
    prefix: '/uploads',
  });

  if (existsSync(WEB_INDEX_PATH)) {
    app.useStaticAssets(WEB_DIST_ROOT, {
      index: false,
    });

    const expressApp = app.getHttpAdapter().getInstance();

    expressApp.get('*', (req: any, res: any, next: () => void) => {
      const acceptHeader = req.headers.accept;

      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/uploads') ||
        extname(req.path) ||
        typeof acceptHeader !== 'string' ||
        !acceptHeader.includes('text/html')
      ) {
        next();
        return;
      }

      res.sendFile(WEB_INDEX_PATH);
    });
  }

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
