import { useState } from 'react';

const AUTH_SESSION_KEY = 'my-react-study-auth-session';

async function readJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const submitAuth = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(isSignup ? '/api/signup' : '/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `요청에 실패했습니다. (${response.status})`);
      }

      if (!data.token || !data.user) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
      }

      const session = {
        token: data.token,
        user: data.user,
      };

      window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setMessage('');
  };

  return (
    <main className="App">
      <section className="auth-shell" aria-labelledby="auth-title">
        <div className="auth-header">
          <span className="eyebrow">계정 시작</span>
          <h1 id="auth-title">{isSignup ? '회원가입' : '로그인'}</h1>
          <p>{isSignup ? '내 할 일을 따로 저장할 계정을 만들어 주세요.' : '가입한 계정으로 다시 들어오세요.'}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="인증 방식">
          <button
            type="button"
            className={isSignup ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            가입
          </button>
          <button
            type="button"
            className={!isSignup ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            로그인
          </button>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          {isSignup && (
            <label>
              <span>이름</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={2}
                required
                placeholder="홍길동"
              />
            </label>
          )}

          <label>
            <span>이메일</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              placeholder="me@example.com"
            />
          </label>

          <label>
            <span>비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              minLength={4}
              required
              placeholder="4자 이상"
            />
          </label>

          {message && <p className="auth-message">{message}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중' : isSignup ? '가입하기' : '로그인'}
          </button>
        </form>
      </section>
    </main>
  );
}

export { AUTH_SESSION_KEY };
export default LoginPage;
