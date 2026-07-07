import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');
const todosFile = path.join(dataDir, 'todos.json');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const port = process.env.PORT || 3002;

const initialTodos = [
  { id: 'seed-react-study', userId: 'guest', text: 'React study', date: getToday(), done: false },
  { id: 'seed-blog-write', userId: 'guest', text: 'Write a blog post', date: getToday(), done: false },
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function ensureJsonFile(filePath, initialData) {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    await writeJsonFile(filePath, initialData);
  }
}

async function readJsonFile(filePath, initialData) {
  await ensureJsonFile(filePath, initialData);
  const fileContent = await readFile(filePath, 'utf8');
  return JSON.parse(fileContent);
}

async function writeJsonFile(filePath, data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

const readTodos = () => readJsonFile(todosFile, initialTodos);
const writeTodos = (todos) => writeJsonFile(todosFile, todos);
const readUsers = () => readJsonFile(usersFile, []);
const writeUsers = (users) => writeJsonFile(usersFile, users);
const readSessions = () => readJsonFile(sessionsFile, []);
const writeSessions = (sessions) => writeJsonFile(sessionsFile, sessions);

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : null);
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  response.end(JSON.stringify(data));
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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

function createSession(userId) {
  return {
    token: randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
  };
}

function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

async function findSessionUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const [sessions, users] = await Promise.all([readSessions(), readUsers()]);
  const session = sessions.find((item) => item.token === token);

  if (!session) {
    return null;
  }

  const user = users.find((item) => item.id === session.userId);
  return user ? { token, user } : null;
}

async function handleSignup(request, response) {
  const body = await readJsonBody(request);
  const name = String(body?.name || '').trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || '');

  if (name.length < 2 || !email.includes('@') || password.length < 4) {
    sendJson(response, 400, { message: 'Please check your name, email, and password.' });
    return;
  }

  const users = await readUsers();

  if (users.some((user) => user.email === email)) {
    sendJson(response, 409, { message: 'This email is already registered.' });
    return;
  }

  const user = {
    id: randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  const session = createSession(user.id);
  const sessions = await readSessions();

  await Promise.all([
    writeUsers([...users, user]),
    writeSessions([...sessions, session]),
  ]);
  sendJson(response, 201, { token: session.token, user: publicUser(user) });
}

async function handleLogin(request, response) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email);
  const passwordHash = hashPassword(String(body?.password || ''));
  const users = await readUsers();
  const user = users.find((item) => item.email === email && item.passwordHash === passwordHash);

  if (!user) {
    sendJson(response, 401, { message: 'Email or password is incorrect.' });
    return;
  }

  const sessions = await readSessions();
  const session = createSession(user.id);
  await writeSessions([...sessions, session]);
  sendJson(response, 200, { token: session.token, user: publicUser(user) });
}

async function handleSession(request, response) {
  const sessionUser = await findSessionUser(request);

  if (!sessionUser) {
    sendJson(response, 401, { message: 'Session expired.' });
    return;
  }

  sendJson(response, 200, {
    token: sessionUser.token,
    user: publicUser(sessionUser.user),
  });
}

async function handleLogout(request, response) {
  const token = getBearerToken(request);
  const sessions = await readSessions();
  await writeSessions(sessions.filter((session) => session.token !== token));
  sendJson(response, 200, { ok: true });
}

async function handleTodos(request, response) {
  const sessionUser = await findSessionUser(request);

  if (!sessionUser) {
    sendJson(response, 401, { message: 'Login is required.' });
    return;
  }

  const userId = sessionUser.user.id;

  if (request.method === 'GET') {
    const todos = await readTodos();
    sendJson(response, 200, todos.filter((todo) => todo.userId === userId));
    return;
  }

  if (request.method === 'PUT') {
    const nextUserTodos = await readJsonBody(request);

    if (!isTodoList(nextUserTodos) || nextUserTodos.some((todo) => todo.userId !== userId)) {
      sendJson(response, 400, { message: 'Invalid todo data' });
      return;
    }

    const todos = await readTodos();
    const otherTodos = todos.filter((todo) => todo.userId !== userId);
    const nextTodos = [...otherTodos, ...nextUserTodos];
    await writeTodos(nextTodos);
    sendJson(response, 200, nextUserTodos);
    return;
  }

  sendJson(response, 405, { message: 'Method not allowed' });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    response.end();
    return;
  }

  try {
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      await handleSignup(request, response);
      return;
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      await handleLogin(request, response);
      return;
    }

    if (url.pathname === '/api/session' && request.method === 'GET') {
      await handleSession(request, response);
      return;
    }

    if (url.pathname === '/api/logout' && request.method === 'POST') {
      await handleLogout(request, response);
      return;
    }

    if (url.pathname === '/api/todos') {
      await handleTodos(request, response);
      return;
    }

    sendJson(response, 404, { message: 'Not found' });
  } catch (error) {
    console.error(error);
    sendJson(response, 500, { message: 'Server error' });
  }
});

server.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});
