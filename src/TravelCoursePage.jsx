import { useState } from 'react';

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

function TravelCoursePage({ onBack, onLogout }) {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const openRegion = (region) => {
    setSelectedRegion(region);
    setSelectedDistrict('');
  };

  if (selectedRegion) {
    return (
      <main className="App">
        <section className="travel-shell" aria-labelledby="region-title">
          <div className="page-navigation">
            <button type="button" className="home-button" onClick={() => setSelectedRegion(null)}>← 전국 지도</button>
            <button type="button" className="text-logout-button" onClick={onLogout}>로그아웃</button>
          </div>
          <div className="travel-header">
            <span className="eyebrow">{selectedRegion.type} · Choose an area</span>
            <h1 id="region-title">{selectedRegion.name} 세부 지역</h1>
            <p>여행·맛집 코스를 살펴볼 시·군·구를 선택하세요.</p>
          </div>
          <div className="district-grid">
            {selectedRegion.districts.map((district) => (
              <button type="button" key={district} className={selectedDistrict === district ? 'selected' : ''} onClick={() => setSelectedDistrict(district)}>
                <span>{district}</span><small>코스 보기 →</small>
              </button>
            ))}
          </div>
          {selectedDistrict && (
            <div className="district-selection" role="status">
              <strong>{selectedRegion.name} {selectedDistrict}</strong>
              <span>여행지와 맛집 코스를 준비할 지역으로 선택했습니다.</span>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="App">
      <section className="travel-shell" aria-labelledby="travel-title">
        <div className="page-navigation">
          <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
          <button type="button" className="text-logout-button" onClick={onLogout}>로그아웃</button>
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
