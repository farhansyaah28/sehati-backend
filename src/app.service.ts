import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      message: 'SEHATI Backend is running',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        name: 'SEHATI - Sekolah Hijau dan Anti Plastik',
      },
    };
  }
}
