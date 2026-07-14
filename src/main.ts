import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('StockSavvy API')
    .setDescription('AI-Powered Inventory Management Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip properties not in the DTO
      forbidNonWhitelisted: true, // throw if unknown properties sent
      transform: true,        // auto-cast types + run @Transform decorators
      transformOptions: {
        enableImplicitConversion: true, // convert "123" -> 123 for @IsNumber fields
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
