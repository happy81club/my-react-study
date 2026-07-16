import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 로컬 개발용 API 서버는 별도 DB 없이 data 폴더의 JSON 파일을 작은 저장소처럼 사용한다.
// __dirname은 server 폴더이므로, 프로젝트 루트의 data 폴더를 기준 경로로 잡는다.
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.resolve(projectRoot, 'data');
const todosFile = path.join(dataDir, 'todos.json');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const wordsFile = path.join(dataDir, 'words.json');
const travelPlacesFile = path.join(dataDir, 'travel-places.json');
const port = process.env.PORT || 3002;
const SESSION_DURATION_MS = 30 * 60 * 1000;
const TEMPORARY_PASSWORD = '1234';

async function loadLocalEnv() {
  try {
    const envText = await readFile(path.join(projectRoot, '.env'), 'utf8');

    envText.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex < 0) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, '');

      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('.env 파일을 읽지 못했습니다.', error);
    }
  }
}

await loadLocalEnv();

// todos.json 파일이 아직 없을 때 넣을 기본 데이터.
// 로그인 기능이 생긴 뒤에는 실제 화면에서 사용자별 데이터만 필터링해서 내려준다.
const initialTodos = [
  { id: 'seed-react-study', userId: 'guest', text: 'React study', date: getToday(), done: false },
  { id: 'seed-blog-write', userId: 'guest', text: 'Write a blog post', date: getToday(), done: false },
];

// 프론트엔드와 서버가 같은 날짜 포맷으로 비교할 수 있도록 YYYY-MM-DD 문자열을 만든다.
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 데모용 비밀번호 해시 함수.
// 실제 서비스라면 salt와 bcrypt/argon2 같은 전용 비밀번호 해시 알고리즘을 사용하는 편이 안전하다.
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// JSON 파일을 읽기 전에 data 폴더와 대상 파일이 존재하는지 보장한다.
// 파일이 없을 때만 initialData로 새 파일을 만들고, 그 외 파일 시스템 오류는 그대로 던진다.
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

// JSON 파일 읽기 공통 함수.
// 호출하는 쪽에서는 todos/users/sessions 중 무엇을 읽는지만 래퍼 함수로 구분한다.
async function readJsonFile(filePath, initialData) {
  await ensureJsonFile(filePath, initialData);
  const fileContent = await readFile(filePath, 'utf8');
  return JSON.parse(fileContent);
}

// JSON 파일 쓰기 공통 함수.
// 사람이 직접 열어 확인하기 쉽도록 들여쓰기 2칸으로 저장한다.
async function writeJsonFile(filePath, data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

// 파일별 읽기/쓰기 함수를 짧게 감싼다.
// 이 덕분에 핸들러에서는 파일 경로를 직접 알 필요 없이 도메인 데이터만 다룬다.
const readTodos = () => readJsonFile(todosFile, initialTodos);
const writeTodos = (todos) => writeJsonFile(todosFile, todos);
const readUsers = () => readJsonFile(usersFile, []);
const writeUsers = (users) => writeJsonFile(usersFile, users);
const readSessions = () => readJsonFile(sessionsFile, []);
const writeSessions = (sessions) => writeJsonFile(sessionsFile, sessions);
const readWords = () => readJsonFile(wordsFile, []);
const writeWords = (words) => writeJsonFile(wordsFile, words);
const readTravelPlaces = () => readJsonFile(travelPlacesFile, []);
const writeTravelPlaces = (places) => writeJsonFile(travelPlacesFile, places);

// Node 기본 http 서버는 Express처럼 body 파싱을 자동으로 해주지 않는다.
// 요청 스트림을 끝까지 모은 뒤 JSON으로 파싱해서 핸들러가 사용할 객체로 돌려준다.
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

// 모든 API 응답을 JSON으로 통일하고, 개발 서버/배포 환경에서 호출할 수 있도록 CORS 헤더를 함께 붙인다.
function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  response.end(JSON.stringify(data));
}

// 클라이언트로 내려보낼 사용자 정보.
// passwordHash처럼 화면에 필요 없고 노출되면 안 되는 값은 여기서 제거한다.
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

// 이메일은 대소문자와 앞뒤 공백 때문에 중복 계정이 생기기 쉬워서 저장/비교 전에 정규화한다.
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// 프론트엔드가 보낸 투두 목록이 서버가 저장할 수 있는 최소 구조를 갖췄는지 확인한다.
// PUT 요청은 전체 사용자 투두 목록을 통째로 교체하므로, 잘못된 형태를 미리 거른다.
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

function normalizePlaceInput(value) {
  const tags = Array.isArray(value?.tags)
    ? value.tags
    : String(value?.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  return {
    title: String(value?.title || '').trim(),
    category: ['restaurant', 'travel'].includes(value?.category) ? value.category : 'restaurant',
    region: String(value?.region || '').trim(),
    district: String(value?.district || '').trim(),
    address: String(value?.address || '').trim(),
    memo: String(value?.memo || '').trim(),
    tags: tags.slice(0, 6),
    isPublic: Boolean(value?.isPublic),
    isAuthorPublic: Boolean(value?.isPublic && value?.isAuthorPublic),
  };
}

function publicTravelPlace(place) {
  return {
    id: place.id,
    userId: place.userId,
    authorName: place.isAuthorPublic ? place.authorName : '',
    title: place.title,
    category: place.category,
    region: place.region,
    district: place.district,
    address: place.address,
    memo: place.memo,
    tags: place.tags,
    isPublic: place.isPublic,
    isAuthorPublic: Boolean(place.isAuthorPublic),
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
  };
}

// 로그인 성공 시 sessions.json에 저장할 세션 객체를 만든다.
// token은 이후 Authorization: Bearer <token> 헤더로 들어오며, userId로 실제 사용자를 찾는다.
function createSession(userId) {
  const createdAt = new Date();

  return {
    token: randomUUID(),
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SESSION_DURATION_MS).toISOString(),
  };
}

function createTemporaryPassword() {
  return TEMPORARY_PASSWORD;
}

async function sendTemporaryPasswordEmail(email, temporaryPassword) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM;

  if (!apiKey || !from || apiKey.startsWith('your_') || from.includes('example.com')) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  const mailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      from,
      to: email,
      subject: '새 임시 비밀번호 안내',
      text: `요청하신 임시 비밀번호입니다.\n\n${temporaryPassword}\n\n로그인 후 설정에서 새 비밀번호로 변경해 주세요.`,
    }),
  }).finally(() => clearTimeout(timeout));

  return mailResponse.ok;
}

function getSessionExpiration(session) {
  const expiresAt = Date.parse(session.expiresAt);

  if (Number.isFinite(expiresAt)) {
    return expiresAt;
  }

  const createdAt = Date.parse(session.createdAt);
  return Number.isFinite(createdAt) ? createdAt + SESSION_DURATION_MS : 0;
}

async function extendSession(token) {
  const sessions = await readSessions();
  const sessionIndex = sessions.findIndex((item) => item.token === token);

  if (sessionIndex < 0 || getSessionExpiration(sessions[sessionIndex]) <= Date.now()) {
    return null;
  }

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await writeSessions(sessions.map((session, index) => (
    index === sessionIndex ? { ...session, expiresAt } : session
  )));
  return expiresAt;
}

// Authorization 헤더에서 Bearer 토큰만 꺼낸다.
// 헤더가 없거나 형식이 다르면 빈 문자열을 반환해서 인증 실패로 처리된다.
function getBearerToken(request) {
  const authorization = request.headers.authorization || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

// 요청에 담긴 토큰으로 현재 로그인 사용자를 찾는다.
// 세션과 사용자 파일을 동시에 읽고, 토큰이 유효할 때만 { token, user } 형태로 돌려준다.
async function findSessionUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const [sessions, users] = await Promise.all([readSessions(), readUsers()]);
  const session = sessions.find((item) => item.token === token);

  if (!session || getSessionExpiration(session) <= Date.now()) {
    return null;
  }

  const user = users.find((item) => item.id === session.userId);
  return user
    ? { token, user, expiresAt: new Date(getSessionExpiration(session)).toISOString() }
    : null;
}

// POST /api/signup
// 회원가입 요청을 검증하고, 새 사용자와 첫 로그인 세션을 함께 저장한다.
async function handleSignup(request, response) {
  const body = await readJsonBody(request);
  const name = String(body?.name || '').trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || '');

  // 프론트엔드 검증을 우회한 요청도 있을 수 있으므로 서버에서도 최소 조건을 다시 확인한다.
  if (name.length < 2 || !email.includes('@') || password.length < 4) {
    sendJson(response, 400, { message: 'Please check your name, email, and password.' });
    return;
  }

  const users = await readUsers();

  // 이메일은 로그인 ID 역할을 하므로 중복을 허용하지 않는다.
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

  // 사용자 생성과 세션 생성을 한 번의 응답 흐름에서 처리해서 가입 직후 바로 로그인 상태가 되게 한다.
  await Promise.all([
    writeUsers([...users, user]),
    writeSessions([...sessions, session]),
  ]);
  sendJson(response, 201, {
    token: session.token,
    user: publicUser(user),
    expiresAt: session.expiresAt,
  });
}

// POST /api/login
// 테스트 버전에서는 가입된 이메일만 확인하고 새 세션 토큰을 발급한다.
async function handleLogin(request, response) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email);
  const users = await readUsers();
  const user = users.find((item) => item.email === email);

  if (!user) {
    sendJson(response, 401, { message: '가입된 이메일을 확인해 주세요.' });
    return;
  }

  const sessions = await readSessions();
  const session = createSession(user.id);
  await writeSessions([...sessions, session]);
  sendJson(response, 200, {
    token: session.token,
    user: publicUser(user),
    expiresAt: session.expiresAt,
  });
}

async function handlePasswordReset(request, response) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body?.email);

  if (!email.includes('@')) {
    sendJson(response, 400, { message: '이메일을 확인해 주세요.' });
    return;
  }

  const [users, sessions] = await Promise.all([readUsers(), readSessions()]);
  const user = users.find((item) => item.email === email);

  if (!user) {
    sendJson(response, 200, {
      ok: true,
      message: '가입된 이메일이면 새 임시 비밀번호를 보내드립니다.',
    });
    return;
  }

  const temporaryPassword = createTemporaryPassword();
  const nextUsers = users.map((item) => (
    item.id === user.id
      ? { ...item, passwordHash: hashPassword(temporaryPassword), passwordUpdatedAt: new Date().toISOString() }
      : item
  ));
  const nextSessions = sessions.filter((session) => session.userId !== user.id);

  await Promise.all([
    writeUsers(nextUsers),
    writeSessions(nextSessions),
  ]);

  const mailed = await sendTemporaryPasswordEmail(email, temporaryPassword);

  if (!mailed) {
    console.info(`[password-reset] ${email} temporary password: ${temporaryPassword}`);
  }

  sendJson(response, 200, {
    ok: true,
    mailed,
    temporaryPassword,
    message: mailed
      ? '새 임시 비밀번호를 이메일로 보냈습니다.'
      : '비밀번호가 1234로 초기화되었습니다. 로그인 후 설정에서 변경해 주세요.',
  });
}

async function handlePasswordChange(request, response) {
  const sessionUser = await findSessionUser(request);

  if (!sessionUser) {
    sendJson(response, 401, { message: '로그인이 필요합니다.' });
    return;
  }

  const body = await readJsonBody(request);
  const currentPassword = String(body?.currentPassword || '');
  const nextPassword = String(body?.nextPassword || '');

  if (nextPassword.length < 4) {
    sendJson(response, 400, { message: '새 비밀번호는 4자 이상으로 입력해 주세요.' });
    return;
  }

  if (hashPassword(currentPassword) !== sessionUser.user.passwordHash) {
    sendJson(response, 400, { message: '현재 비밀번호가 맞지 않습니다.' });
    return;
  }

  const [users, sessions] = await Promise.all([readUsers(), readSessions()]);
  const nextUsers = users.map((user) => (
    user.id === sessionUser.user.id
      ? { ...user, passwordHash: hashPassword(nextPassword), passwordUpdatedAt: new Date().toISOString() }
      : user
  ));
  const nextSessions = sessions.filter((session) => (
    session.userId !== sessionUser.user.id || session.token === sessionUser.token
  ));

  await Promise.all([
    writeUsers(nextUsers),
    writeSessions(nextSessions),
  ]);

  sendJson(response, 200, { ok: true, message: '비밀번호가 변경되었습니다.' });
}

// GET /api/session
// 새로고침 후에도 localStorage에 저장된 토큰이 아직 유효한지 확인하는 엔드포인트.
async function handleSession(request, response) {
  const sessionUser = await findSessionUser(request);

  if (!sessionUser) {
    sendJson(response, 401, { message: 'Session expired.' });
    return;
  }

  const expiresAt = await extendSession(sessionUser.token);

  sendJson(response, 200, {
    token: sessionUser.token,
    user: publicUser(sessionUser.user),
    expiresAt,
  });
}

// POST /api/logout
// 현재 토큰을 sessions.json에서 제거해서 이후 같은 토큰으로 API를 호출할 수 없게 한다.
async function handleLogout(request, response) {
  const token = getBearerToken(request);
  const sessions = await readSessions();
  await writeSessions(sessions.filter((session) => session.token !== token));
  sendJson(response, 200, { ok: true });
}

// GET/PUT /api/todos
// 모든 투두는 하나의 todos.json에 저장하지만, API 응답과 저장은 현재 사용자 데이터로 제한한다.
async function handleTodos(request, response) {
  const sessionUser = await findSessionUser(request);

  if (!sessionUser) {
    sendJson(response, 401, { message: 'Login is required.' });
    return;
  }

  const userId = sessionUser.user.id;

  // 현재 로그인한 사용자의 할 일만 내려준다.
  if (request.method === 'GET') {
    const todos = await readTodos();
    sendJson(response, 200, todos.filter((todo) => todo.userId === userId));
    return;
  }

  if (request.method === 'PUT') {
    const nextUserTodos = await readJsonBody(request);

    // 다른 사용자의 userId가 섞여 들어오면 저장을 거부한다.
    // 클라이언트 버그나 조작된 요청이 있어도 사용자별 데이터 경계를 지키기 위한 검사다.
    if (!isTodoList(nextUserTodos) || nextUserTodos.some((todo) => todo.userId !== userId)) {
      sendJson(response, 400, { message: 'Invalid todo data' });
      return;
    }

    // PUT은 현재 사용자의 전체 목록을 교체하는 방식이다.
    // 다른 사용자의 투두는 그대로 보존하고, 현재 사용자의 투두만 새 목록으로 바꾼다.
    const todos = await readTodos();
    const otherTodos = todos.filter((todo) => todo.userId !== userId);
    const nextTodos = [...otherTodos, ...nextUserTodos];
    await writeTodos(nextTodos);
    sendJson(response, 200, nextUserTodos);
    return;
  }

  sendJson(response, 405, { message: 'Method not allowed' });
}

async function handleWords(request, response) {
  const sessionUser = await findSessionUser(request);

  if (!sessionUser) {
    sendJson(response, 401, { message: 'Login is required.' });
    return;
  }

  const userId = sessionUser.user.id;

  if (request.method === 'GET') {
    const words = await readWords();
    sendJson(response, 200, words.filter((word) => word.userId === userId));
    return;
  }

  if (request.method === 'PUT') {
    const nextUserWords = await readJsonBody(request);

    if (!isWordList(nextUserWords) || nextUserWords.some((word) => word.userId !== userId)) {
      sendJson(response, 400, { message: 'Invalid word data' });
      return;
    }

    const words = await readWords();
    const otherWords = words.filter((word) => word.userId !== userId);
    await writeWords([...otherWords, ...nextUserWords]);
    sendJson(response, 200, nextUserWords);
    return;
  }

  sendJson(response, 405, { message: 'Method not allowed' });
}

// Node 기본 http 서버의 단일 진입점.
// URL과 method를 직접 확인해서 각 API 핸들러로 분기한다.
async function handleTravelPlaces(request, response, url) {
  const sessionUser = await findSessionUser(request);

  if (request.method === 'GET') {
    const scope = String(url.searchParams.get('scope') || 'public');
    const region = String(url.searchParams.get('region') || '').trim();
    const district = String(url.searchParams.get('district') || '').trim();
    const places = await readTravelPlaces();

    if (scope === 'mine' && !sessionUser) {
      sendJson(response, 401, { message: '로그인이 필요합니다.' });
      return;
    }

    const filteredPlaces = places
      .filter((place) => {
        const ownerMatch = scope === 'mine' ? place.userId === sessionUser.user.id : place.isPublic;
        const regionMatch = region ? place.region === region : true;
        const districtMatch = district ? place.district === district : true;
        return ownerMatch && regionMatch && districtMatch;
      })
      .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
      .map(publicTravelPlace);

    sendJson(response, 200, filteredPlaces);
    return;
  }

  if (!sessionUser) {
    sendJson(response, 401, { message: '로그인이 필요합니다.' });
    return;
  }

  if (request.method !== 'POST') {
    sendJson(response, 405, { message: 'Method not allowed' });
    return;
  }

  const body = await readJsonBody(request);
  const action = String(body?.action || 'create');
  const places = await readTravelPlaces();

  if (action === 'delete') {
    const id = String(body?.id || '');
    const target = places.find((place) => place.id === id);

    if (!target || target.userId !== sessionUser.user.id) {
      sendJson(response, 404, { message: '기록을 찾을 수 없습니다.' });
      return;
    }

    await writeTravelPlaces(places.filter((place) => place.id !== id));
    sendJson(response, 200, { ok: true });
    return;
  }

  const input = normalizePlaceInput(body);

  if (input.title.length < 2 || !input.region || !input.district) {
    sendJson(response, 400, { message: '이름, 지역, 구역을 확인해 주세요.' });
    return;
  }

  if (action === 'update') {
    const id = String(body?.id || '');
    const target = places.find((place) => place.id === id);

    if (!target || target.userId !== sessionUser.user.id) {
      sendJson(response, 404, { message: '기록을 찾을 수 없습니다.' });
      return;
    }

    const nextPlace = {
      ...target,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await writeTravelPlaces(places.map((place) => (place.id === id ? nextPlace : place)));
    sendJson(response, 200, publicTravelPlace(nextPlace));
    return;
  }

  const now = new Date().toISOString();
  const place = {
    id: randomUUID(),
    userId: sessionUser.user.id,
    authorName: sessionUser.user.name,
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  await writeTravelPlaces([place, ...places]);
  sendJson(response, 201, publicTravelPlace(place));
}

const naverSearchSections = [
  { id: 'blog', label: '블로그', endpoint: 'blog' },
  { id: 'cafearticle', label: '카페', endpoint: 'cafearticle' },
  { id: 'local', label: '지역', endpoint: 'local' },
];

async function fetchNaverSearchSection(section, query, display, start = 1) {
  const apiUrl = new URL(`https://openapi.naver.com/v1/search/${section.endpoint}.json`);
  apiUrl.searchParams.set('query', query);
  apiUrl.searchParams.set('display', String(display));
  apiUrl.searchParams.set('start', String(start));

  const naverResponse = await fetch(apiUrl, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
    },
  });
  const payload = await naverResponse.json().catch(() => ({}));

  return {
    id: section.id,
    label: section.label,
    ok: naverResponse.ok,
    status: naverResponse.status,
    total: payload.total ?? 0,
    items: Array.isArray(payload.items) ? payload.items : [],
    message: payload.errorMessage || payload.message || '',
  };
}

async function handleNaverSearch(request, response, url) {
  const query = String(url.searchParams.get('query') || '').trim();
  const display = Math.min(Math.max(Number(url.searchParams.get('display') || 5), 1), 10);
  const start = Math.min(Math.max(Number(url.searchParams.get('start') || 1), 1), 1000);
  const sectionId = String(url.searchParams.get('section') || '').trim();

  if (!query) {
    sendJson(response, 400, { message: '검색어를 입력해 주세요.' });
    return;
  }

  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    sendJson(response, 500, {
      message: '네이버 API 키가 설정되지 않았습니다. .env에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 넣어 주세요.',
    });
    return;
  }

  const targetSections = sectionId
    ? naverSearchSections.filter((section) => section.id === sectionId)
    : naverSearchSections;

  if (sectionId && targetSections.length === 0) {
    sendJson(response, 400, { message: '지원하지 않는 검색 섹션입니다.' });
    return;
  }

  const sections = await Promise.all(
    targetSections.map((section) => fetchNaverSearchSection(section, query, display, start)),
  );

  sendJson(response, 200, {
    query,
    sections,
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  // 브라우저가 실제 요청 전에 보내는 CORS preflight 요청.
  // 허용할 메서드와 헤더만 알려주고 본문 없이 종료한다.
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
    // 인증 관련 API
    if (url.pathname === '/api/signup' && request.method === 'POST') {
      await handleSignup(request, response);
      return;
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      await handleLogin(request, response);
      return;
    }

    if (url.pathname === '/api/password-reset' && request.method === 'POST') {
      await handlePasswordReset(request, response);
      return;
    }

    if (url.pathname === '/api/password-change' && request.method === 'POST') {
      await handlePasswordChange(request, response);
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

    // 할 일 API는 handleTodos 내부에서 GET/PUT을 다시 구분한다.
    if (url.pathname === '/api/todos') {
      await handleTodos(request, response);
      return;
    }

    if (url.pathname === '/api/words') {
      await handleWords(request, response);
      return;
    }

    if (url.pathname === '/api/travel-places') {
      await handleTravelPlaces(request, response, url);
      return;
    }

    if (url.pathname === '/api/naver/search' && request.method === 'GET') {
      await handleNaverSearch(request, response, url);
      return;
    }

    sendJson(response, 404, { message: 'Not found' });
  } catch (error) {
    // 예상하지 못한 오류는 서버 로그에 남기고, 클라이언트에는 일반적인 500 응답만 보낸다.
    console.error(error);
    sendJson(response, 500, { message: 'Server error' });
  }
});

// 로컬 개발 서버 시작 지점.
// package.json의 "server" 스크립트로 실행하면 기본적으로 http://localhost:3002 에서 뜬다.
server.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});
