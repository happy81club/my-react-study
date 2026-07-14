import { useCallback, useEffect, useState } from 'react';

const ORACLE_API_URL = String(import.meta.env.VITE_ORACLE_API_URL || '').replace(/\/$/, '');

async function requestUsers() {
  if (!ORACLE_API_URL) {
    throw new Error('VITE_ORACLE_API_URL이 설정되지 않았습니다.');
  }

  const response = await fetch(`${ORACLE_API_URL}/api/oracle/users`, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok || !Array.isArray(payload.users)) {
    throw new Error(payload?.message || `Oracle 조회에 실패했습니다. (HTTP ${response.status})`);
  }

  return payload.users;
}

function OracleUsersPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Render API를 통해 FreeSQL에 연결하는 중입니다.');

  const loadUsers = useCallback(async () => {
    setStatus('loading');
    setMessage('Render API를 통해 FreeSQL에 연결하는 중입니다.');

    try {
      const items = await requestUsers();
      setUsers(items);
      setStatus('success');
      setMessage(`FreeSQL USERS 테이블에서 ${items.length}행을 조회했습니다.`);
    } catch (error) {
      setUsers([]);
      setStatus('error');
      setMessage(error.message || 'Oracle 조회에 실패했습니다.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    requestUsers()
      .then((items) => {
        if (isMounted) {
          setUsers(items);
          setStatus('success');
          setMessage(`FreeSQL USERS 테이블에서 ${items.length}행을 조회했습니다.`);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatus('error');
          setMessage(error.message || 'Oracle 조회에 실패했습니다.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="App">
      <section className="oracle-users-shell" aria-labelledby="oracle-users-title">
        <div className="page-navigation">
          <button type="button" className="home-button" onClick={onBack}>← 메인으로</button>
        </div>

        <header className="oracle-users-header">
          <span className="eyebrow">Cloudflare Pages → Render → FreeSQL</span>
          <h1 id="oracle-users-title">Oracle USERS 조회</h1>
          <p>Node API가 TCPS로 FreeSQL에 연결해 비밀번호를 제외한 사용자 정보를 조회합니다.</p>
        </header>

        <section className={`oracle-users-status oracle-users-status-${status}`} aria-live="polite">
          <div>
            <strong>
              {status === 'loading' && '연결 중'}
              {status === 'success' && '조회 성공'}
              {status === 'error' && '설정 확인 필요'}
            </strong>
            <p>{message}</p>
          </div>
          <button type="button" onClick={loadUsers} disabled={status === 'loading'}>다시 조회</button>
        </section>

        {status === 'loading' && (
          <p className="oracle-cold-start-note">Render 무료 서버가 정지 상태라면 첫 응답에 약 1분이 걸릴 수 있습니다.</p>
        )}

        {status === 'success' && (
          users.length > 0 ? (
            <div className="oracle-users-table-wrap">
              <table className="oracle-users-table">
                <thead>
                  <tr>
                    <th>USER_NO</th>
                    <th>EMAIL</th>
                    <th>JOIN_DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.USER_NO ?? `oracle-user-${index}`}>
                      <td>{String(user.USER_NO ?? '-')}</td>
                      <td>{String(user.EMAIL ?? '-')}</td>
                      <td>{String(user.JOIN_DATE ?? '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">USERS 테이블에 조회할 데이터가 없습니다.</p>
          )
        )}

        {status === 'error' && (
          <div className="oracle-users-help">
            <strong>확인할 환경변수</strong>
            <p>Cloudflare에는 <code>VITE_ORACLE_API_URL</code>, Render에는 Oracle 접속정보 3개와 <code>ALLOWED_ORIGINS</code>가 필요합니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default OracleUsersPage;
