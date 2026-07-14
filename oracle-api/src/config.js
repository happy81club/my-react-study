class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
    this.code = 'CONFIG_MISSING';
  }
}

function requireValue(env, name) {
  const value = String(env[name] || '').trim();

  if (!value || value.startsWith('your_')) {
    throw new ConfigurationError(`${name} 환경변수가 설정되지 않았습니다.`);
  }

  return value;
}

function getOracleConfig(env = process.env) {
  const connectString = requireValue(env, 'ORACLE_CONNECT_STRING');

  if (!/tcps/i.test(connectString)) {
    throw new ConfigurationError('학습용 원격 연결은 암호화된 TCPS 접속 문자열을 사용해 주세요.');
  }

  return {
    user: requireValue(env, 'ORACLE_USER'),
    password: requireValue(env, 'ORACLE_PASSWORD'),
    connectString,
    poolMin: 0,
    poolMax: 2,
    poolIncrement: 1,
    poolTimeout: 60,
    queueTimeout: 10000,
  };
}

function getAllowedOrigins(env = process.env) {
  return String(env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export { ConfigurationError, getAllowedOrigins, getOracleConfig };
