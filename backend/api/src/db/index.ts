import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { initCascadeRefs } from './cascade-references.js';

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    _pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    _db = drizzle(_pool, { schema });
    // Initialize cascade-references with the same pool
    initCascadeRefs(_pool);
  }
  return _db;
}

export { schema };
