import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}
//Original root route (GET http://localhost:3000
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  //Health check route (GET http://localhost:3000/health
  @Get('health')
  getHealthCheck() {
    // Mongoose connection state numbers:
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: 'ok',
      project: 'PetTrack – Pet Health Management System',
      database: states[this.mongoConnection.readyState] || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}
