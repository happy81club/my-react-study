import {
  handleError,
  hashPassword,
  normalizeEmail,
  readJson,
  readSessions,
  readUsers,
  sendJson,
  writeSessions,
  writeUsers,
} from '../_shared/api.js';

function createTemporaryPassword() {
  return '1234';
}

async function sendTemporaryPasswordEmail(env, email, temporaryPassword) {
  if (
    !env.RESEND_API_KEY
    || !env.PASSWORD_RESET_FROM
    || env.RESEND_API_KEY.startsWith('your_')
    || env.PASSWORD_RESET_FROM.includes('example.com')
  ) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  const mailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      from: env.PASSWORD_RESET_FROM,
      to: email,
      subject: '새 임시 비밀번호 안내',
      text: `요청하신 임시 비밀번호입니다.\n\n${temporaryPassword}\n\n로그인 후 설정에서 새 비밀번호로 변경해 주세요.`,
    }),
  }).finally(() => clearTimeout(timeout));

  return mailResponse.ok;
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJson(request);
    const email = normalizeEmail(body?.email);

    if (!email.includes('@')) {
      return sendJson({ message: '이메일을 확인해 주세요.' }, 400);
    }

    const [users, sessions] = await Promise.all([readUsers(env), readSessions(env)]);
    const user = users.find((item) => item.email === email);

    if (!user) {
      return sendJson({
        ok: true,
        message: '가입된 이메일이면 새 임시 비밀번호를 보내드립니다.',
      });
    }

    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const nextUsers = users.map((item) => (
      item.id === user.id
        ? { ...item, passwordHash, passwordUpdatedAt: new Date().toISOString() }
        : item
    ));
    const nextSessions = sessions.filter((session) => session.userId !== user.id);

    await Promise.all([
      writeUsers(env, nextUsers),
      writeSessions(env, nextSessions),
    ]);

    const mailed = await sendTemporaryPasswordEmail(env, email, temporaryPassword);

    if (!mailed) {
      console.info(`[password-reset] ${email} temporary password: ${temporaryPassword}`);
    }

    return sendJson({
      ok: true,
      mailed,
      temporaryPassword,
      message: mailed
        ? '새 임시 비밀번호를 이메일로 보냈습니다.'
        : '비밀번호가 1234로 초기화되었습니다. 로그인 후 설정에서 변경해 주세요.',
    });
  } catch (error) {
    return handleError(error);
  }
}
