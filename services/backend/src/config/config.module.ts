import { Module, Global } from '@nestjs/common';
import { getAppConfig } from './app.config';

@Global()
@Module({
  providers: [
    {
      provide: 'APP_CONFIG',
      useFactory: () => getAppConfig(),
    },
  ],
  exports: ['APP_CONFIG'],
})
export class ConfigModule {}
