import {
  findSessionUser,
  handleError,
  hashPassword,
  readJson,
  readSessions,
  readUsers,
  sendJson,
  writeSessions,
  writeUsers,
} from '../_shared/api.js';

export async function onRequestPost({ request, env }) {
  try {
    const sessionUser = await findSessionUser(request, env);

    if (!sessionUser) {
      return sendJson({ message: '로그인이 필요합니다.' }, 401);
    }

    const body = await readJson(request);
    const currentPassword = String(body?.currentPassword || '');
    const nextPassword = String(body?.nextPassword || '');

    if (nextPassword.length < 4) {
      return sendJson({ message: '새 비밀번호는 4자 이상으로 입력해 주세요.' }, 400);
    }

    if (await hashPassword(currentPassword) !== sessionUser.user.passwordHash) {
      return sendJson({ message: '현재 비밀번호가 맞지 않습니다.' }, 400);
    }

    const [users, sessions] = await Promise.all([readUsers(env), readSessions(env)]);
    const passwordHash = await hashPassword(nextPassword);
    const nextUsers = users.map((user) => (
      user.id === sessionUser.user.id
        ? { ...user, passwordHash, passwordUpdatedAt: new Date().toISOString() }
        : user
    ));
    const nextSessions = sessions.filter((session) => (
      session.userId !== sessionUser.user.id || session.token === sessionUser.token
    ));

    await Promise.all([
      writeUsers(env, nextUsers),
      writeSessions(env, nextSessions),
    ]);

    return sendJson({ ok: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    return handleError(error);
  }
}
