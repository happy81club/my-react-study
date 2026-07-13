import { useState } from 'react';

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

function AccountSettingsPage({ user, token, onBack, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setMessage('');

    if (nextPassword !== confirmPassword) {
      setMessage('새 비밀번호가 서로 다릅니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/password-change', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          nextPassword,
        }),
      });
      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || `요청에 실패했습니다. (${response.status})`);
      }

      setCurrentPassword('');
      setNextPassword('');
      setConfirmPassword('');
      setMessage(data.message || '비밀번호가 변경되었습니다.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="App">
      <section className="settings-shell" aria-labelledby="settings-title">
        <div className="page-navigation settings-navigation">
          <button type="button" className="home-button" onClick={onBack}>메인으로</button>
          <button type="button" className="text-logout-button" onClick={onLogout}>로그아웃</button>
        </div>

        <div className="settings-header">
          <span className="eyebrow">내 정보</span>
          <h1 id="settings-title">설정</h1>
          <p>{user.name}님의 계정 정보를 관리합니다.</p>
        </div>

        <div className="settings-profile">
          <span>이메일</span>
          <strong>{user.email}</strong>
        </div>

        <form className="settings-form" onSubmit={submitPasswordChange}>
          <label>
            <span>현재 비밀번호</span>
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              minLength={4}
              required
              placeholder="임시 비밀번호는 1234"
            />
          </label>

          <label>
            <span>새 비밀번호</span>
            <input
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              type="password"
              minLength={4}
              required
              placeholder="4자 이상"
            />
          </label>

          <label>
            <span>새 비밀번호 확인</span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              minLength={4}
              required
              placeholder="한 번 더 입력"
            />
          </label>

          {message && <p className="auth-message">{message}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중' : '비밀번호 변경'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AccountSettingsPage;
