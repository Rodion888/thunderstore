import pg from 'pg';

const pool = new pg.Pool({
  user: process.env.PGUSER || 'rodion',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'thunder_store_db',
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT) || 5432,
});

export default pool;
