const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const r = await p.query("SELECT id, title FROM visual_novels WHERE title = 'Código Neon'");
  for (const v of r.rows) {
    await p.query('DELETE FROM visual_novels WHERE id = $1', [v.id]);
    console.log('Deleted:', v.title, v.id);
  }
  if (!r.rows.length) console.log('Nothing to clean');
  await p.end();
})().catch(e => { console.error(e.message); process.exit(1); });
