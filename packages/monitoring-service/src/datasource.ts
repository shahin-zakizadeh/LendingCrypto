import { DataSource } from 'typeorm';
import 'dotenv/config';
import { migrations } from '../migrations';
import { entities } from './entities';

const timescaleDb = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  migrations: migrations,
  entities: entities,
});
export default timescaleDb;
