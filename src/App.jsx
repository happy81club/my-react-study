import { useEffect, useState } from 'react';
import './App.css';
import AccountSettingsPage from './AccountSettingsPage.jsx';
import EnglishMemoryPage from './EnglishMemoryPage.jsx';
import LoginPage, { AUTH_SESSION_KEY } from './LoginPage.jsx';
import OracleUsersPage from './OracleUsersPage.jsx';
import TravelCoursePage from './TravelCoursePage.jsx';

// 개발 서버 프록시를 통해 JSON 파일 저장 API에 연결
const API_URL = '/api/todos';
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const SESSION_REFRESH_INTERVAL_MS = 60 * 1000;

// 화면에 출력할 문자열을 모아둔 객체
// 다국어 지원이나 텍스트 변경 시 이곳만 수정하면 됨
const copy = {
  initialTodos: ['React 공부하기', '블로그 글쓰기'],
  emptyInput: '할 일을 입력해 주세요.',
  added: '새 할 일을 추가했어요.',
  removed: '할 일을 삭제했어요.',
  completed: '완료 상태를 변경했어요.',
  edited: '할 일을 수정했어요.',
  saved: '목록이 저장되었습니다.',
  close: '알림 닫기',
  loadFailed: '저장된 목록을 불러오지 못했어요.',
  saveFailed: '목록 저장에 실패했어요.',
  eyebrow: '오늘의 집중',
  title: '나의 할 일 목록',
  subtitle: '작게 적고, 가볍게 끝내는 하루의 체크리스트',
  placeholder: '할 일을 입력해주세요',
  newTask: '새 할 일',
  selectedDate: '할 일 날짜',
  add: '추가',
  save: '저장',
  edit: '수정',
  cancel: '취소',
  openTasks: '남은 할 일',
  showOpenOnly: '미완료만 보기',
  delete: '삭제',
  empty: '오늘 할 일을 입력해 주세요',
  emptyFiltered: '남은 할 일이 없습니다.',
};

const readSavedSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const savedSession = window.sessionStorage.getItem(AUTH_SESSION_KEY);

  if (!savedSession) {
    return null;
  }

  try {
    return JSON.parse(savedSession);
  } catch {
    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
};

const readJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
// 날짜 비교와 로컬 스토리지 저장 포맷을 통일하기 위해 사용
const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 브라우저 환경에서 사용할 고유 ID 생성
// crypto.randomUUID가 없으면 폴백으로 시간 + 랜덤 문자열 사용
const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

function App() {
  // 컴포넌트 상태
  // selectedDate: 현재 선택된 날짜
  // todos: 전체 투두 목록
  // text: 새 할 일 입력값
  // notification: 화면에 표시할 상태 메시지
  // notificationPos: 알림 표시 위치 좌표
  // calendarMonth: 달력에서 현재 보여줄 달
  const [authSession, setAuthSession] = useState(readSavedSession);
  const [isCheckingSession, setIsCheckingSession] = useState(() => Boolean(readSavedSession()));
  const [activePage, setActivePage] = useState('home');
  const [pendingProtectedPage, setPendingProtectedPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [todos, setTodos] = useState([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [text, setText] = useState('');
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [notification, setNotification] = useState('');
  const [notificationPos, setNotificationPos] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date(getToday());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // 선택한 날짜에 해당하는 투두만 화면에 표시
  // today 변수는 미래 일정 판단과 today 기준 표시용
  const selectedDateTodos = todos.filter((todo) => todo.date === selectedDate);
  const visibleTodos = showOpenOnly
    ? selectedDateTodos.filter((todo) => !todo.done)
    : selectedDateTodos;
  const today = getToday();
  const remainingCount = selectedDateTodos.filter((todo) => !todo.done).length;
  const addedCount = selectedDateTodos.length;
  const todosByDate = new Set(todos.map((todo) => todo.date));
  const currentUser = authSession?.user;

  const openProtectedPage = (page) => {
    if (currentUser) {
      setActivePage(page);
      return;
    }

    setPendingProtectedPage(page);
    setActivePage('login');
  };

  // 현재 달력 페이지의 년/월 정보 계산
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const firstOfMonth = new Date(calendarYear, calendarMonthIndex, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarCells = [];

  // 달력의 첫째 주 비어있는 앞부분 채우기
  for (let i = 0; i < startDay; i += 1) {
    calendarCells.push(null);
  }

  // 해당 월의 날짜를 YYYY-MM-DD 문자열로 변환하여 배열에 추가
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateString = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push(dateString);
  }

  // 마지막 주 빈 칸 채우기
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  // 이전 달 / 다음 달로 이동하는 버튼 핸들러
  const goPrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formatMonthLabel = () => `${calendarYear}년 ${calendarMonthIndex + 1}월`;

  const selectDate = (dateString) => {
    const selected = new Date(dateString);
    setSelectedDate(dateString);
    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  };

  const authHeaders = authSession?.token
    ? { Authorization: `Bearer ${authSession.token}` }
    : {};

  useEffect(() => {
    if (!authSession?.token) {
      return undefined;
    }

    let isMounted = true;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/session', {
          headers: {
            Authorization: `Bearer ${authSession.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const session = await readJsonResponse(response);

        if (!session?.token || !session?.user || !session?.expiresAt) {
          throw new Error('Invalid session response');
        }

        if (isMounted) {
          window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
          setAuthSession(session);
        }
      } catch {
        if (isMounted) {
          window.sessionStorage.removeItem(AUTH_SESSION_KEY);
          setAuthSession(null);
          setActivePage('home');
          setTodos([]);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [authSession?.token]);

  useEffect(() => {
    if (!authSession?.token) {
      return undefined;
    }

    let idleTimer;
    let lastRefreshAt = Date.now();
    let isRefreshing = false;

    const expireSession = () => {
      fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authSession.token}` },
      }).catch(() => {});
      window.sessionStorage.removeItem(AUTH_SESSION_KEY);
      setAuthSession(null);
      setActivePage('home');
      setTodos([]);
      setIsLoadingTodos(false);
    };

    const refreshSession = async () => {
      if (isRefreshing || Date.now() - lastRefreshAt < SESSION_REFRESH_INTERVAL_MS) {
        return;
      }

      isRefreshing = true;

      try {
        const response = await fetch('/api/session', {
          headers: { Authorization: `Bearer ${authSession.token}` },
        });

        if (!response.ok) {
          expireSession();
          return;
        }

        const session = await readJsonResponse(response);

        if (session?.token && session?.user && session?.expiresAt) {
          window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
          setAuthSession(session);
          lastRefreshAt = Date.now();
        }
      } catch {
        // 네트워크가 잠시 끊긴 경우 다음 사용자 활동 때 다시 갱신한다.
      } finally {
        isRefreshing = false;
      }
    };

    const registerActivity = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(expireSession, IDLE_TIMEOUT_MS);
      refreshSession();
    };

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true });
    });
    registerActivity();

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
    };
  }, [authSession?.token]);

  // 서버의 JSON 파일에서 투두 목록을 불러옴
  useEffect(() => {
    if (!authSession?.token || isCheckingSession || activePage !== 'todos') {
      return undefined;
    }

    let isMounted = true;

    const loadTodos = async () => {
      setIsLoadingTodos(true);

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${authSession.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load todos');
        }

        const savedTodos = await readJsonResponse(response);

        if (!Array.isArray(savedTodos)) {
          throw new Error('Invalid todo response');
        }

        if (isMounted) {
          setTodos(savedTodos);
        }
      } catch {
        if (isMounted) {
          setTodos(copy.initialTodos.map((item) => ({ id: generateId(), text: item, date: getToday(), done: false })));
          setNotification(copy.loadFailed);
        }
      } finally {
        if (isMounted) {
          setIsLoadingTodos(false);
        }
      }
    };

    loadTodos();

    return () => {
      isMounted = false;
    };
  }, [authSession?.token, isCheckingSession, activePage]);

  const saveTodos = async (nextTodos) => {
    const previousTodos = todos;
    setTodos(nextTodos);

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(nextTodos),
      });

      if (!response.ok) {
        throw new Error('Failed to save todos');
      }
    } catch {
      setTodos(previousTodos);
      setNotification(copy.saveFailed);
    }
  };

  // 화면에 알림 메시지를 표시하고 위치를 잡음
  // 알림 메시지를 화면에 노출하고, 알림 위치를 anchor 요소 기준으로 설정
  const showNotification = (message, anchor) => {
    setNotification(message);

    if (anchor && anchor instanceof HTMLElement) {
      const appElement = document.querySelector('.App');
      const anchorRect = anchor.getBoundingClientRect();

      if (appElement) {
        const appRect = appElement.getBoundingClientRect();
        setNotificationPos({
          top: anchorRect.top - appRect.top,
          left: anchorRect.left - appRect.left + anchorRect.width / 2,
        });
        return;
      }
    }

    setNotificationPos(null);
  };

  const closeNotification = () => {
    setNotification('');
    setNotificationPos(null);
  };

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setNotification('');
      setNotificationPos(null);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notification]);

  const onAdd = (anchor) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      showNotification(copy.emptyInput, anchor);
      return;
    }

    saveTodos([...todos, { id: generateId(), userId: currentUser.id, text: trimmedText, date: selectedDate, done: false }]);
    setText('');
    showNotification(copy.added, anchor);
  };

  // 입력 폼 제출 핸들러: 엔터 또는 버튼 클릭 시 onAdd 호출
  const onSubmit = (event) => {
    event.preventDefault();
    onAdd(event.submitter || event.currentTarget.querySelector('.add-btn'));
  };

  // 삭제 버튼 클릭 시 해당 투두를 제거
  const onDelete = (targetId, anchor) => {
    saveTodos(todos.filter((todo) => todo.id !== targetId));
    if (editingTodoId === targetId) {
      setEditingTodoId(null);
      setEditingText('');
    }
    showNotification(copy.removed, anchor);
  };

  // 투두 완료 토글 처리: 미래 일정은 처리하지 않음
  const onToggleComplete = (targetId, anchor) => {
    const targetTodo = todos.find((todo) => todo.id === targetId);
    if (targetTodo?.date > today) {
      showNotification('미래 일정은 완료할 수 없습니다.', anchor);
      return;
    }

    saveTodos(
      todos.map((todo) =>
        todo.id === targetId
          ? { ...todo, done: !todo.done }
          : todo
      )
    );
    showNotification(copy.completed, anchor);
  };

  const onStartEdit = (todo) => {
    setEditingTodoId(todo.id);
    setEditingText(todo.text);
  };

  const onCancelEdit = () => {
    setEditingTodoId(null);
    setEditingText('');
  };

  const onSaveEdit = (targetId, anchor) => {
    const trimmedText = editingText.trim();

    if (!trimmedText) {
      showNotification(copy.emptyInput, anchor);
      return;
    }

    saveTodos(
      todos.map((todo) =>
        todo.id === targetId
          ? { ...todo, text: trimmedText }
          : todo
      )
    );
    setEditingTodoId(null);
    setEditingText('');
    showNotification(copy.edited, anchor);
  };

  const onEditKeyDown = (event, targetId) => {
    if (event.key === 'Enter') {
      onSaveEdit(targetId, event.currentTarget);
    }

    if (event.key === 'Escape') {
      onCancelEdit();
    }
  };

  // 오늘 버튼이나 초기 상태에서 선택 날짜를 오늘로 이동
  const onToday = () => {
    selectDate(getToday());
  };

  const onLogout = async () => {
    if (authSession?.token) {
      await fetch('/api/logout', {
        method: 'POST',
        headers: authHeaders,
      }).catch(() => {});
    }

    window.sessionStorage.removeItem(AUTH_SESSION_KEY);
    setAuthSession(null);
    setActivePage('home');
    setPendingProtectedPage('home');
    setTodos([]);
    setIsLoadingTodos(false);
  };

  if (isCheckingSession) {
    return (
      <main className="App">
        <section className="auth-shell">
          <p className="empty-state">로그인 상태를 확인하는 중입니다.</p>
        </section>
      </main>
    );
  }

  if (activePage === 'login') {
    const loginPrompt = pendingProtectedPage === 'travel'
      ? '로그인하면 다른 기능도 함께 사용할 수 있습니다.'
      : pendingProtectedPage === 'myTravelPlaces'
        ? '내가 작성한 맛집·여행지는 로그인 후 볼 수 있습니다.'
      : '이 기능은 로그인 후 사용할 수 있습니다.';

    return (
      <LoginPage
        onBack={() => setActivePage('home')}
        prompt={loginPrompt}
        onLogin={(session) => {
          setAuthSession(session);
          setActivePage(pendingProtectedPage === 'home' ? 'home' : pendingProtectedPage);
          setPendingProtectedPage('home');
        }}
      />
    );
  }

  if (activePage === 'home') {
    return (
      <main className="App">
        <section className="home-shell" aria-labelledby="home-title">
          <div className="home-header">
            <div className="user-bar">
              <span className="eyebrow">{currentUser ? `${currentUser.name}님, 반가워요` : '둘러보기 모드'}</span>
              {currentUser ? (
                <div className="user-actions">
                  <button type="button" onClick={() => setActivePage('settings')}>설정</button>
                  <button type="button" onClick={onLogout}>로그아웃</button>
                </div>
              ) : (
                <button type="button" onClick={() => setActivePage('login')}>로그인</button>
              )}
            </div>
            <h1 id="home-title">하루모아</h1>
            <p>여행부터 생활 정보와 나의 기록까지, 필요한 하루를 한곳에서.</p>
          </div>

          <div className="feature-grid" aria-label="기능 목록">
            <button type="button" className="feature-card travel-feature" onClick={() => setActivePage('travel')}>
              <span className="feature-icon" aria-hidden="true">⌖</span>
              <span className="feature-copy">
                <strong>지역별 여행·맛집 코스</strong>
                <small>지역을 골라 여행지와 맛집 코스를 살펴봐요.</small>
              </span>
              <span className="feature-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" className="feature-card my-travel-feature" onClick={() => openProtectedPage('myTravelPlaces')}>
              <span className="feature-icon" aria-hidden="true">★</span>
              <span className="feature-copy">
                <strong>내가 작성한 맛집/여행지 보기</strong>
                <small>저장한 장소 기록을 한 번에 확인해요.</small>
              </span>
              <span className="feature-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" className="feature-card todo-feature" onClick={() => openProtectedPage('todos')}>
              <span className="feature-icon" aria-hidden="true">✓</span>
              <span className="feature-copy">
                <strong>나의 할 일 목록</strong>
                <small>날짜별 할 일을 계획하고 완료해요.</small>
              </span>
              <span className="feature-arrow" aria-hidden="true">→</span>
            </button>

            <button type="button" className="feature-card english-feature" onClick={() => openProtectedPage('english')}>
              <span className="feature-icon" aria-hidden="true">A</span>
              <span className="feature-copy">
                <strong>영어 암기</strong>
                <small>영어 단어를 차곡차곡 익혀요.</small>
              </span>
              <span className="feature-arrow" aria-hidden="true">→</span>
            </button>

            {/* TODO: 국립중앙의료원 응급의료정보 조회 API 연동은 추후 구현 */}
            <button type="button" className="feature-card emergency-info-feature" disabled>
              <span className="feature-icon" aria-hidden="true">+</span>
              <span className="feature-status" aria-hidden="true">작업중</span>
              <span className="feature-copy">
                <strong>응급의료정보 조회</strong>
                <small>휴일·야간 진료 병원과 약국, 응급실 정보를 조회해요.</small>
              </span>
            </button>

            <button type="button" className="feature-card oracle-users-feature" onClick={() => setActivePage('oracleUsers')}>
              <span className="feature-icon" aria-hidden="true">DB</span>
              <span className="feature-copy">
                <strong>Oracle USERS 조회</strong>
                <small>Render Node API로 FreeSQL 데이터를 조회해요.</small>
              </span>
              <span className="feature-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (activePage === 'english') {
    if (!currentUser) {
      return (
        <LoginPage
          onBack={() => setActivePage('home')}
          prompt="영어 암기는 로그인 후 사용할 수 있습니다."
          onLogin={(session) => {
            setAuthSession(session);
            setActivePage('english');
          }}
        />
      );
    }

    return (
      <EnglishMemoryPage
        user={currentUser}
        token={authSession.token}
        onBack={() => setActivePage('home')}
        onLogout={onLogout}
      />
    );
  }

  if (activePage === 'oracleUsers') {
    return <OracleUsersPage onBack={() => setActivePage('home')} />;
  }

  if (activePage === 'travel') {
    return (
      <TravelCoursePage
        user={currentUser}
        token={authSession?.token}
        onBack={() => setActivePage('home')}
        onLogout={onLogout}
        onLogin={() => {
          setPendingProtectedPage('travel');
          setActivePage('login');
        }}
      />
    );
  }

  if (activePage === 'myTravelPlaces') {
    if (!currentUser) {
      return (
        <LoginPage
          onBack={() => setActivePage('home')}
          prompt="내가 작성한 맛집·여행지는 로그인 후 볼 수 있습니다."
          onLogin={(session) => {
            setAuthSession(session);
            setActivePage('myTravelPlaces');
          }}
        />
      );
    }

    return (
      <TravelCoursePage
        initialView="myPlaces"
        user={currentUser}
        token={authSession.token}
        onBack={() => setActivePage('home')}
        onLogout={onLogout}
        onLogin={() => {
          setPendingProtectedPage('myTravelPlaces');
          setActivePage('login');
        }}
      />
    );
  }

  if (activePage === 'settings') {
    if (!currentUser) {
      return (
        <LoginPage
          onBack={() => setActivePage('home')}
          prompt="설정은 로그인 후 사용할 수 있습니다."
          onLogin={(session) => {
            setAuthSession(session);
            setActivePage('settings');
          }}
        />
      );
    }

    return (
      <AccountSettingsPage
        user={currentUser}
        token={authSession.token}
        onBack={() => setActivePage('home')}
        onLogout={onLogout}
      />
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onBack={() => setActivePage('home')}
        prompt="나의 할 일 목록은 로그인 후 사용할 수 있습니다."
        onLogin={(session) => {
          setAuthSession(session);
          setActivePage('todos');
        }}
      />
    );
  }

  // 앱 UI 렌더링
  return (
    <main className="App">
      {notification && (
        <div
          className="notification"
          role="status"
          style={
            notificationPos
              ? {
                  top: `${notificationPos.top}px`,
                  left: `${notificationPos.left}px`,
                }
              : undefined
          }
        >
          <span>{notification}</span>
          <button type="button" className="close-btn" onClick={closeNotification} aria-label={copy.close}>
            ×
          </button>
        </div>
      )}

      <section className="todo-shell" aria-labelledby="todo-title">
        <div className="todo-header">
          <button type="button" className="home-button" onClick={() => setActivePage('home')}>
            ← 메인으로
          </button>
          <div className="user-bar">
            <span className="eyebrow">{currentUser.name}님의 {copy.eyebrow}</span>
            <button type="button" onClick={onLogout}>로그아웃</button>
          </div>
          <h1 id="todo-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <section className="calendar-shell">
          <div className="calendar-header">
            <button type="button" className="calendar-nav" onClick={goPrevMonth} aria-label="이전 달">
              ‹
            </button>
            <span>{formatMonthLabel()}</span>
            <button type="button" className="calendar-nav" onClick={goNextMonth} aria-label="다음 달">
              ›
            </button>
          </div>
          <div className="calendar-grid calendar-weekdays">
            {weekdayLabels.map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarCells.map((dateString, index) => {
              const hasTodo = dateString ? todosByDate.has(dateString) : false;
              const isSelected = dateString === selectedDate;
              const isToday = dateString === getToday();
              return (
                <button
                  key={`${dateString || 'empty'}-${index}`}
                  type="button"
                  className={`calendar-cell ${dateString ? '' : 'calendar-empty'} ${hasTodo ? 'calendar-has-todo' : ''} ${isSelected ? 'calendar-selected' : ''} ${isToday ? 'calendar-today' : ''}`}
                  onClick={() => dateString && selectDate(dateString)}
                  disabled={!dateString}
                >
                  <span>{dateString ? Number(dateString.slice(-2)) : ''}</span>
                  {hasTodo && <span className="calendar-dot" />}
                </button>
              );
            })}
          </div>
        </section>

        <form className="input-area" onSubmit={onSubmit}>
          <div className="selected-date-display">
            <div>
              <span>선택한 날짜</span>
              <strong>{selectedDate}</strong>
            </div>
            <button type="button" className="today-btn" onClick={onToday}>
              오늘
            </button>
          </div>
          <div className="input-row">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={copy.placeholder}
              aria-label={copy.newTask}
            />
            <button className="add-btn" type="submit">
              {copy.add}
            </button>
          </div>
        </form>

        <div className="list-summary">
          <div>
            <span>오늘 목표</span>
            <strong>{addedCount}</strong>
          </div>
          {remainingCount === 0 && addedCount > 0 ? (
            <div className="summary-success">
              <span>목표완성!</span>
            </div>
          ) : null}
          <div>
            <span>{copy.openTasks}</span>
            <strong>{remainingCount}</strong>
          </div>
        </div>

        <div className="filter-bar">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showOpenOnly}
              onChange={(event) => setShowOpenOnly(event.target.checked)}
            />
            <span>{copy.showOpenOnly}</span>
          </label>
        </div>

        {isLoadingTodos ? (
          <p className="empty-state">저장된 할 일을 불러오는 중입니다.</p>
        ) : visibleTodos.length > 0 ? (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <li key={todo.id}>
                {editingTodoId === todo.id ? (
                  <div className="todo-edit-row">
                    <input
                      className="todo-edit-input"
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      onKeyDown={(event) => onEditKeyDown(event, todo.id)}
                      aria-label="할 일 수정"
                      autoFocus
                    />
                    <div className="todo-actions">
                      <button className="save-edit-btn" type="button" onClick={(event) => onSaveEdit(todo.id, event.currentTarget)}>
                        {copy.save}
                      </button>
                      <button className="cancel-edit-btn" type="button" onClick={onCancelEdit}>
                        {copy.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`todo-content ${todo.done ? 'completed' : ''}`}>
                      <span>{todo.text}</span>
                      <time dateTime={todo.date}>{todo.date}</time>
                    </div>
                    <div className="todo-actions">
                      <button className="edit-btn" type="button" onClick={() => onStartEdit(todo)}>
                        {copy.edit}
                      </button>
                      {todo.date <= today && (
                        <button
                          className="complete-btn"
                          type="button"
                          onClick={(event) => onToggleComplete(todo.id, event.currentTarget)}
                        >
                          {todo.done ? '취소' : '완료'}
                        </button>
                      )}
                      <button className="delete-btn" type="button" onClick={(event) => onDelete(todo.id, event.currentTarget)} disabled={todo.done}>
                        {copy.delete}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">{showOpenOnly && addedCount > 0 ? copy.emptyFiltered : copy.empty}</p>
        )}
      </section>
    </main>
  );
}

export default App;
