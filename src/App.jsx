import { useEffect, useState } from 'react';
import './App.css';

// 로컬 스토리지에 사용될 키 이름 지정
const STORAGE_KEY = 'my-react-study-todos';

// 화면에 출력할 문자열을 모아둔 객체
// 다국어 지원이나 텍스트 변경 시 이곳만 수정하면 됨
const copy = {
  initialTodos: ['React 공부하기', '블로그 글쓰기'],
  emptyInput: '할 일을 입력해 주세요.',
  added: '새 할 일을 추가했어요.',
  removed: '할 일을 삭제했어요.',
  completed: '완료 상태를 변경했어요.',
  saved: '목록이 저장되었습니다.',
  close: '알림 닫기',
  eyebrow: '오늘의 집중',
  title: '나의 할 일 목록',
  subtitle: '작게 적고, 가볍게 끝내는 하루의 체크리스트',
  placeholder: '할 일을 입력해주세요',
  newTask: '새 할 일',
  selectedDate: '할 일 날짜',
  add: '추가',
  save: '저장',
  openTasks: '남은 할 일',
  delete: '삭제',
  empty: '오늘 할 일을 입력해 주세요',
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
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [todos, setTodos] = useState(() => {
    if (typeof window === 'undefined') {
      return copy.initialTodos.map((text) => ({ id: generateId(), text, date: getToday(), done: false }));
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).map((item) => ({
          id: item.id || generateId(),
          text: item.text,
          date: item.date || getToday(),
          done: item.done ?? false,
        }));
      } catch {
        return copy.initialTodos.map((text) => ({ id: generateId(), text, date: getToday(), done: false }));
      }
    }

    return copy.initialTodos.map((text) => ({ id: generateId(), text, date: getToday(), done: false }));
  });
  const [text, setText] = useState('');
  const [notification, setNotification] = useState('');
  const [notificationPos, setNotificationPos] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date(getToday());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // 선택한 날짜에 해당하는 투두만 화면에 표시
  // today 변수는 미래 일정 판단과 today 기준 표시용
  const visibleTodos = todos.filter((todo) => todo.date === selectedDate);
  const today = getToday();
  const remainingCount = visibleTodos.filter((todo) => !todo.done).length;
  const addedCount = visibleTodos.length;
  const todosByDate = new Set(todos.map((todo) => todo.date));

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

  // 선택한 날짜가 바뀌면 해당 날짜가 속한 달을 달력에 보여줌
  useEffect(() => {
    const selected = new Date(selectedDate);
    setCalendarMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [selectedDate]);

  // todos 상태가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos]);

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

    setTodos([...todos, { id: generateId(), text: trimmedText, date: selectedDate, done: false }]);
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
    setTodos(todos.filter((todo) => todo.id !== targetId));
    showNotification(copy.removed, anchor);
  };

  // 투두 완료 토글 처리: 미래 일정은 처리하지 않음
  const onToggleComplete = (targetId, anchor) => {
    const targetTodo = todos.find((todo) => todo.id === targetId);
    if (targetTodo?.date > today) {
      showNotification('미래 일정은 완료할 수 없습니다.', anchor);
      return;
    }

    setTodos(
      todos.map((todo) =>
        todo.id === targetId
          ? { ...todo, done: !todo.done }
          : todo
      )
    );
    showNotification(copy.completed, anchor);
  };

  // 오늘 버튼이나 초기 상태에서 선택 날짜를 오늘로 이동
  const onToday = () => {
    setSelectedDate(getToday());
  };

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
        </div>
      )}

      <section className="todo-shell" aria-labelledby="todo-title">
        <div className="todo-header">
          <span className="eyebrow">{copy.eyebrow}</span>
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
                  onClick={() => dateString && setSelectedDate(dateString)}
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
            <span>선택한 날짜</span>
            <strong>{selectedDate}</strong>
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

        {visibleTodos.length > 0 ? (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <li key={todo.id}>
                <div className={`todo-content ${todo.done ? 'completed' : ''}`}>
                  <span>{todo.text}</span>
                  <time dateTime={todo.date}>{todo.date}</time>
                </div>
                <div className="todo-actions">
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
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">{copy.empty}</p>
        )}
      </section>
    </main>
  );
}

export default App;
