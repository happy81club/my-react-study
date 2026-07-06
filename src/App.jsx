import { useEffect, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'my-react-study-todos';

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
  empty: '모든 할 일을 마감했어요.',
};

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [todos, setTodos] = useState(() => {
    if (typeof window === 'undefined') {
      return copy.initialTodos.map((text) => ({ text, date: getToday() }));
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored).map((item) => ({
          text: item.text,
          date: item.date || getToday(),
          done: item.done ?? false,
        }));
      } catch {
        return copy.initialTodos.map((text) => ({ text, date: getToday(), done: false }));
      }
    }

    return copy.initialTodos.map((text) => ({ text, date: getToday(), done: false }));
  });
  const [text, setText] = useState('');
  const [notification, setNotification] = useState('');
  const [notificationPos, setNotificationPos] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }
  }, [todos]);

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

    setTodos([...todos, { text: trimmedText, date: selectedDate, done: false }]);
    setText('');
    showNotification(copy.added, anchor);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    onAdd(event.submitter || event.currentTarget.querySelector('.add-btn'));
  };

  const onDelete = (targetIndex, anchor) => {
    setTodos(todos.filter((_, index) => index !== targetIndex));
    showNotification(copy.removed, anchor);
  };

  const onToggleComplete = (targetIndex, anchor) => {
    setTodos(
      todos.map((todo, index) =>
        index === targetIndex
          ? { ...todo, done: !todo.done }
          : todo
      )
    );
    showNotification(copy.completed, anchor);
  };

  const onToday = () => {
    setSelectedDate(getToday());
  };

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

        <form className="input-area" onSubmit={onSubmit}>
          <div className="date-row">
            <label className="sr-only" htmlFor="selected-date">
              {copy.selectedDate}
            </label>
            <input
              id="selected-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              aria-label={copy.selectedDate}
            />
            <button className="today-btn" type="button" onClick={(event) => onToday(event.currentTarget)}>
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
          <span>{copy.openTasks}</span>
          <strong>{todos.length}</strong>
        </div>

        {todos.length > 0 ? (
          <ul className="todo-list">
            {todos.map((todo, index) => (
              <li key={`${todo.text}-${todo.date}-${index}`}>
                <div className={`todo-content ${todo.done ? 'completed' : ''}`}>
                  <span>{todo.text}</span>
                  <time dateTime={todo.date}>{todo.date}</time>
                </div>
                <div className="todo-actions">
                  <button className="complete-btn" type="button" onClick={(event) => onToggleComplete(index, event.currentTarget)}>
                    {todo.done ? '취소' : '완료'}
                  </button>
                  <button className="delete-btn" type="button" onClick={(event) => onDelete(index, event.currentTarget)} disabled={todo.done}>
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
