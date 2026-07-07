import {
  getBearerToken,
  handleError,
  readSessions,
  sendJson,
  writeSessions,
} from '../_shared/api.js';

export async function onRequestPost({ request, env }) {
  try {
    const token = getBearerToken(request);
    const sessions = await readSessions(env);
    await writeSessions(env, sessions.filter((session) => session.token !== token));

    return sendJson({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
