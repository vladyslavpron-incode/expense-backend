import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Expense backend')
    .setDescription('REST API for expense tracking')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const schemas = validationMetadatasToSchemas();

  if (document.components) {
    document.components.schemas = schemas;
  }

  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
