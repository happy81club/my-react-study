import { useEffect, useState } from 'react';

const REGIONS = [
  { id: 'seoul', name: '서울', type: '특별시', x: 31, y: 20, districts: ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'] },
  { id: 'busan', name: '부산', type: '광역시', x: 76, y: 72, districts: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'] },
  { id: 'daegu', name: '대구', type: '광역시', x: 66, y: 57, districts: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'] },
  { id: 'incheon', name: '인천', type: '광역시', x: 22, y: 21, districts: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'] },
  { id: 'gwangju', name: '광주', type: '광역시', x: 35, y: 70, districts: ['동구', '서구', '남구', '북구', '광산구'] },
  { id: 'daejeon', name: '대전', type: '광역시', x: 43, y: 46, districts: ['동구', '중구', '서구', '유성구', '대덕구'] },
  { id: 'ulsan', name: '울산', type: '광역시', x: 81, y: 64, districts: ['중구', '남구', '동구', '북구', '울주군'] },
  { id: 'sejong', name: '세종', type: '특별자치시', x: 39, y: 41, districts: ['조치원읍', '연기면', '연동면', '부강면', '금남면', '장군면', '연서면', '전의면', '전동면', '소정면', '한솔동', '도담동', '아름동', '종촌동', '고운동', '보람동', '새롬동', '대평동', '소담동', '다정동', '해밀동', '반곡동'] },
  { id: 'gyeonggi', name: '경기도', type: '도', x: 34, y: 28, districts: ['수원시', '고양시', '용인시', '성남시', '화성시', '부천시', '남양주시', '안산시', '평택시', '안양시', '시흥시', '파주시', '김포시', '의정부시', '광주시', '하남시', '광명시', '군포시', '양주시', '오산시', '이천시', '안성시', '구리시', '의왕시', '포천시', '양평군', '여주시', '동두천시', '과천시', '가평군', '연천군'] },
  { id: 'gangwon', name: '강원도', type: '특별자치도', x: 62, y: 19, districts: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'] },
  { id: 'chungnam', name: '충청남도', type: '도', x: 29, y: 45, districts: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'] },
  { id: 'chungbuk', name: '충청북도', type: '도', x: 49, y: 38, districts: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'] },
  { id: 'jeonbuk', name: '전북', type: '특별자치도', x: 38, y: 58, districts: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'] },
  { id: 'jeonnam', name: '전라남도', type: '도', x: 34, y: 76, districts: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'] },
  { id: 'gyeongbuk', name: '경상북도', type: '도', x: 68, y: 43, districts: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'] },
  { id: 'gyeongnam', name: '경상남도', type: '도', x: 60, y: 69, districts: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'] },
  { id: 'jeju', name: '제주도', type: '특별자치도', x: 39, y: 94, districts: ['제주시', '서귀포시'] },
];

const LABEL_POSITIONS = {
  seoul: [35, 20],
  incheon: [25, 21],
  gyeonggi: [39, 28],
  chungnam: [31, 45],
  jeonbuk: [35, 58],
  jeonnam: [32, 76],
  jeju: [54, 94],
};

const QUICK_KEYWORDS = ['맛집', '카페', '여행지', '데이트 코스', '아이와 가볼 만한 곳', '현지인 추천'];
const PLACE_CATEGORY_FILTERS = [
  { id: 'all', label: '전체보기' },
  { id: 'restaurant', label: '맛집' },
  { id: 'travel', label: '여행지' },
];

const EMPTY_PLACE_FORM = {
  title: '',
  category: 'restaurant',
  address: '',
  memo: '',
  tags: '',
  isPublic: false,
  isAuthorPublic: false,
};
const TRAVEL_RETURN_KEY = 'my-react-study-travel-return';

function formatPlaceRegionName(regionName) {
  return regionName === '서울' ? '서울시' : regionName;
}

function getPlaceTitlePrefix(region, district) {
  return region && district
    ? `[${formatPlaceRegionName(region.name)} ${district}] `
    : '';
}

function stripPlaceTitlePrefix(value, prefix) {
  const title = String(value || '').trim();
  return prefix && title.startsWith(prefix.trim())
    ? title.slice(prefix.trim().length).trimStart()
    : title;
}

function createDefaultPlaceForm() {
  return {
    ...EMPTY_PLACE_FORM,
    title: '',
  };
}

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatPlaceDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatPlaceTitle(value) {
  const title = String(value || '').replace(/\s+/g, ' ').trim();
  const cleanedTitle = title
    .replace(/\s*\[출처\].*$/u, '')
    .replace(/\s*\|\s*작성자\s*.*$/u, '')
    .trim();

  return cleanedTitle || title || '제목 없음';
}

function readTravelReturn() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const savedReturn = window.sessionStorage.getItem(TRAVEL_RETURN_KEY);
    return savedReturn ? JSON.parse(savedReturn) : null;
  } catch {
    window.sessionStorage.removeItem(TRAVEL_RETURN_KEY);
    return null;
  }
}

function saveTravelReturn(value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(TRAVEL_RETURN_KEY, JSON.stringify(value));
}

function clearTravelReturn() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(TRAVEL_RETURN_KEY);
  }
}

const stripNaverText = (value) => String(value || '')
  .replace(/<[^>]*>/g, '')
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const getResultTitle = (item) => stripNaverText(item.title || item.name);
const getResultDescription = (item) => stripNaverText(item.description || item.address || item.roadAddress);
const getResultLink = (item) => item.link || item.originallink;

function TravelCoursePage({ initialView = 'map', onBack, onLogin, onLogout, token, user }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingSectionId, setLoadingSectionId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isLocalExpanded, setIsLocalExpanded] = useState(false);
  const [myPlaces, setMyPlaces] = useState([]);
  const [publicPlaces, setPublicPlaces] = useState([]);
  const [districtPublicCounts, setDistrictPublicCounts] = useState({});
  const [placeForm, setPlaceForm] = useState(EMPTY_PLACE_FORM);
  const [editingPlaceId, setEditingPlaceId] = useState('');
  const [placeMessage, setPlaceMessage] = useState('');
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [isSavingPlace, setIsSavingPlace] = useState(false);
  const [isPlaceManagerOpen, setIsPlaceManagerOpen] = useState(false);
  const [isPublicPlaceListOpen, setIsPublicPlaceListOpen] = useState(false);
  const [isAllMyPlacesOpen, setIsAllMyPlacesOpen] = useState(initialView === 'myPlaces');
  const [placeDetail, setPlaceDetail] = useState(null);
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      return;
    }

    const travelReturn = readTravelReturn();

    if (!travelReturn?.regionId || !travelReturn?.district) {
      return;
    }

    const region = REGIONS.find((item) => item.id === travelReturn.regionId);

    if (!region || !region.districts.includes(travelReturn.district)) {
      clearTravelReturn();
      return;
    }

    setSelectedRegion(region);
    setSelectedDistrict(travelReturn.district);
    setSearchText('');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setIsLocalExpanded(false);
    setPlaceForm(travelReturn.openPlaceManager ? createDefaultPlaceForm(region, travelReturn.district) : EMPTY_PLACE_FORM);
    setEditingPlaceId('');
    setPlaceMessage('');
    setIsPlaceManagerOpen(Boolean(travelReturn.openPlaceManager));
    clearTravelReturn();
  }, [user?.id]);

  const openRegion = (region) => {
    setSelectedRegion(region);
    setSelectedDistrict('');
    setSearchText('');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setIsLocalExpanded(false);
    setPlaceForm(EMPTY_PLACE_FORM);
    setEditingPlaceId('');
    setPlaceMessage('');
    setIsPlaceManagerOpen(false);
    setIsPublicPlaceListOpen(false);
    setIsAllMyPlacesOpen(false);
    setPlaceDetail(null);
    setPlaceCategoryFilter('all');
  };

  const openDistrict = (district) => {
    setSelectedDistrict(district);
    setSearchText('');
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
    setIsLocalExpanded(false);
    setPlaceForm(EMPTY_PLACE_FORM);
    setEditingPlaceId('');
    setPlaceMessage('');
    setIsPlaceManagerOpen(false);
    setIsPublicPlaceListOpen(false);
    setIsAllMyPlacesOpen(false);
    setPlaceDetail(null);
    setPlaceCategoryFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchDistrictPublicCounts = async (region = selectedRegion) => {
    if (!region) {
      setDistrictPublicCounts({});
      return;
    }

    try {
      const response = await fetch(`/api/travel-places?scope=public&region=${encodeURIComponent(region.name)}`);
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || '공개 기록 개수를 불러오지 못했습니다.');
      }

      const counts = (Array.isArray(data) ? data : []).reduce((result, place) => {
        if (!place?.district) {
          return result;
        }

        return {
          ...result,
          [place.district]: (result[place.district] || 0) + 1,
        };
      }, {});

      setDistrictPublicCounts(counts);
    } catch {
      setDistrictPublicCounts({});
    }
  };

  const fetchTravelPlaces = async () => {
    if (!selectedRegion || !selectedDistrict) {
      setMyPlaces([]);
      setPublicPlaces([]);
      return;
    }

    setIsLoadingPlaces(true);

    try {
      const query = `region=${encodeURIComponent(selectedRegion.name)}&district=${encodeURIComponent(selectedDistrict)}`;
      const publicResponse = await fetch(`/api/travel-places?scope=public&${query}`);
      const myResponse = user && token
        ? await fetch(`/api/travel-places?scope=mine&${query}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        : null;
      const publicData = await readJsonResponse(publicResponse);
      const myData = myResponse ? await readJsonResponse(myResponse) : [];

      if (!publicResponse.ok) {
        throw new Error(publicData?.message || '공개 기록을 불러오지 못했습니다.');
      }

      if (myResponse && !myResponse.ok) {
        throw new Error(myData?.message || '내 기록을 불러오지 못했습니다.');
      }

      setPublicPlaces(Array.isArray(publicData) ? publicData : []);
      setMyPlaces(Array.isArray(myData) ? myData : []);
    } catch (error) {
      setPlaceMessage(error.message || '여행 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const fetchAllMyPlaces = async () => {
    if (!user || !token || !isAllMyPlacesOpen) {
      return;
    }

    setIsLoadingPlaces(true);
    setPlaceMessage('');

    try {
      const response = await fetch('/api/travel-places?scope=mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || '내 기록을 불러오지 못했습니다.');
      }

      setMyPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      setPlaceMessage(error.message || '내 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  useEffect(() => {
    fetchTravelPlaces();
  }, [selectedRegion?.name, selectedDistrict, token, user?.id]);

  useEffect(() => {
    fetchAllMyPlaces();
  }, [isAllMyPlacesOpen, token, user?.id]);

  useEffect(() => {
    fetchDistrictPublicCounts();
  }, [selectedRegion?.name]);

  useEffect(() => {
    if (!user && isPlaceManagerOpen) {
      setIsPlaceManagerOpen(false);
    }
  }, [isPlaceManagerOpen, user]);

  const openPlaceManager = () => {
    if (!user || !token) {
      if (selectedRegion && selectedDistrict) {
        saveTravelReturn({
          regionId: selectedRegion.id,
          district: selectedDistrict,
          openPlaceManager: true,
        });
      }
      onLogin();
      return;
    }

    if (!editingPlaceId && !placeForm.title.trim()) {
      setPlaceForm(createDefaultPlaceForm(selectedRegion, selectedDistrict));
    }
    setIsPlaceManagerOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updatePlaceForm = (field, value) => {
    setPlaceForm((currentForm) => ({
      ...currentForm,
      [field]: value,
      ...(field === 'isPublic' && !value ? { isAuthorPublic: false } : {}),
    }));
  };

  const resetPlaceForm = () => {
    setPlaceForm(createDefaultPlaceForm(selectedRegion, selectedDistrict));
    setEditingPlaceId('');
  };

  const submitTravelPlace = async (event) => {
    event.preventDefault();

    if (!user || !token) {
      onLogin();
      return;
    }

    if (!selectedRegion || !selectedDistrict) {
      return;
    }

    const titlePrefix = getPlaceTitlePrefix(selectedRegion, selectedDistrict);
    const titleName = stripPlaceTitlePrefix(placeForm.title, titlePrefix);
    const memo = placeForm.memo.trim();

    if (titleName.length < 2 || !memo) {
      setPlaceMessage('이름과 메모를 입력해 주세요.');
      return;
    }

    setIsSavingPlace(true);
    setPlaceMessage('');

    try {
      const response = await fetch('/api/travel-places', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: editingPlaceId ? 'update' : 'create',
          id: editingPlaceId,
          ...placeForm,
          title: `${titlePrefix}${titleName}`,
          memo,
          region: selectedRegion.name,
          district: selectedDistrict,
        }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || '기록을 저장하지 못했습니다.');
      }

      setPlaceMessage(editingPlaceId ? '기록을 수정했습니다.' : '내 기록에 추가했습니다.');
      resetPlaceForm();
      await fetchTravelPlaces();
      await fetchDistrictPublicCounts();
    } catch (error) {
      setPlaceMessage(error.message || '기록을 저장하지 못했습니다.');
    } finally {
      setIsSavingPlace(false);
    }
  };

  const editTravelPlace = (place) => {
    const placeRegion = REGIONS.find((region) => region.name === place.region);
    const titlePrefix = getPlaceTitlePrefix(placeRegion, place.district);

    setPlaceDetail(null);
    setIsPublicPlaceListOpen(false);

    if (placeRegion && place.district) {
      setSelectedRegion(placeRegion);
      setSelectedDistrict(place.district);
    }

    setIsAllMyPlacesOpen(false);
    setIsPlaceManagerOpen(true);
    setEditingPlaceId(place.id);
    setPlaceForm({
      title: stripPlaceTitlePrefix(place.title, titlePrefix),
      category: place.category || 'restaurant',
      address: place.address || '',
      memo: place.memo || '',
      tags: Array.isArray(place.tags) ? place.tags.join(', ') : '',
      isPublic: Boolean(place.isPublic),
      isAuthorPublic: Boolean(place.isAuthorPublic),
    });
  };

  const deleteTravelPlace = async (placeId) => {
    if (!token) {
      onLogin();
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm('정말 이 기록을 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.')) {
      return;
    }

    setIsSavingPlace(true);
    setPlaceMessage('');

    try {
      const response = await fetch('/api/travel-places', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', id: placeId }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || '기록을 삭제하지 못했습니다.');
      }

      setPlaceMessage('기록을 삭제했습니다.');
      setPlaceDetail(null);
      resetPlaceForm();
      if (isAllMyPlacesOpen) {
        await fetchAllMyPlaces();
      } else {
        await fetchTravelPlaces();
      }
      await fetchDistrictPublicCounts();
    } catch (error) {
      setPlaceMessage(error.message || '기록을 삭제하지 못했습니다.');
    } finally {
      setIsSavingPlace(false);
    }
  };

  const openPlaceDetail = (place, { editable = false, showLocation = false } = {}) => {
    setPlaceDetail({ place, editable, showLocation });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceCardKeyDown = (event, place, options) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    openPlaceDetail(place, options);
  };

  const renderPlaceList = (places, {
    editable = true,
    detailEditable = editable,
    emptyText = '아직 작성한 기록이 없습니다.',
    showLocation = false,
  } = {}) => {
    if (isLoadingPlaces) {
      return <p className="travel-place-empty">기록을 불러오는 중입니다.</p>;
    }

    if (places.length === 0) {
      return <p className="travel-place-empty">{emptyText}</p>;
    }

    return (
      <div className="travel-place-list">
        {places.map((place) => {
          const detailOptions = { editable: detailEditable, showLocation };

          return (
            <article
              className="travel-place-card"
              key={place.id}
              role="button"
              tabIndex={0}
              onClick={() => openPlaceDetail(place, detailOptions)}
              onKeyDown={(event) => handlePlaceCardKeyDown(event, place, detailOptions)}
            >
              <div className="travel-place-card-header">
                <span className={`travel-place-type type-${place.category}`}>
                  {place.category === 'travel' ? '여행지' : '맛집'}
                </span>
                <small>{formatPlaceDate(place.updatedAt || place.createdAt)}</small>
              </div>
              <h3>{formatPlaceTitle(place.title)}</h3>
              {showLocation && (place.region || place.district) && (
                <p className="travel-place-location">{[place.region, place.district].filter(Boolean).join(' ')}</p>
              )}
              {place.address && <p className="travel-place-address">{place.address}</p>}
              {place.memo && <p>{place.memo}</p>}
              {Array.isArray(place.tags) && place.tags.length > 0 && (
                <div className="travel-place-tags">
                  {place.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
              )}
              <div className="travel-place-footer">
                <span>{place.isPublic ? '공개' : '나만 보기'}</span>
                {!editable && place.authorName && <span>{place.authorName}</span>}
              </div>
              {editable && (
                <div
                  className="travel-place-actions"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      editTravelPlace(place);
                    }}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteTravelPlace(place.id);
                    }}
                    disabled={isSavingPlace}
                  >
                    삭제
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    );
  };

  const renderPlaceDetail = () => {
    if (!placeDetail?.place) {
      return null;
    }

    const { place, editable, showLocation } = placeDetail;
    const location = [place.region, place.district].filter(Boolean).join(' ');
    const title = formatPlaceTitle(place.title);
    const hasMapLocation = Boolean(place.address || location);
    const mapQuery = place.address
      ? [location, place.address].filter(Boolean).join(' ')
      : location;
    const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`;
    const googleMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

    return (
      <main className="App">
        <section className="travel-shell district-detail-shell" aria-labelledby="travel-place-detail-title">
          <div className="page-navigation">
            <div className="travel-navigation-actions">
              <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
              <button type="button" className="home-button" onClick={() => setPlaceDetail(null)}>목록으로</button>
              {!isAllMyPlacesOpen && selectedRegion && (
                <button
                  type="button"
                  className="home-button"
                  onClick={() => {
                    setPlaceDetail(null);
                    setSelectedDistrict('');
                  }}
                >
                  {selectedRegion.name} 지역
                </button>
              )}
            </div>
            {renderSessionAction()}
          </div>

          <article className="travel-place-detail">
            <div className="travel-place-detail-header">
              <div className="travel-place-detail-title-row">
                <span className={`travel-place-type type-${place.category}`}>
                  {place.category === 'travel' ? '여행지' : '맛집'}
                </span>
                <h1 id="travel-place-detail-title">{title}</h1>
              </div>
              <time dateTime={place.updatedAt || place.createdAt}>{formatPlaceDate(place.updatedAt || place.createdAt)}</time>
            </div>

            {(showLocation || location) && location && (
              <p className="travel-place-detail-location">{location}</p>
            )}
            {hasMapLocation && (
              <section className="travel-place-detail-section">
                <div className="travel-place-detail-section-header">
                  <span>주소 또는 위치</span>
                  <div className="travel-place-map-links">
                    <a href={naverMapUrl} target="_blank" rel="noreferrer">네이버지도</a>
                  </div>
                </div>
                {place.address ? (
                  <p>{place.address}</p>
                ) : (
                  <p className="travel-place-map-note">상세주소가 없어 {location} 기준으로 표시됩니다.</p>
                )}
                <div className="travel-place-map">
                  <iframe
                    title={`${title} 지도`}
                    src={googleMapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            )}
            {place.memo && (
              <section className="travel-place-detail-section">
                <span>메모</span>
                <p>{place.memo}</p>
              </section>
            )}
            {Array.isArray(place.tags) && place.tags.length > 0 && (
              <section className="travel-place-detail-section">
                <span>태그</span>
                <div className="travel-place-tags">
                  {place.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
              </section>
            )}

            <div className="travel-place-detail-footer">
              <span>{place.isPublic ? '공개' : '나만 보기'}</span>
              {place.authorName && <span>{place.authorName}</span>}
            </div>

            {editable && (
              <div className="travel-place-actions">
                <button type="button" onClick={() => editTravelPlace(place)}>수정</button>
                <button type="button" onClick={() => deleteTravelPlace(place.id)} disabled={isSavingPlace}>삭제</button>
              </div>
            )}
          </article>
        </section>
      </main>
    );
  };

  const renderSessionAction = () => (
    <div className="session-action">
      {user && <span>{user.name}님</span>}
      <button type="button" className="text-logout-button" onClick={user ? onLogout : onLogin}>
        {user ? '로그아웃' : '로그인'}
      </button>
    </div>
  );

  const filterPlacesByCategory = (places) => (
    placeCategoryFilter === 'all'
      ? places
      : places.filter((place) => place.category === placeCategoryFilter)
  );

  const renderPlaceCategoryFilter = (places) => {
    const counts = places.reduce((result, place) => ({
      ...result,
      [place.category]: (result[place.category] || 0) + 1,
    }), { all: places.length });

    return (
      <div className="travel-place-filter" aria-label="맛집 여행지 필터">
        {PLACE_CATEGORY_FILTERS.map((filter) => (
          <button
            type="button"
            className={placeCategoryFilter === filter.id ? 'active' : ''}
            key={filter.id}
            onClick={() => setPlaceCategoryFilter(filter.id)}
          >
            <span>{filter.label}</span>
            <em>{(counts[filter.id] || 0).toLocaleString()}</em>
          </button>
        ))}
      </div>
    );
  };

  const renderPlaceBoard = (locationName) => {
    const titlePrefix = getPlaceTitlePrefix(selectedRegion, selectedDistrict);

    return (
    <section className="travel-place-board" aria-labelledby="travel-place-board-title">
      <div className="travel-place-board-header">
        <div>
          <span className="eyebrow">My places</span>
          <h2 id="travel-place-board-title">나만의 맛집·여행지</h2>
        </div>
      </div>

      <form className="travel-place-form" onSubmit={submitTravelPlace}>
        <div className="travel-place-form-grid">
          <label>
            <span>분류</span>
            <select
              value={placeForm.category}
              onChange={(event) => updatePlaceForm('category', event.target.value)}
            >
              <option value="restaurant">맛집</option>
              <option value="travel">여행지</option>
            </select>
          </label>
          <label className="travel-place-title-label">
            <span><em>*</em> 이름</span>
            <div className="travel-place-title-input">
              {titlePrefix && <strong>{titlePrefix.trim()}</strong>}
              <input
                value={stripPlaceTitlePrefix(placeForm.title, titlePrefix)}
                onChange={(event) => updatePlaceForm('title', event.target.value)}
                placeholder="장소 이름"
                minLength={2}
                required
              />
            </div>
          </label>
          <label className="wide">
            <span>주소 또는 위치</span>
            <input
              value={placeForm.address}
              onChange={(event) => updatePlaceForm('address', event.target.value)}
              placeholder={`${locationName} 근처`}
            />
          </label>
          <label className="wide">
            <span><em>*</em> 메모</span>
            <textarea
              value={placeForm.memo}
              onChange={(event) => updatePlaceForm('memo', event.target.value)}
              placeholder="추천 메뉴, 분위기, 주차, 다시 가고 싶은 이유"
              rows={9}
              required
            />
          </label>
          <div className="travel-photo-placeholder wide" aria-label="사진 등록 준비 영역">
            <div>
              <strong>사진 등록</strong>
              <span>나중에 장소 사진을 추가할 수 있도록 준비 중입니다.</span>
            </div>
            <button type="button" disabled>사진 추가 준비중</button>
          </div>
        </div>
        <div className="travel-place-form-actions">
          <label className="travel-place-public-toggle">
            <input
              type="checkbox"
              checked={placeForm.isPublic}
              onChange={(event) => updatePlaceForm('isPublic', event.target.checked)}
            />
            <span>모두에게 공개</span>
          </label>
          <label className="travel-place-public-toggle">
            <input
              type="checkbox"
              checked={placeForm.isAuthorPublic}
              onChange={(event) => updatePlaceForm('isAuthorPublic', event.target.checked)}
              disabled={!placeForm.isPublic}
            />
            <span>작성자 공개</span>
          </label>
          <div>
            {editingPlaceId && (
              <button type="button" className="travel-place-cancel" onClick={resetPlaceForm}>취소</button>
            )}
            <button type="submit" disabled={isSavingPlace}>
              {isSavingPlace ? '저장 중' : editingPlaceId ? '수정 저장' : '기록 추가'}
            </button>
          </div>
        </div>
      </form>

      {placeMessage && <p className="travel-place-message">{placeMessage}</p>}

      <div className="travel-place-tab-panel">
        {renderPlaceList(myPlaces)}
      </div>
    </section>
    );
  };

  const searchPortal = async (keyword) => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword || !selectedRegion || !selectedDistrict) {
      return;
    }

    const query = `${selectedRegion.name} ${selectedDistrict} ${trimmedKeyword}`;
    setSearchText(trimmedKeyword);
    setSearchQuery(trimmedKeyword);
    setIsSearching(true);
    setLoadingSectionId('');
    setSearchError('');
    setIsLocalExpanded(false);

    try {
      const response = await fetch(`/api/naver/search?query=${encodeURIComponent(query)}&display=6`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || '검색 결과를 불러오지 못했습니다.');
      }

      setSearchResults(Array.isArray(data?.sections) ? data.sections : []);
    } catch (error) {
      setSearchResults([]);
      setSearchError(error.message || '검색 결과를 불러오지 못했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreSection = async (section) => {
    if (!section?.id || !selectedRegion || !selectedDistrict || !searchQuery) {
      return;
    }

    const query = `${selectedRegion.name} ${selectedDistrict} ${searchQuery}`;
    const nextStart = section.items.length + 1;
    setLoadingSectionId(section.id);
    setSearchError('');

    try {
      const response = await fetch(
        `/api/naver/search?query=${encodeURIComponent(query)}&display=6&section=${encodeURIComponent(section.id)}&start=${nextStart}`,
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || '다음 검색 결과를 불러오지 못했습니다.');
      }

      const nextSection = Array.isArray(data?.sections) ? data.sections[0] : null;

      if (!nextSection) {
        throw new Error('다음 검색 결과를 찾지 못했습니다.');
      }

      setSearchResults((currentSections) => currentSections.map((currentSection) => (
        currentSection.id === section.id
          ? {
              ...nextSection,
              items: [...currentSection.items, ...nextSection.items],
              total: nextSection.total,
            }
          : currentSection
      )));
    } catch (error) {
      setSearchError(error.message || '다음 검색 결과를 불러오지 못했습니다.');
    } finally {
      setLoadingSectionId('');
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    searchPortal(searchText);
  };

  if (placeDetail) {
    return renderPlaceDetail();
  }

  if (isAllMyPlacesOpen) {
    return (
      <main className="App">
        <section className="travel-shell district-detail-shell" aria-labelledby="my-travel-places-title">
          <div className="page-navigation">
            <div className="travel-navigation-actions">
              <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
              <button type="button" className="home-button" onClick={() => setIsAllMyPlacesOpen(false)}>전국 지도</button>
            </div>
            {renderSessionAction()}
          </div>

          <div className="travel-header district-detail-header">
            <span className="eyebrow">My places</span>
            <h1 id="my-travel-places-title">내가 작성한 맛집·여행지</h1>
            <p>저장한 장소 기록을 최신순으로 모아 보여줍니다.</p>
          </div>

          <section className="travel-place-board">
            {placeMessage && <p className="travel-place-message">{placeMessage}</p>}
            {renderPlaceCategoryFilter(myPlaces)}
            {renderPlaceList(filterPlacesByCategory(myPlaces), {
              editable: false,
              detailEditable: true,
              showLocation: true,
              emptyText: placeCategoryFilter === 'all'
                ? '아직 작성한 맛집·여행지 기록이 없습니다.'
                : '선택한 분류의 기록이 없습니다.',
            })}
          </section>
        </section>
      </main>
    );
  }

  if (selectedRegion && selectedDistrict) {
    const locationName = `${selectedRegion.name} ${selectedDistrict}`;
    const fullQuery = `${locationName} ${searchQuery}`.trim();
    const mapQuery = fullQuery || locationName;
    const searchServices = [
      {
        name: '네이버 지도',
        description: '장소 정보, 리뷰와 영업시간을 확인해요.',
        href: `https://map.naver.com/p/search/${encodeURIComponent(mapQuery)}`,
      },
      {
        name: '구글 지도',
        description: '사진과 방문자 리뷰를 비교해 봐요.',
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
      },
      {
        name: '다음 지도',
        description: '주변 장소와 이동 경로를 함께 살펴봐요.',
        href: `https://map.kakao.com/link/search/${encodeURIComponent(mapQuery)}`,
      },
    ];

    if (isPlaceManagerOpen) {
      return (
        <main className="App">
          <section className="travel-shell district-detail-shell" aria-labelledby="place-manager-title">
            <div className="page-navigation">
              <div className="travel-navigation-actions">
                <button type="button" className="home-button" onClick={onBack}>메인으로</button>
                <button type="button" className="home-button" onClick={() => setIsPlaceManagerOpen(false)}>검색으로</button>
                <button type="button" className="home-button" onClick={() => setSelectedDistrict('')}>{selectedRegion.name} 지역</button>
              </div>
              {renderSessionAction()}
            </div>

            <div className="travel-header district-detail-header">
              <span className="eyebrow">{locationName} · My places</span>
              <h1 id="place-manager-title">나만의 맛집·여행지 작성</h1>
              <p>내가 다녀온 장소를 저장하고, 공개한 기록은 다른 사람도 볼 수 있습니다.</p>
            </div>

            {renderPlaceBoard(locationName)}
          </section>
        </main>
      );
    }

    if (isPublicPlaceListOpen) {
      return (
        <main className="App">
          <section className="travel-shell district-detail-shell" aria-labelledby="public-place-list-title">
            <div className="page-navigation">
              <div className="travel-navigation-actions">
                <button type="button" className="home-button" onClick={onBack}>메인으로</button>
                <button type="button" className="home-button" onClick={() => setIsPublicPlaceListOpen(false)}>검색으로</button>
                <button type="button" className="home-button" onClick={() => setSelectedDistrict('')}>{selectedRegion.name} 지역</button>
              </div>
              {renderSessionAction()}
            </div>

            <div className="travel-header district-detail-header">
              <span className="eyebrow">{locationName} · Shared places</span>
              <h1 id="public-place-list-title">사용자 공개 맛집·여행지</h1>
              <p>이 사이트 사용자가 공개한 {publicPlaces.length.toLocaleString()}개의 장소입니다.</p>
            </div>

            <section className="travel-place-board">
              {renderPlaceCategoryFilter(publicPlaces)}
              {renderPlaceList(filterPlacesByCategory(publicPlaces), {
                editable: false,
                emptyText: placeCategoryFilter === 'all'
                  ? '아직 공개된 맛집·여행지 정보가 없습니다.'
                  : '선택한 분류의 공개 기록이 없습니다.',
              })}
            </section>
          </section>
        </main>
      );
    }

    return (
      <main className="App">
        <section className="travel-shell district-detail-shell" aria-labelledby="district-title">
          <div className="page-navigation">
            <div className="travel-navigation-actions">
              <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
              <button type="button" className="home-button" onClick={() => setSelectedRegion(null)}>전국 지도</button>
              <button type="button" className="home-button" onClick={() => setSelectedDistrict('')}>{selectedRegion.name} 지역</button>
            </div>
            {renderSessionAction()}
          </div>

          <div className="travel-header district-detail-header">
            <span className="eyebrow">{selectedRegion.name} · Travel search</span>
            <h1 id="district-title">{selectedDistrict} 여행·맛집 찾기</h1>
            <p>찾고 싶은 장소나 음식, 여행 테마를 입력하세요.</p>
          </div>

          <div className="travel-place-entry-grid">
            <div className="travel-place-entry">
              <div>
                <strong>나만의 맛집·여행지</strong>
                <span>직접 다녀온 곳을 기록하고 공개할 수 있어요.</span>
              </div>
              <button type="button" onClick={openPlaceManager}>
                작성하기
              </button>
            </div>
            <div className="travel-public-place-entry">
              <div>
                <strong>사용자 공개 리스트 {publicPlaces.length.toLocaleString()}개</strong>
                <span>{publicPlaces.length > 0 ? `${locationName} 공개 기록을 볼 수 있어요.` : '아직 공개된 기록이 없습니다.'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlaceCategoryFilter('all');
                  setIsPublicPlaceListOpen(true);
                }}
                disabled={publicPlaces.length === 0}
              >
                리스트 보기
              </button>
            </div>
          </div>

          <form className="travel-search-form" onSubmit={submitSearch}>
            <span className="travel-search-location">📍 {locationName}</span>
            <div className="travel-search-row">
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="예: 한정식, 바다 전망 카페, 가족 여행"
                aria-label={`${locationName} 여행지와 맛집 검색`}
                autoFocus
                required
              />
              <button type="submit" disabled={isSearching}>{isSearching ? '검색 중' : '검색'}</button>
            </div>
            <div className="travel-quick-keywords" aria-label="추천 검색어">
              {QUICK_KEYWORDS.map((keyword) => (
                <button
                  type="button"
                  key={keyword}
                  onClick={() => {
                    searchPortal(keyword);
                  }}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </form>

          {searchQuery ? (
            <section className="travel-search-results" aria-live="polite">
              <div className="travel-search-results-heading">
                <div>
                  <span className="eyebrow">Search results</span>
                  <h2>‘{fullQuery}’ 검색 결과</h2>
                </div>
                <small>네이버 검색 API 결과를 앱 화면 안에 표시합니다.</small>
              </div>
              {isSearching ? (
                <p className="travel-search-status">검색 결과를 불러오는 중입니다.</p>
              ) : searchError ? (
                <p className="travel-search-status error">{searchError}</p>
              ) : (
                <div className="portal-result-sections">
                  {searchResults.map((section) => (
                    <section className={`portal-result-section section-${section.id} ${section.id === 'local' && isLocalExpanded ? 'local-expanded' : ''}`} key={section.id}>
                      <div className="portal-result-section-header">
                        <h3>{section.label}</h3>
                        <div className="portal-result-section-actions">
                          {section.id === 'local' && section.ok && section.items.length > 0 && (
                            <button type="button" onClick={() => setIsLocalExpanded((expanded) => !expanded)}>
                              {isLocalExpanded ? '지역 접기' : '지역 보기'}
                            </button>
                          )}
                          <span>{section.ok ? `${section.total.toLocaleString()}건` : `오류 ${section.status}`}</span>
                        </div>
                      </div>
                      {section.id === 'local' && section.ok && section.items.length > 0 && !isLocalExpanded ? (
                        <p className="portal-result-empty">지역 결과는 ‘지역 보기’를 누르면 펼쳐집니다.</p>
                      ) : section.ok && section.items.length > 0 ? (
                        <>
                          <div className="portal-result-list">
                            {section.items.map((item, index) => {
                              const title = getResultTitle(item);
                              const description = getResultDescription(item);
                              const link = getResultLink(item);

                              return (
                                <a
                                  className="portal-result-card"
                                  href={link || `https://search.naver.com/search.naver?query=${encodeURIComponent(fullQuery)}`}
                                  key={`${section.id}-${link || title}-${index}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <strong>{title || '제목 없음'}</strong>
                                  {description && <span>{description}</span>}
                                  {item.bloggername && <small>{stripNaverText(item.bloggername)}</small>}
                                  {item.postdate && <small>{item.postdate}</small>}
                                </a>
                              );
                            })}
                          </div>
                          {section.items.length < Math.min(section.total, 1000) && (
                            <button
                              className="portal-result-more"
                              type="button"
                              onClick={() => loadMoreSection(section)}
                              disabled={loadingSectionId === section.id}
                            >
                              {loadingSectionId === section.id ? '불러오는 중' : `${section.label} 다음 결과 더 보기`}
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="portal-result-empty">{section.message || '표시할 결과가 없습니다.'}</p>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <div className="travel-search-empty">
              <span>🔎</span>
              <strong>{selectedDistrict}에서 무엇을 찾아볼까요?</strong>
              <p>검색어를 입력하거나 추천 검색어를 선택해 보세요.</p>
            </div>
          )}

          <section className="travel-map-links" aria-labelledby="map-links-title">
            <div className="travel-search-results-heading">
              <div>
                <span className="eyebrow">Map search</span>
                <h2 id="map-links-title">지도에서 다시 보기</h2>
              </div>
              <small>현재 지역과 검색어를 지도 서비스에서 바로 열 수 있습니다.</small>
            </div>
            <div className="travel-search-service-grid">
              {searchServices.map((service) => (
                <a key={service.name} href={service.href} target="_blank" rel="noreferrer">
                  <strong>{service.name}</strong>
                  <span>{service.description}</span>
                  <i>지도 검색 보기 →</i>
                </a>
              ))}
            </div>
          </section>
        </section>
      </main>
    );
  }

  if (selectedRegion) {
    return (
      <main className="App">
        <section className="travel-shell" aria-labelledby="region-title">
          <div className="page-navigation">
            <div className="travel-navigation-actions">
              <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
              <button type="button" className="home-button" onClick={() => setSelectedRegion(null)}>전국 지도</button>
            </div>
            {renderSessionAction()}
          </div>
          <div className="travel-header">
            <span className="eyebrow">{selectedRegion.type} · Choose an area</span>
            <h1 id="region-title">{selectedRegion.name} 세부 지역</h1>
          </div>
          <p className="district-count-guide">숫자가 표시된 지역은 사이트 사용자가 공개한 맛집·여행지 기록이 있는 곳입니다.</p>
          <div className="district-grid">
            {selectedRegion.districts.map((district) => {
              const publicCount = districtPublicCounts[district] || 0;

              return (
                <button type="button" key={district} onClick={() => openDistrict(district)}>
                  <span className="district-name-row">
                    <span>{district}</span>
                    {publicCount > 0 && <em>{publicCount.toLocaleString()}</em>}
                  </span>
                  <small>코스 보기 →</small>
                </button>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="App">
      <section className="travel-shell" aria-labelledby="travel-title">
        <div className="page-navigation">
          <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
          {renderSessionAction()}
        </div>
        <div className="travel-header">
          <span className="eyebrow">Travel course</span>
          <h1 id="travel-title">지역별 여행·맛집 코스</h1>
          <p>전국 17개 시·도 중 여행할 지역을 선택하세요.</p>
        </div>
        <div className="korea-map-layout">
          <div className="korea-map" aria-label="대한민국 17개 시·도 행정구역 지도">
            <div className="korea-map-art">
              <img src="/korea-administrative-map.svg" alt="제주도를 포함한 대한민국 시·도 행정구역 지도" />
              {REGIONS.map((region) => {
                const [x, y] = LABEL_POSITIONS[region.id] ?? [region.x, region.y];
                return (
                  <button type="button" key={region.id} className={`city-marker region-${region.id}`} style={{ left: `${x}%`, top: `${y}%` }} onClick={() => openRegion(region)} aria-label={`${region.name} 선택`}>
                    <span>{region.name}</span>
                  </button>
                );
              })}
            </div>
            <a className="korea-map-credit" href="https://commons.wikimedia.org/wiki/File:Administrative_divisions_map_of_South_Korea.svg" target="_blank" rel="noreferrer">지도: Dmthoth · CC BY-SA 3.0</a>
          </div>
          <aside className="city-guide">
            <span className="eyebrow">17 Regions</span>
            <h2>어디로 떠날까요?</h2>
            <p>지도 위 행정구역 이름이나 아래 목록을 누르면 시·군·구 선택 화면으로 이동합니다.</p>
            <div className="city-button-list region-button-list">
              {REGIONS.map((region) => (
                <button type="button" key={region.id} onClick={() => openRegion(region)}>
                  <span>{region.name}</span><small>{region.districts.length}개 지역</small><i>→</i>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default TravelCoursePage;
