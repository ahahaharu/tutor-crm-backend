import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgres://${process.env.DB_USER!}:${process.env.DB_PASSWORD!}@127.0.0.1:5433/${process.env.DB_NAME!}`,
  },
  verbose: true,
  strict: true,
});
