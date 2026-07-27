const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const vn = await p.query("SELECT id, title, status, ia_enabled, ia_persona IS NOT NULL as has_persona FROM visual_novels WHERE title = 'Código Neon'");
  console.log('VN:', vn.rows[0]);
  const ch = await p.query('SELECT id, title, order_index, status FROM chapters WHERE vn_id = $1 ORDER BY order_index', [vn.rows[0].id]);
  console.log('Chapters:', ch.rows.length);
  const sc = await p.query('SELECT count(*) as cnt FROM scenes WHERE chapter_id IN (SELECT id FROM chapters WHERE vn_id = $1)', [vn.rows[0].id]);
  console.log('Scenes:', sc.rows[0].cnt);
  const co = await p.query('SELECT count(*) as cnt FROM choices WHERE scene_id IN (SELECT id FROM scenes WHERE chapter_id IN (SELECT id FROM chapters WHERE vn_id = $1))', [vn.rows[0].id]);
  console.log('Choices:', co.rows[0].cnt);
  const cc = await p.query('SELECT count(*) as cnt FROM choice_conditions');
  console.log('Conditions:', cc.rows[0].cnt);
  const ce = await p.query('SELECT count(*) as cnt FROM choice_effects');
  console.log('Effects:', ce.rows[0].cnt);
  await p.end();
})().catch(e => { console.error(e.message); process.exit(1); });
