import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'ecommerce',
    password: process.env.DB_PASSWORD || 'ecommerce',
    database: process.env.DB_NAME || 'ecommerce',
    autoLoadEntities: true,
    synchronize: false,
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    },
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
  };
}
