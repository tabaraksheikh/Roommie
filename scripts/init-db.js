require('dotenv').config();
const { closeDb, initDatabase } = require('../backend/config/db');

async function main() {
  await initDatabase();
}

main()
  .then(async () => {
    await closeDb();
    console.log('[OK] Database schema is initialized');
  })
  .catch(async (err) => {
    try {
      await closeDb();
    } catch {}
    const detail = err.message || err.code || 'Unknown database error';
    console.error(`[ERROR] Database initialization failed: ${detail}`);
    process.exit(1);
  });
