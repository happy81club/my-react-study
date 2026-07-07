import {
  findSessionUser,
  handleError,
  isTodoList,
  readJson,
  readTodos,
  sendJson,
  writeTodos,
} from '../_shared/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const sessionUser = await findSessionUser(request, env);

    if (!sessionUser) {
      return sendJson({ message: '로그인이 필요합니다.' }, 401);
    }

    const todos = await readTodos(env);
    return sendJson(todos.filter((todo) => todo.userId === sessionUser.user.id));
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

    const nextUserTodos = await readJson(request);
    const userId = sessionUser.user.id;

    if (!isTodoList(nextUserTodos) || nextUserTodos.some((todo) => todo.userId !== userId)) {
      return sendJson({ message: '잘못된 할 일 데이터입니다.' }, 400);
    }

    const todos = await readTodos(env);
    const otherTodos = todos.filter((todo) => todo.userId !== userId);
    await writeTodos(env, [...otherTodos, ...nextUserTodos]);

    return sendJson(nextUserTodos);
  } catch (error) {
    return handleError(error);
  }
}
