import {
  findSessionUser,
  handleError,
  normalizePlaceInput,
  publicTravelPlace,
  readJson,
  readTravelPlaces,
  sendJson,
  writeTravelPlaces,
} from '../_shared/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const sessionUser = await findSessionUser(request, env);
    const scope = String(url.searchParams.get('scope') || 'public');
    const region = String(url.searchParams.get('region') || '').trim();
    const district = String(url.searchParams.get('district') || '').trim();
    const places = await readTravelPlaces(env);

    if (scope === 'mine' && !sessionUser) {
      return sendJson({ message: '로그인이 필요합니다.' }, 401);
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

    return sendJson(filteredPlaces);
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const sessionUser = await findSessionUser(request, env);

    if (!sessionUser) {
      return sendJson({ message: '로그인이 필요합니다.' }, 401);
    }

    const body = await readJson(request);
    const action = String(body?.action || 'create');
    const places = await readTravelPlaces(env);

    if (action === 'delete') {
      const id = String(body?.id || '');
      const target = places.find((place) => place.id === id);

      if (!target || target.userId !== sessionUser.user.id) {
        return sendJson({ message: '기록을 찾을 수 없습니다.' }, 404);
      }

      await writeTravelPlaces(env, places.filter((place) => place.id !== id));
      return sendJson({ ok: true });
    }

    const input = normalizePlaceInput(body);

    if (input.title.length < 2 || !input.region || !input.district) {
      return sendJson({ message: '이름, 지역, 구역을 확인해 주세요.' }, 400);
    }

    if (action === 'update') {
      const id = String(body?.id || '');
      const target = places.find((place) => place.id === id);

      if (!target || target.userId !== sessionUser.user.id) {
        return sendJson({ message: '기록을 찾을 수 없습니다.' }, 404);
      }

      const nextPlace = {
        ...target,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      await writeTravelPlaces(env, places.map((place) => (place.id === id ? nextPlace : place)));
      return sendJson(publicTravelPlace(nextPlace));
    }

    const now = new Date().toISOString();
    const place = {
      id: crypto.randomUUID(),
      userId: sessionUser.user.id,
      authorName: sessionUser.user.name,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await writeTravelPlaces(env, [place, ...places]);
    return sendJson(publicTravelPlace(place), 201);
  } catch (error) {
    return handleError(error);
  }
}
