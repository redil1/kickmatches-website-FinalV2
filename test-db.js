// Simple database test script
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://kickai:kickai@localhost:5433/kickai_matches'
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    const result = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.position,
        p.jersey_number,
        tp.rating,
        tp.event_id,
        tp.payload
      FROM trending_players tp
      JOIN players p ON tp.player_id = p.id
      ORDER BY tp.rating DESC
      LIMIT 3
    `);

    console.log('Query successful, found', result.rows.length, 'players');
    if (result.rows.length > 0) {
      console.log('Sample data:', JSON.stringify(result.rows[0], null, 2));
    }

    await pool.end();
  } catch (error) {
    console.error('Database test failed:', error);
    await pool.end();
  }
}

testDatabase();
