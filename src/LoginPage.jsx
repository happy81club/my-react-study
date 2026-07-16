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

function LoginPage({ onBack, onLogin, prompt }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';
  const isReset = mode === 'reset';

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

      if (!data.token || !data.user || !data.expiresAt) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
      }

      const session = {
        token: data.token,
        user: data.user,
        expiresAt: data.expiresAt,
      };

      window.localStorage.removeItem(AUTH_SESSION_KEY);
      window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `요청에 실패했습니다. (${response.status})`);
      }

      setMessage(data.temporaryPassword
        ? `비밀번호가 ${data.temporaryPassword}로 초기화되었습니다. 로그인 후 설정에서 변경해 주세요.`
        : data.message || '가입된 이메일이면 비밀번호를 1234로 초기화합니다.');
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
        {onBack && (
          <div className="page-navigation auth-navigation">
            <button type="button" className="home-button" onClick={onBack}>메인으로</button>
          </div>
        )}
        <div className="auth-header">
          <h1 id="auth-title">{isReset ? '비밀번호 찾기' : isSignup ? '회원가입' : '로그인'}</h1>
          <p>
            {isReset
              ? '가입한 이메일을 입력하면 비밀번호를 1234로 초기화합니다.'
              : prompt || (isSignup ? '내 할 일을 따로 저장할 계정을 만들어 주세요.' : '가입한 계정으로 다시 들어오세요.')}
          </p>
        </div>

        {!isReset && (
          <div className="auth-tabs" role="tablist" aria-label="인증 방식">
            <button
              type="button"
              className={!isSignup ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              로그인
            </button>
            <button
              type="button"
              className={isSignup ? 'active' : ''}
              onClick={() => switchMode('signup')}
            >
              가입
            </button>
          </div>
        )}

        {isReset ? (
          <form className="auth-form" onSubmit={submitPasswordReset}>
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

            {message && <p className="auth-message">{message}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '처리 중' : '1234로 초기화'}
            </button>
            <button type="button" className="auth-link-button" onClick={() => switchMode('login')}>
              로그인으로 돌아가기
            </button>
          </form>
        ) : (
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
                minLength={isSignup ? 4 : undefined}
                required={isSignup}
                placeholder={isSignup ? '4자 이상' : '테스트 버전에서는 입력하지 않아도 됩니다.'}
              />
            </label>

            {!isSignup && (
              <p className="auth-test-notice">
                테스트 버전에서는 비밀번호를 확인하지 않고 가입한 이메일만 확인합니다.
              </p>
            )}

            {message && <p className="auth-message">{message}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '처리 중' : isSignup ? '가입하기' : '로그인'}
            </button>
            {!isSignup && (
              <button type="button" className="auth-link-button" onClick={() => switchMode('reset')}>
                비밀번호를 잊으셨나요?
              </button>
            )}
          </form>
        )}
      </section>
    </main>
  );
}

export { AUTH_SESSION_KEY };
export default LoginPage;
