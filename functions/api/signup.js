import {
  createSession,
  handleError,
  hashPassword,
  normalizeEmail,
  publicUser,
  readJson,
  readSessions,
  readUsers,
  sendJson,
  writeSessions,
  writeUsers,
} from '../_shared/api.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const name = String(body?.name || '').trim();
    const email = normalizeEmail(body?.email);
    const password = String(body?.password || '');

    if (name.length < 2 || !email.includes('@') || password.length < 4) {
      return sendJson({ message: '이름, 이메일, 비밀번호를 확인해 주세요.' }, 400);
    }

    const users = await readUsers(env);

    if (users.some((user) => user.email === email)) {
      return sendJson({ message: '이미 가입된 이메일입니다.' }, 409);
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    const session = createSession(user.id);
    const sessions = await readSessions(env);

    await Promise.all([
      writeUsers(env, [...users, user]),
      writeSessions(env, [...sessions, session]),
    ]);

    return sendJson({
      token: session.token,
      user: publicUser(user),
      expiresAt: session.expiresAt,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}
