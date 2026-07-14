import assert from 'node:assert/strict';
import test from 'node:test';
import { createOracleRepository, USERS_SQL } from '../src/oracle.js';

test('USERS 조회는 PASSWORD 컬럼을 요청하지 않고 연결을 반환한다', async () => {
  const executedSql = [];
  let connectionClosed = false;
  const connection = {
    async execute(sql) {
      executedSql.push(sql);
      return {
        rows: [{ USER_NO: 1, EMAIL: 'learner@example.com', JOIN_DATE: '2026-07-14' }],
      };
    },
    async close() {
      connectionClosed = true;
    },
  };
  const driver = {
    OUT_FORMAT_OBJECT: 4002,
    async createPool() {
      return {
        async getConnection() {
          return connection;
        },
        async close() {},
      };
    },
  };
  const repository = createOracleRepository(driver, {
    user: 'test',
    password: 'secret',
    connectString: 'tcps://example.com/service',
  });

  const users = await repository.getUsers();

  assert.equal(users.length, 1);
  assert.equal(users[0].EMAIL, 'learner@example.com');
  assert.equal(connectionClosed, true);
  assert.equal(executedSql.length, 1);
  assert.equal(/PASSWORD/i.test(USERS_SQL), false);
});
