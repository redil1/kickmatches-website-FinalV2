const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://kickai:kickai@localhost:5433/kickai_matches'
});
async function run() {
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM matches');
    console.log('Match count:', res.rows[0].count);
    
    const recent = await client.query('SELECT slug, kickoff_iso FROM matches ORDER BY created_at DESC LIMIT 5');
    console.log('Recent matches:', recent.rows);
    
    await client.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
