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
} from '../_shared/api.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const email = normalizeEmail(body?.email);
    const passwordHash = await hashPassword(String(body?.password || ''));
    const users = await readUsers(env);
    const user = users.find((item) => item.email === email && item.passwordHash === passwordHash);

    if (!user) {
      return sendJson({ message: '이메일 또는 비밀번호가 맞지 않습니다.' }, 401);
    }

    const sessions = await readSessions(env);
    const session = createSession(user.id);
    await writeSessions(env, [...sessions, session]);

    return sendJson({
      token: session.token,
      user: publicUser(user),
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return handleError(error);
  }
}
