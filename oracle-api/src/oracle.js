const CONNECTION_TEST_SQL = 'SELECT 1 AS VALUE FROM DUAL';
const USERS_SQL = `
  SELECT USER_NO, EMAIL, JOIN_DATE
  FROM USERS
  ORDER BY USER_NO
  FETCH FIRST 10 ROWS ONLY
`;

function createOracleRepository(oracledb, config) {
  let poolPromise;

  async function getPool() {
    if (!poolPromise) {
      poolPromise = oracledb.createPool(config).catch((error) => {
        poolPromise = undefined;
        throw error;
      });
    }

    return poolPromise;
  }

  async function execute(sql) {
    const pool = await getPool();
    const connection = await pool.getConnection();

    try {
      connection.callTimeout = 10000;
      return await connection.execute(sql, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
    } finally {
      await connection.close();
    }
  }

  return {
    async testConnection() {
      const result = await execute(CONNECTION_TEST_SQL);
      return result.rows?.[0] || { VALUE: 1 };
    },

    async getUsers() {
      const result = await execute(USERS_SQL);
      return Array.isArray(result.rows) ? result.rows : [];
    },

    async close() {
      if (!poolPromise) {
        return;
      }

      const pool = await poolPromise;
      await pool.close(5);
      poolPromise = undefined;
    },
  };
}

export { CONNECTION_TEST_SQL, createOracleRepository, USERS_SQL };
