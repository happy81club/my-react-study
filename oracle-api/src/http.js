function sendJson(response, status, data, origin = '') {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };

  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }

  response.writeHead(status, headers);
  response.end(JSON.stringify(data));
}

function createRequestHandler({ getRepository, allowedOrigins, logger = console }) {
  return async function requestHandler(request, response) {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const requestOrigin = String(request.headers.origin || '').replace(/\/$/, '');
    const allowedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : '';

    if (requestOrigin && !allowedOrigin) {
      sendJson(response, 403, { message: '허용되지 않은 요청 출처입니다.' });
      return;
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      });
      response.end();
      return;
    }

    if (request.method !== 'GET') {
      sendJson(response, 405, { message: 'Method not allowed' }, allowedOrigin);
      return;
    }

    if (url.pathname === '/health') {
      sendJson(response, 200, { ok: true, service: 'oracle-api' }, allowedOrigin);
      return;
    }

    try {
      const repository = getRepository();

      if (url.pathname === '/api/oracle/test') {
        await repository.testConnection();
        sendJson(response, 200, {
          ok: true,
          message: 'FreeSQL Oracle TCPS 연결에 성공했습니다.',
        }, allowedOrigin);
        return;
      }

      if (url.pathname === '/api/oracle/users') {
        const users = await repository.getUsers();
        sendJson(response, 200, {
          ok: true,
          count: users.length,
          users,
        }, allowedOrigin);
        return;
      }
    } catch (error) {
      logger.error(error);
      const isConfigurationError = error?.code === 'CONFIG_MISSING';
      sendJson(response, isConfigurationError ? 503 : 502, {
        ok: false,
        code: isConfigurationError ? 'CONFIG_MISSING' : 'ORACLE_QUERY_FAILED',
        message: isConfigurationError
          ? error.message
          : 'FreeSQL Oracle 조회에 실패했습니다. Render 로그를 확인해 주세요.',
      }, allowedOrigin);
      return;
    }

    sendJson(response, 404, { message: 'Not found' }, allowedOrigin);
  };
}

export { createRequestHandler };
