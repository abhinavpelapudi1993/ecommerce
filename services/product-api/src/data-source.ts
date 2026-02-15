import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'ecommerce',
  password: process.env.DB_PASSWORD || 'ecommerce',
  database: process.env.DB_NAME || 'ecommerce',
  migrations: ['dist/migrations/*.js'],
});
