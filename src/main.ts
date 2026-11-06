import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strips unknown fields not in my DTO
      forbidNonWhitelisted: true, // Returns 400 Bad Request if unknown fields are sent
      transform: true,            // Converts incoming JSON to DTO class instances
    }),
  );
     const port = process.env.PORT ?? 3000;
      await app.listen(port);
      console.log(` PetTrack Backend is running on: http://localhost:${port}`);

}
void bootstrap();
