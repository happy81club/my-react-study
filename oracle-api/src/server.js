import { createServer } from 'node:http';
import oracledb from 'oracledb';
import { getAllowedOrigins, getOracleConfig } from './config.js';
import { createRequestHandler } from './http.js';
import { createOracleRepository } from './oracle.js';

const port = Number(process.env.PORT || 10000);
let repository;

const getRepository = () => {
  if (!repository) {
    repository = createOracleRepository(oracledb, getOracleConfig());
  }

  return repository;
};

const server = createServer(createRequestHandler({
  getRepository,
  allowedOrigins: getAllowedOrigins(),
}));

server.listen(port, '0.0.0.0', () => {
  console.log(`Oracle API listening on http://0.0.0.0:${port}`);
});

async function shutdown() {
  server.close();

  if (repository) {
    await repository.close().catch(console.error);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
