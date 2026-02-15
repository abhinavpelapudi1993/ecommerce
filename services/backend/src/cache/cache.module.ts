import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { createRedisClient } from '../config/redis.config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => createRedisClient(),
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
