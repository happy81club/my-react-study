const USERS_KEY = 'users';
const SESSIONS_KEY = 'sessions';
const TODOS_KEY = 'todos';
const WORDS_KEY = 'words';
const SESSION_DURATION_MS = 30 * 60 * 1000;

function getStore(env) {
  return env.TODO_KV;
}

function requireStore(env) {
  const store = getStore(env);

  if (!store) {
    throw new Error('TODO_KV binding is missing');
  }

  return store;
}

async function readList(env, key) {
  const store = requireStore(env);
  const value = await store.get(key, 'json');
  return Array.isArray(value) ? value : [];
}

async function writeList(env, key, value) {
  const store = requireStore(env);
  await store.put(key, JSON.stringify(value));
}

async function readUsers(env) {
  return readList(env, USERS_KEY);
}

async function writeUsers(env, users) {
  await writeList(env, USERS_KEY, users);
}

async function readSessions(env) {
  return readList(env, SESSIONS_KEY);
}

async function writeSessions(env, sessions) {
  await writeList(env, SESSIONS_KEY, sessions);
}

async function readTodos(env) {
  return readList(env, TODOS_KEY);
}

async function writeTodos(env, todos) {
  await writeList(env, TODOS_KEY, todos);
}

async function readWords(env) {
  return readList(env, WORDS_KEY);
}

async function writeWords(env, words) {
  await writeList(env, WORDS_KEY, words);
}

function sendJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createSession(userId) {
  const createdAt = new Date();

  return {
    token: crypto.randomUUID(),
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SESSION_DURATION_MS).toISOString(),
  };
}

function getSessionExpiration(session) {
  const expiresAt = Date.parse(session.expiresAt);

  if (Number.isFinite(expiresAt)) {
    return expiresAt;
  }

  const createdAt = Date.parse(session.createdAt);
  return Number.isFinite(createdAt) ? createdAt + SESSION_DURATION_MS : 0;
}

async function extendSession(env, token) {
  const sessions = await readSessions(env);
  const sessionIndex = sessions.findIndex((item) => item.token === token);

  if (sessionIndex < 0 || getSessionExpiration(sessions[sessionIndex]) <= Date.now()) {
    return null;
  }

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await writeSessions(env, sessions.map((session, index) => (
    index === sessionIndex ? { ...session, expiresAt } : session
  )));
  return expiresAt;
}

function getBearerToken(request) {
  const authorization = request.headers.get('Authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function findSessionUser(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const [sessions, users] = await Promise.all([readSessions(env), readUsers(env)]);
  const session = sessions.find((item) => item.token === token);

  if (!session || getSessionExpiration(session) <= Date.now()) {
    return null;
  }

  const user = users.find((item) => item.id === session.userId);
  return user
    ? { token, user, expiresAt: new Date(getSessionExpiration(session)).toISOString() }
    : null;
}

function isTodoList(value) {
  return Array.isArray(value) && value.every((todo) => (
    todo
    && typeof todo.id === 'string'
    && typeof todo.userId === 'string'
    && typeof todo.text === 'string'
    && typeof todo.date === 'string'
    && typeof todo.done === 'boolean'
  ));
}

function isWordList(value) {
  return Array.isArray(value) && value.every((word) => (
    word
    && typeof word.id === 'string'
    && typeof word.userId === 'string'
    && typeof word.english === 'string'
    && typeof word.korean === 'string'
    && typeof word.date === 'string'
  ));
}

function handleError(error) {
  if (error.message === 'TODO_KV binding is missing') {
    return sendJson({ message: 'Cloudflare KV binding TODO_KV is missing.' }, 500);
  }

  console.error(error);
  return sendJson({ message: 'Server error' }, 500);
}

export {
  createSession,
  extendSession,
  findSessionUser,
  getBearerToken,
  handleError,
  hashPassword,
  isTodoList,
  isWordList,
  normalizeEmail,
  publicUser,
  readJson,
  readSessions,
  readTodos,
  readUsers,
  readWords,
  sendJson,
  writeSessions,
  writeTodos,
  writeUsers,
  writeWords,
};
