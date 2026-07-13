import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
