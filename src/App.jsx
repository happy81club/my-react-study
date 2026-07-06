import { useState } from 'react';
import './App.css';

const copy = {
  initialTodos: ['React \uacf5\ubd80\ud558\uae30', '\ube14\ub85c\uadf8 \uae00\uc4f0\uae30'],
  emptyInput: '\ud560 \uc77c\uc744 \uc785\ub825\ud574 \uc8fc\uc138\uc694.',
  added: '\uc0c8 \ud560 \uc77c\uc744 \ucd94\uac00\ud588\uc5b4\uc694.',
  removed: '\ud560 \uc77c\uc744 \uc0ad\uc81c\ud588\uc5b4\uc694.',
  close: '\uc54c\ub9bc \ub2eb\uae30',
  eyebrow: '\uc624\ub298\uc758 \uc9d1\uc911',
  title: '\ub098\uc758 \ud560 \uc77c \ubaa9\ub85d',
  subtitle: '\uc791\uac8c \uc801\uace0, \uac00\ubccd\uac8c \ub05d\ub0b4\ub294 \ud558\ub8e8\uc758 \uccb4\ud06c\ub9ac\uc2a4\ud2b8',
  placeholder: '\ud560 \uc77c\uc744 \uc785\ub825\ud558\uc138\uc694',
  newTask: '\uc0c8 \ud560 \uc77c',
  add: '\ucd94\uac00',
  openTasks: '\ub0a8\uc740 \ud560 \uc77c',
  delete: '\uc0ad\uc81c',
  empty: '\ubaa8\ub4e0 \ud560 \uc77c\uc744 \ub05d\ub0c8\uc5b4\uc694.',
};

function App() {
  const [todos, setTodos] = useState(copy.initialTodos);
  const [text, setText] = useState('');
  const [notification, setNotification] = useState('');

  const showNotification = (message) => {
    setNotification(message);
  };

  const closeNotification = () => {
    setNotification('');
  };

  const onAdd = () => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      showNotification(copy.emptyInput);
      return;
    }

    setTodos([...todos, trimmedText]);
    setText('');
    showNotification(copy.added);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    onAdd();
  };

  const onDelete = (targetIndex) => {
    setTodos(todos.filter((_, index) => index !== targetIndex));
    showNotification(copy.removed);
  };

  return (
    <main className="App">
      {notification && (
        <div className="notification" role="status">
          <span>{notification}</span>
          <button className="close-btn" type="button" onClick={closeNotification} aria-label={copy.close}>
            x
          </button>
        </div>
      )}

      <section className="todo-shell" aria-labelledby="todo-title">
        <div className="todo-header">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1 id="todo-title">{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        <form className="input-area" onSubmit={onSubmit}>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={copy.placeholder}
            aria-label={copy.newTask}
          />
          <button className="add-btn" type="submit">
            {copy.add}
          </button>
        </form>

        <div className="list-summary">
          <span>{copy.openTasks}</span>
          <strong>{todos.length}</strong>
        </div>

        {todos.length > 0 ? (
          <ul className="todo-list">
            {todos.map((todo, index) => (
              <li key={`${todo}-${index}`}>
                <span>{todo}</span>
                <button className="delete-btn" type="button" onClick={() => onDelete(index)}>
                  {copy.delete}
                </button>
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
