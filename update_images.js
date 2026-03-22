require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function update() {
  for (let i = 1; i <= 10; i++) {
    await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [`/images/${i}.jpeg`, i]);
    console.log(`Updated product ${i}`);
  }
  console.log('All done!');
  process.exit(0);
}
update().catch(e => { console.error(e); process.exit(1); });
