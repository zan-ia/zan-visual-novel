import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };
