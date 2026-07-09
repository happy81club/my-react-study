import { useEffect, useState } from 'react';

const getStorageKey = (userId) => `my-react-study-english-words-${userId}`;

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readSavedWords = (userId) => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const words = JSON.parse(window.localStorage.getItem(getStorageKey(userId)));
    return Array.isArray(words)
      ? words.map((word) => ({ ...word, date: word.date || getToday() }))
      : [];
  } catch {
    return [];
  }
};

const createId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getAdaptiveFontSize = (text, language) => {
  const length = Array.from(text).length;
  const maxSize = language === 'korean' ? 64 : 72;
  const minSize = language === 'korean' ? 22 : 24;
  const characterWidth = language === 'korean' ? 1 : 0.62;
  const calculatedSize = 500 / Math.max(length * characterWidth, 1);
  const fontSize = Math.round(Math.min(maxSize, Math.max(minSize, calculatedSize)));

  return {
    fontSize: `min(${fontSize}px, 10vw)`,
  };
};

const numberToEnglish = (number) => {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = {
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
    13: 'thirteen',
    14: 'fourteen',
    15: 'fifteen',
    16: 'sixteen',
    17: 'seventeen',
    18: 'eighteen',
    19: 'nineteen',
  };
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (number === 100) {
    return 'one hundred';
  }

  if (number < 10) {
    return ones[number];
  }

  if (number < 20) {
    return teens[number];
  }

  const ten = tens[Math.floor(number / 10)];
  const one = ones[number % 10];
  return one ? `${ten}-${one}` : ten;
};

const DEFAULT_WORD_GROUPS = [
  {
    id: 'numbers',
    icon: '123',
    title: '숫자',
    words: Array.from({ length: 100 }, (_, index) => [
      numberToEnglish(index + 1),
      String(index + 1),
    ]),
  },
  {
    id: 'fruits',
    icon: '🍎',
    title: '과일',
    words: [
      ['apple', '사과'], ['banana', '바나나'], ['orange', '오렌지'], ['grape', '포도'],
      ['strawberry', '딸기'], ['watermelon', '수박'], ['peach', '복숭아'], ['pear', '배'],
      ['pineapple', '파인애플'], ['mango', '망고'], ['lemon', '레몬'], ['lime', '라임'],
      ['cherry', '체리'], ['blueberry', '블루베리'], ['raspberry', '라즈베리'],
      ['blackberry', '블랙베리'], ['kiwi', '키위'], ['melon', '멜론'],
      ['coconut', '코코넛'], ['papaya', '파파야'], ['plum', '자두'], ['apricot', '살구'],
      ['persimmon', '감'], ['pomegranate', '석류'], ['fig', '무화과'],
      ['avocado', '아보카도'], ['grapefruit', '자몽'], ['tangerine', '귤'],
      ['dragon fruit', '용과'], ['passion fruit', '패션프루트'], ['lychee', '리치'],
    ],
  },
  {
    id: 'dates',
    icon: 'MON',
    title: '날짜·요일',
    words: [
      ['today', '오늘'], ['tomorrow', '내일'], ['yesterday', '어제'], ['Monday', '월요일'],
      ['Tuesday', '화요일'], ['Wednesday', '수요일'], ['Thursday', '목요일'],
      ['Friday', '금요일'], ['Saturday', '토요일'], ['Sunday', '일요일'],
      ['January', '1월'], ['February', '2월'], ['March', '3월'], ['April', '4월'],
      ['May', '5월'], ['June', '6월'], ['July', '7월'], ['August', '8월'],
      ['September', '9월'], ['October', '10월'], ['November', '11월'], ['December', '12월'],
    ],
  },
  {
    id: 'greetings',
    icon: 'Hi',
    title: '기본 인사',
    words: [
      ['hello', '안녕하세요'], ['thank you', '감사합니다'], ['sorry', '미안합니다'],
      ['please', '부탁합니다'], ['goodbye', '안녕히 가세요'], ['nice to meet you', '만나서 반갑습니다'],
    ],
  },
  {
    id: 'daily',
    icon: 'ABC',
    title: '생활 단어',
    words: [
      ['water', '물'], ['food', '음식'], ['home', '집'], ['school', '학교'],
      ['work', '일'], ['friend', '친구'], ['family', '가족'], ['time', '시간'],
      ['morning', '아침'], ['afternoon', '오후'], ['evening', '저녁'], ['night', '밤'],
      ['breakfast', '아침 식사'], ['lunch', '점심 식사'], ['dinner', '저녁 식사'],
      ['house', '주택'], ['room', '방'], ['door', '문'], ['window', '창문'],
      ['table', '탁자'], ['chair', '의자'], ['phone', '전화기'], ['computer', '컴퓨터'],
      ['book', '책'], ['bag', '가방'], ['clothes', '옷'], ['shoes', '신발'],
      ['car', '자동차'], ['bus', '버스'], ['subway', '지하철'],
    ],
  },
];

function EnglishMemoryPage({ user, token, onBack, onLogout }) {
  const [english, setEnglish] = useState('');
  const [korean, setKorean] = useState('');
  const [selectedDate, setSelectedDate] = useState(getToday);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = getToday().split('-').map(Number);
    return new Date(year, month - 1, 1);
  });
  const [words, setWords] = useState([]);
  const [isLoadingWords, setIsLoadingWords] = useState(true);
  const [wordMessage, setWordMessage] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(2);
  const [displayLanguage, setDisplayLanguage] = useState('both');
  const [studyWords, setStudyWords] = useState([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [voiceRate, setVoiceRate] = useState(0.9);

  const selectedWords = words.filter((word) => word.date === selectedDate);
  const currentWord = studyWords[currentIndex];
  const shouldUseVoice = isVoiceEnabled && displayLanguage !== 'korean';
  const datesWithWords = new Set(words.map((word) => word.date));
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const firstDay = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarCells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => (
      `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`
    )),
  ];

  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  useEffect(() => {
    let isMounted = true;

    const loadWords = async () => {
      setIsLoadingWords(true);
      setWordMessage('');

      try {
        const response = await fetch('/api/words', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('단어 목록을 불러오지 못했습니다.');
        }

        let savedWords = await response.json();

        if (!Array.isArray(savedWords)) {
          throw new Error('잘못된 단어 목록입니다.');
        }

        const legacyWords = readSavedWords(user.id);

        if (savedWords.length === 0 && legacyWords.length > 0) {
          const migratedWords = legacyWords.map((word) => ({
            ...word,
            userId: user.id,
          }));
          const migrationResponse = await fetch('/api/words', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(migratedWords),
          });

          if (!migrationResponse.ok) {
            throw new Error('기존 단어를 서버로 옮기지 못했습니다.');
          }

          savedWords = migratedWords;
          window.localStorage.removeItem(getStorageKey(user.id));
        }

        if (isMounted) {
          setWords(savedWords);
        }
      } catch (error) {
        if (isMounted) {
          setWordMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingWords(false);
        }
      }
    };

    loadWords();

    return () => {
      isMounted = false;
    };
  }, [token, user.id]);

  useEffect(() => {
    if (!isPlaying || shouldUseVoice || studyWords.length === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % studyWords.length);
    }, intervalSeconds * 1000);

    return () => window.clearInterval(timer);
  }, [intervalSeconds, isPlaying, shouldUseVoice, studyWords.length]);

  useEffect(() => {
    if (
      !isStudying
      || !isPlaying
      || !shouldUseVoice
      || !currentWord
      || !('speechSynthesis' in window)
    ) {
      return undefined;
    }

    let isCancelled = false;
    const speech = new SpeechSynthesisUtterance(currentWord.english);
    const englishVoices = window.speechSynthesis
      .getVoices()
      .filter((voice) => voice.lang.toLowerCase().startsWith('en'));

    speech.lang = 'en-US';
    speech.rate = voiceRate;

    if (englishVoices.length > 0) {
      speech.voice = englishVoices.find((voice) => voice.lang === 'en-US') || englishVoices[0];
    }

    speech.onend = () => {
      if (!isCancelled) {
        setCurrentIndex((index) => (index + 1) % studyWords.length);
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);

    return () => {
      isCancelled = true;
      window.speechSynthesis.cancel();
    };
  }, [currentWord, isPlaying, isStudying, shouldUseVoice, studyWords.length, voiceRate]);

  const saveWords = async (nextWords) => {
    const response = await fetch('/api/words', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nextWords),
    });

    if (!response.ok) {
      throw new Error('단어 저장에 실패했습니다.');
    }
  };

  const addWord = async (event) => {
    event.preventDefault();

    const trimmedEnglish = english.trim();
    const trimmedKorean = korean.trim();

    if (!trimmedEnglish || !trimmedKorean) {
      return;
    }

    const nextWords = [
      ...words,
      {
        id: createId(),
        userId: user.id,
        english: trimmedEnglish,
        korean: trimmedKorean,
        date: selectedDate,
      },
    ];

    setWordMessage('');

    try {
      await saveWords(nextWords);
      setWords(nextWords);
      setEnglish('');
      setKorean('');
    } catch (error) {
      setWordMessage(error.message);
    }
  };

  const beginStudy = (nextStudyWords) => {
    if (nextStudyWords.length === 0) {
      return;
    }

    setStudyWords(nextStudyWords);
    setCurrentIndex(0);
    setIsStudying(true);
    setIsPlaying(true);
  };

  const startMemory = () => beginStudy(selectedWords);

  const startDefaultGroup = (group) => {
    beginStudy(group.words.map(([defaultEnglish, defaultKorean], index) => ({
      id: `default-${group.id}-${index}`,
      english: defaultEnglish,
      korean: defaultKorean,
    })));
  };

  const exitStudy = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setIsStudying(false);
  };

  const selectWordDate = (date) => {
    setSelectedDate(date);
  };

  const moveToToday = () => {
    const today = getToday();
    const [year, month] = today.split('-').map(Number);
    setSelectedDate(today);
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  if (isStudying && currentWord) {
    return (
      <main className="App study-page">
        <section className="study-shell" aria-labelledby="study-word">
          <div className="study-progress">
            <span>{isPlaying ? '영어 암기 중' : '일시 중지'}</span>
            <strong>{currentIndex + 1} / {studyWords.length}</strong>
          </div>

          <div className="language-toggle" role="group" aria-label="표시 언어">
            <button
              type="button"
              className={displayLanguage === 'english' ? 'active' : ''}
              onClick={() => setDisplayLanguage('english')}
            >
              영어
            </button>
            <button
              type="button"
              className={displayLanguage === 'both' ? 'active' : ''}
              onClick={() => setDisplayLanguage('both')}
            >
              영어/한글
            </button>
            <button
              type="button"
              className={displayLanguage === 'korean' ? 'active' : ''}
              onClick={() => setDisplayLanguage('korean')}
            >
              한글
            </button>
          </div>

          <div className="speech-controls">
            <button
              type="button"
              className={shouldUseVoice ? 'active' : ''}
              onClick={() => setIsVoiceEnabled((enabled) => !enabled)}
              disabled={!('speechSynthesis' in window)}
            >
              {displayLanguage === 'korean'
                ? '🔇 한글 모드 음성 없음'
                : isVoiceEnabled
                  ? '🔊 영어 음성 켜짐'
                  : '🔇 영어 음성 꺼짐'}
            </button>
            <label>
              <span>발음 속도</span>
              <select value={voiceRate} onChange={(event) => setVoiceRate(Number(event.target.value))}>
                <option value={0.7}>느리게</option>
                <option value={0.9}>보통</option>
                <option value={1.1}>빠르게</option>
              </select>
            </label>
          </div>

          <div className="study-card" aria-live="polite">
            {displayLanguage === 'english' && (
              <>
                <span>ENGLISH</span>
                <h1 id="study-word" style={getAdaptiveFontSize(currentWord.english, 'english')}>
                  {currentWord.english}
                </h1>
              </>
            )}
            {displayLanguage === 'korean' && (
              <>
                <span>KOREAN</span>
                <p
                  id="study-word"
                  className="study-korean-word"
                  style={getAdaptiveFontSize(currentWord.korean, 'korean')}
                >
                  {currentWord.korean}
                </p>
              </>
            )}
            {displayLanguage === 'both' && (
              <>
                <span>ENGLISH</span>
                <h1 id="study-word" style={getAdaptiveFontSize(currentWord.english, 'english')}>
                  {currentWord.english}
                </h1>
                <div className="study-divider" />
                <span>KOREAN</span>
                <p
                  className="study-korean-word"
                  style={getAdaptiveFontSize(currentWord.korean, 'korean')}
                >
                  {currentWord.korean}
                </p>
              </>
            )}
          </div>

          <div className="study-controls">
            <button
              type="button"
              className="stop-memory-button"
              onClick={() => setIsPlaying((playing) => !playing)}
            >
              {isPlaying ? '중지' : '다시 시작'}
            </button>
            <label className="interval-control">
              <span>전환 시간</span>
              <select
                value={intervalSeconds}
                onChange={(event) => setIntervalSeconds(Number(event.target.value))}
                aria-label="단어 전환 시간"
                disabled={shouldUseVoice}
              >
                {Array.from({ length: 10 }, (_, index) => index + 1).map((seconds) => (
                  <option key={seconds} value={seconds}>{seconds}초</option>
                ))}
              </select>
            </label>
          </div>
          <p className="study-hint">
            {!isPlaying
              ? '멈춘 단어부터 다시 시작할 수 있습니다.'
              : shouldUseVoice
                ? '영어 음성 지원 중에는 전환 시간을 선택할 수 없습니다. 발음이 끝나면 다음 단어로 이동합니다.'
                : `${intervalSeconds}초마다 다음 단어로 자동 이동합니다.`}
          </p>
          <button type="button" className="exit-study-button" onClick={exitStudy}>
            영어 입력 화면으로
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="App">
      <section className="english-shell" aria-labelledby="english-title">
        <div className="page-navigation">
          <button type="button" className="home-button" onClick={onBack}>
            ← 메인으로
          </button>
          <button type="button" className="text-logout-button" onClick={onLogout}>로그아웃</button>
        </div>

        <div className="english-header">
          <span className="eyebrow">English memory</span>
          <h1 id="english-title">영어 암기</h1>
          <p>외우고 싶은 영어 단어와 한글 뜻을 등록해 보세요.</p>
        </div>

        <div className="english-dashboard">
          <section className="word-calendar" aria-label="단어 날짜 선택">
          <div className="word-calendar-header">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))}
              aria-label="이전 달"
            >
              ‹
            </button>
            <strong>{calendarYear}년 {calendarMonthIndex + 1}월</strong>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))}
              aria-label="다음 달"
            >
              ›
            </button>
          </div>
          <div className="word-calendar-grid word-calendar-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="word-calendar-grid">
            {calendarCells.map((date, index) => (
              <button
                type="button"
                key={`${date || 'empty'}-${index}`}
                className={`${date === selectedDate ? 'selected' : ''} ${date === getToday() ? 'today' : ''}`}
                onClick={() => date && selectWordDate(date)}
                disabled={!date}
              >
                {date && <span>{Number(date.slice(-2))}</span>}
                {date && datesWithWords.has(date) && <i aria-label="등록된 단어 있음" />}
              </button>
            ))}
          </div>
          <div className="word-calendar-selection">
            <span>선택한 날짜</span>
            <strong>{selectedDate}</strong>
            <button type="button" onClick={moveToToday}>오늘</button>
          </div>
          </section>

          <section className="default-word-groups" aria-labelledby="default-groups-title">
            <div className="default-groups-header">
              <span className="eyebrow">Quick start</span>
              <h2 id="default-groups-title">기본 단어로 시작</h2>
              <p>알아두면 좋은 단어 묶음을 바로 학습해 보세요.</p>
            </div>
            <div className="default-group-list">
              {DEFAULT_WORD_GROUPS.map((group) => (
                <button type="button" key={group.id} onClick={() => startDefaultGroup(group)}>
                  <span className="default-group-icon" aria-hidden="true">{group.icon}</span>
                  <span>
                    <strong>{group.title}</strong>
                    <small>/ {group.words.length}개 단어</small>
                  </span>
                  <i aria-hidden="true">→</i>
                </button>
              ))}
            </div>
          </section>
        </div>

        <form className="word-form" onSubmit={addWord}>
          <label>
            <span>영어 단어</span>
            <input
              value={english}
              onChange={(event) => setEnglish(event.target.value)}
              placeholder="예: apple"
              autoComplete="off"
              lang="en"
              inputMode="text"
              autoCapitalize="none"
              required
            />
          </label>
          <label>
            <span>한글 뜻</span>
            <input
              value={korean}
              onChange={(event) => setKorean(event.target.value)}
              placeholder="예: 사과"
              autoComplete="off"
              lang="ko"
              inputMode="text"
              required
            />
          </label>
          <button type="submit" className="add-word-button">추가</button>
        </form>

        {wordMessage && <p className="word-message">{wordMessage}</p>}

        <div className="memory-controls">
          <div>
            <span>등록한 단어</span>
            <strong>{selectedWords.length}개</strong>
          </div>
          <button type="button" className="start-memory-button" onClick={startMemory} disabled={selectedWords.length === 0}>
            시작
          </button>
        </div>

        <section className="word-list-section" aria-labelledby="word-list-title">
          <h2 id="word-list-title">단어 목록</h2>
          {isLoadingWords ? (
            <p className="empty-state">저장된 단어를 불러오는 중입니다.</p>
          ) : selectedWords.length > 0 ? (
            <ul className="word-list">
              {selectedWords.map((word, index) => (
                <li key={word.id}>
                  <span>{index + 1}</span>
                  <strong>{word.english}</strong>
                  <p>{word.korean}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">아직 등록한 단어가 없습니다.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export default EnglishMemoryPage;
