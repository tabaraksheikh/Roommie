async function ensureColumn(db, tableName, columnName, alterSql) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = ?
        AND COLUMN_NAME  = ?`,
    [tableName, columnName]
  );
  if (rows[0].cnt === 0) {
    await db.query(alterSql);
  }
}

async function ensureIndex(db, tableName, indexName, alterSql) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = ?
        AND INDEX_NAME   = ?`,
    [tableName, indexName]
  );
  if (rows[0].cnt === 0) {
    await db.query(alterSql);
  }
}

async function ensureForeignKey(db, tableName, columnName, alterSql) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA            = DATABASE()
        AND TABLE_NAME              = ?
        AND COLUMN_NAME             = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [tableName, columnName]
  );
  if (rows[0].cnt === 0) {
    await db.query(alterSql);
  }
}

async function getTableColumns(db, tableName) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME   = ?`,
    [tableName]
  );
  return new Set(rows.map((row) => row.COLUMN_NAME));
}

async function getExistingTables(db) {
  const [rows] = await db.query(
    `SELECT TABLE_NAME
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()`
  );
  return new Set(rows.map((row) => row.TABLE_NAME));
}

module.exports = {
  ensureColumn,
  ensureForeignKey,
  ensureIndex,
  getExistingTables,
  getTableColumns,
};
