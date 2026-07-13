import { handleError, sendJson } from '../../_shared/api.js';

const NAVER_SEARCH_SECTIONS = [
  { id: 'blog', label: '블로그', endpoint: 'blog' },
  { id: 'cafearticle', label: '카페', endpoint: 'cafearticle' },
  { id: 'local', label: '지역', endpoint: 'local' },
];

async function fetchNaverSearchSection(env, section, query, display, start = 1) {
  const apiUrl = new URL(`https://openapi.naver.com/v1/search/${section.endpoint}.json`);
  apiUrl.searchParams.set('query', query);
  apiUrl.searchParams.set('display', String(display));
  apiUrl.searchParams.set('start', String(start));

  const naverResponse = await fetch(apiUrl, {
    headers: {
      'X-Naver-Client-Id': env.NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': env.NAVER_CLIENT_SECRET,
    },
  });
  const payload = await naverResponse.json().catch(() => ({}));

  return {
    id: section.id,
    label: section.label,
    ok: naverResponse.ok,
    status: naverResponse.status,
    total: payload.total ?? 0,
    items: Array.isArray(payload.items) ? payload.items : [],
    message: payload.errorMessage || payload.message || '',
  };
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const query = String(url.searchParams.get('query') || '').trim();
    const display = Math.min(Math.max(Number(url.searchParams.get('display') || 6), 1), 10);
    const start = Math.min(Math.max(Number(url.searchParams.get('start') || 1), 1), 1000);
    const sectionId = String(url.searchParams.get('section') || '').trim();

    if (!query) {
      return sendJson({ message: '검색어를 입력해 주세요.' }, 400);
    }

    if (!env.NAVER_CLIENT_ID || !env.NAVER_CLIENT_SECRET) {
      return sendJson({
        message: 'Cloudflare Pages 환경 변수에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 등록해 주세요.',
      }, 500);
    }

    const targetSections = sectionId
      ? NAVER_SEARCH_SECTIONS.filter((section) => section.id === sectionId)
      : NAVER_SEARCH_SECTIONS;

    if (sectionId && targetSections.length === 0) {
      return sendJson({ message: '지원하지 않는 검색 섹션입니다.' }, 400);
    }

    const sections = await Promise.all(
      targetSections.map((section) => fetchNaverSearchSection(env, section, query, display, start)),
    );

    return sendJson({
      query,
      sections,
    });
  } catch (error) {
    return handleError(error);
  }
}
