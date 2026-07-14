# my-react-study

학습용 React 프로젝트입니다. 이 브랜치는 Cloudflare Pages에 배포된 React에서 Render의 Node API를 호출하고, Node API가 TCPS로 Oracle FreeSQL을 조회하는 과정을 연습합니다.

```text
React · Cloudflare Pages
          ↓ HTTPS
Node API · Render Free Web Service
          ↓ TCPS / node-oracledb Thin
Oracle FreeSQL · 기존 USERS 테이블
```

## 조회 범위

Node API는 비밀번호를 제외하고 최대 10행만 조회합니다.

```sql
SELECT USER_NO, EMAIL, JOIN_DATE
FROM USERS
ORDER BY USER_NO
FETCH FIRST 10 ROWS ONLY;
```

## 1. Oracle API 로컬 실행

`oracle-api/.env.example`을 `oracle-api/.env`로 복사한 뒤 FreeSQL의 실제 접속정보를 입력합니다. `.env`는 Git에서 제외되며 Node API만 읽습니다.

```powershell
Copy-Item oracle-api\.env.example oracle-api\.env
```

```dotenv
PORT=10000
ALLOWED_ORIGINS=http://localhost:5173
ORACLE_USER=<FreeSQL 사용자>
ORACLE_PASSWORD=<FreeSQL 비밀번호>
ORACLE_CONNECT_STRING=<FreeSQL에서 제공한 TCPS 접속 문자열>
```

비밀번호와 실제 접속 문자열은 Git에 커밋하지 않습니다.

```powershell
cd oracle-api
npm.cmd install
npm.cmd run dev
```

확인 주소:

- `http://localhost:10000/health`: Node API 실행 확인
- `http://localhost:10000/api/oracle/test`: `SELECT 1 FROM DUAL` 연결 확인
- `http://localhost:10000/api/oracle/users`: 기존 `USERS` 조회

## 2. React 로컬 연결

프로젝트 루트 `.env`에 로컬 API 주소를 추가합니다.

```dotenv
VITE_ORACLE_API_URL=http://localhost:10000
```

루트에서 React를 실행한 뒤 메인의 **Oracle USERS 조회**를 선택합니다.

```powershell
npm.cmd run dev
```

## 3. Render 무료 배포

루트의 `render.yaml`을 이용해 Blueprint Web Service를 생성하거나, Render에서 직접 Web Service를 만들고 Root Directory를 `oracle-api`로 지정합니다.

- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/health`
- Instance Type: Free

Render 환경변수:

- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ALLOWED_ORIGINS`: 실제 Cloudflare Pages 주소. 여러 주소는 쉼표로 구분

배포 후 `https://<RENDER-SERVICE>.onrender.com/api/oracle/test`가 성공하는지 먼저 확인합니다.

## 4. Cloudflare Pages 연결

Cloudflare Pages의 환경변수에 Render 주소를 등록합니다.

```dotenv
VITE_ORACLE_API_URL=https://<RENDER-SERVICE>.onrender.com
```

Vite 환경변수는 빌드할 때 포함되므로 값을 등록한 뒤 다시 배포해야 합니다. Oracle 사용자와 비밀번호는 Cloudflare나 React에 넣지 않고 Render Secret에만 저장합니다.

## 검증

```powershell
cd oracle-api
npm.cmd test

cd ..
npm.cmd run build
```

Render 무료 서버는 유휴 상태에서 정지할 수 있으므로 첫 Oracle 조회가 늦어질 수 있습니다. 이 구성은 학습용으로 사용하고, 실제 개인정보가 있는 `EMAIL`을 공개 서비스에서 조회할 때는 별도의 사용자 인증을 추가해야 합니다.
