import {
  findSessionUser,
  handleError,
  publicUser,
  sendJson,
} from '../_shared/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const sessionUser = await findSessionUser(request, env);

    if (!sessionUser) {
      return sendJson({ message: '세션이 만료되었습니다.' }, 401);
    }

    return sendJson({
      token: sessionUser.token,
      user: publicUser(sessionUser.user),
    });
  } catch (error) {
    return handleError(error);
  }
}
