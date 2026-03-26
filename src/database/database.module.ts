import 'dotenv/config';
import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: () => {
        const pool = new Pool({
          connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@127.0.0.1:5433/${process.env.DB_NAME}`,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
