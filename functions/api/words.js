import {
  findSessionUser,
  handleError,
  isWordList,
  readJson,
  readWords,
  sendJson,
  writeWords,
} from '../_shared/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const sessionUser = await findSessionUser(request, env);

    if (!sessionUser) {
      return sendJson({ message: '로그인이 필요합니다.' }, 401);
    }

    const words = await readWords(env);
    return sendJson(words.filter((word) => word.userId === sessionUser.user.id));
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const sessionUser = await findSessionUser(request, env);

    if (!sessionUser) {
      return sendJson({ message: '로그인이 필요합니다.' }, 401);
    }

    const nextUserWords = await readJson(request);
    const userId = sessionUser.user.id;

    if (!isWordList(nextUserWords) || nextUserWords.some((word) => word.userId !== userId)) {
      return sendJson({ message: '잘못된 영어 단어 데이터입니다.' }, 400);
    }

    const words = await readWords(env);
    const otherWords = words.filter((word) => word.userId !== userId);
    await writeWords(env, [...otherWords, ...nextUserWords]);

    return sendJson(nextUserWords);
  } catch (error) {
    return handleError(error);
  }
}
