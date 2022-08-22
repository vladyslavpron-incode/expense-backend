import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Config } from './utils/config';
// import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<Config, true>);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Expense backend')
    .setDescription(
      'REST API for expense tracking.<br>In this api default users can access only theirs data, but Administrators can access and mutate other users data',
    )
    .addTag(
      'Categories',
      'Endpoints to manage categories.<br>Notice that there is special category "Other" you can not mutate, but you still can manage transactions on this category, also this category has id: 0 for every user and can not be accessed by anyone except exact owner',
    )
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.get<string>('PORT'));
}
bootstrap();
