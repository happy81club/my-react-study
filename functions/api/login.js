import {
  createSession,
  handleError,
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
    const users = await readUsers(env);
    const user = users.find((item) => item.email === email);

    if (!user) {
      return sendJson({ message: '가입된 이메일을 확인해 주세요.' }, 401);
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
