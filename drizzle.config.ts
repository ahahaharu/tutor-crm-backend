import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

if (!process.env.DB_NAME) {
  dotenv.config();
}

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '5433';

const dbUrl = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${host}:${port}/${process.env.DB_NAME}?sslmode=require`;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
