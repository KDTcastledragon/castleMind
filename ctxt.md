## [1-1.] CLAUDE 지시사항 [26.10.13 - 21:14]=============================================
1. axios  설치했음. fetch를 axios로 바꾸는게 좋나? fetch그대로 가는게 좋나??? . 
2. axios로 바꿔야 한다면, 바꾸고 ctxtmd에 기록해. (바꾸지 않는다면 미기록.)
3. 앞으로 나한테 js나 express 관련 보고할때 springboot와 조금 비교해서, 비유해서 보고해줘. 그냥 알려주면 좀 어렵다. 세션을 서버 메모리에 저장하는건 redis에서 할거야. db 저장으로 변경해. ctxtmd 미기록.
4. boot의 app.properties에서 mariadb와 연결하는 것처럼. express에서도 연결해야지. 방법 알려줘.

## [1-2.] CLAUDE 결과 [26.10.13 - 21:14]=================================================
(3번은 지시대로 미기록. 4번은 방법 안내만 하고 코드 변경이 없어서 미기록. 1·2번만 기록한다.)

1. fetch -> axios 전환 결정
- 원인 : 프론트 API 호출(castle_mind_front/src/api/userApi.js)을 axios 미설치 상태에서 브라우저 내장 fetch로 임시 작성했었다.
- 해결방법 : axios로 바꾼다.
- 의도
  1) fetch는 서버가 400/401/500을 줘도 예외를 던지지 않아서 매번 res.ok를 직접 확인해야 한다. axios는 2xx가 아니면 알아서 예외를 던진다. (Spring RestTemplate이 4xx/5xx에서 HttpClientErrorException을 던지는 것과 같다.)
  2) fetch는 res.json()을 한 번 더 호출해야 JSON이 객체가 된다. axios는 res.data에 이미 객체로 들어 있다. (Spring의 @ResponseBody / Jackson 자동 변환과 같은 편의.)
  3) axios 인터셉터로 "401이면 로그인 페이지로" 같은 공통 처리를 한 곳에 둘 수 있다. castleChat의 useAuthErrorInterceptor가 이 방식이다. (Spring의 HandlerInterceptor / @RestControllerAdvice처럼 공통 처리를 한 곳에 모으는 역할.)
  4) 파일 업로드 진행률(onUploadProgress)을 axios는 바로 지원하고 fetch는 지원하지 않는다. 나중에 첨부(attachment) 기능에서 필요하다.
  5) castleChat 프론트가 axios를 썼고, React 실무 코드에서도 가장 흔하다. 회사 코드를 읽을 때 바로 익숙하다.
- tradeoff : 라이브러리 하나가 번들에 추가된다(수십 KB). fetch는 브라우저 내장이라 설치가 필요 없다. 지금 프로젝트 규모에서는 무시해도 되는 크기라 axios를 택했다.

2. axios로 코드 변경
- castle_mind_front/src/api/userApi.js
  - requestJson(fetch 래퍼) 함수 삭제.
  - tempLoginApi / demoLoginApi / meApi / logoutApi 를 axios.post / axios.get 으로 변경. 반환은 res.data. (castleChat userApi.js와 같은 모양)
  - logoutApi는 fetch 때 응답 body가 없어서 res.json()을 피하려고 따로 만들었던 처리가 필요 없어져 axios.post 한 줄로 정리.
- castle_mind_front/src/components/Home/TempLogin.jsx
  - 에러 처리 : fetch용 e.status / e.message -> axios용 e.response?.status / e.response.data 로 변경. (400이면 서버가 보낸 "아이디를 입력해주세요." 문구를 그대로 alert)
- 검증 : CRA ESLint 설정으로 src/api, src/components 검사 통과. 남은 fetch 사용처 없음 확인.

3. 발견한 문제 (보고만, 미수정)
- axios와 react-router-dom이 castle_mind_front가 아니라 express_server에 설치되어 있다. (express_server/package.json dependencies에 axios, react-router-dom이 들어감. react도 같이 딸려 설치됨.)
- 이 두 개는 브라우저(React)에서 쓰는 라이브러리라 castle_mind_front에 있어야 한다. 지금 상태로는 프론트에서 import 할 수 없어 화면이 뜨지 않는다.
- express_server에서 npm uninstall axios react-router-dom, castle_mind_front에서 npm install axios react-router-dom 이 필요하다. (설치는 사용자가 직접)
- express-session은 서버 라이브러리라 express_server에 있는 것이 맞다.
## ♬♬ 끝 [1] ♬♬

## [2-1.] CLAUDE 지시사항 [26.10.15 - 01:12]=============================================
docker ps -a --filter name=mind-castle 이거는 cmd에서 하나? vscode 터미널에서는 불가능??

일단 redis 설치완료.

## [2-2.] CLAUDE 결과 [26.10.15 - 01:12]=================================================
(첫 줄은 개념 질문이라 답변만 하고 기록하지 않는다. "redis 설치완료"에 이어서 진행한 세션 저장소 변경만 기록한다.)

1. express-session 저장소를 서버 메모리 -> Redis(mind-castle)로 변경
- 원인 : express-session 기본 저장소(MemoryStore)는 세션을 Node 프로세스 메모리에 둔다. 서버를 재시작하면 모두 로그아웃되고, 서버를 2대 이상 띄우면 세션을 공유하지 못한다. 사용자가 "redis 바로 가자"로 결정했고, express_server에 redis · connect-redis 설치를 마쳤다.
- 해결방법 : express_server/src/server.js 수정.
  1) redis 패키지의 createClient로 Redis 클라이언트를 만든다. 주소는 REDIS_URL 환경변수, 없으면 redis://localhost:6380 (mind-castle 컨테이너).
  2) await redisClient.connect() 로 연결이 끝난 뒤에 서버를 연다. (package.json "type": "module" 이라 파일 최상단에서 await 가능)
  3) session({ store: new RedisStore({ client: redisClient, prefix: 'castlemind:session:' }), ... }) 로 저장소를 지정한다. 나머지 세션 설정(쿠키 이름 CASTLEMIND_SESSION, 30분, httpOnly, sameSite lax)은 그대로다.
  4) redisClient.on('error') 로 연결 오류를 콘솔에 남긴다.
- 의도
  - Spring 비유 : castleChat이 spring-session-data-redis + Lettuce로 HttpSession을 Redis에 저장한 것과 같은 구조다. redis = Lettuce(접속 드라이버), connect-redis = spring-session-data-redis(세션을 Redis에 저장하는 연결 부품).
  - 포트 6380 : castleChat의 castle-redis(6379)와 동시에 켜도 겹치지 않게 했다.
  - 키 접두어 castlemind:session: : castleChat의 castlechat:session 처럼 프로젝트별로 키를 구분해 둔다. 나중에 같은 Redis를 같이 써도 섞이지 않는다.
  - 연결 후 서버 시작 : 세션 저장소가 없으면 로그인 자체가 안 되므로, Redis가 준비되기 전에는 요청을 받지 않는다.
- tradeoff : Redis가 꺼져 있으면 서버가 시작되지 않는다. (메모리 세션 때는 Redis 없이도 떴다.) 개발할 때 Docker Desktop과 mind-castle 컨테이너를 먼저 켜야 한다. 대신 재시작해도 로그인이 유지되고, 나중에 WebSocket handshake에서도 같은 세션을 Redis에서 읽을 수 있다.
- 검증 : node --check 로 문법 확인. 사용자가 mind-castle 컨테이너를 만든 뒤(PONG 확인) 실제 실행으로 확인했다.
  1) /user/demoLogin 로그인 -> Redis에 castlemind:session:<세션ID> 키 1개 생성. 값 = {"cookie":{originalMaxAge:1800000,...},"LOGIN_USER":{"loginId":"guestX3KOO3","nickname":"guestX3KOO3"}}, TTL 약 1800초(30분).
  2) Express 서버를 종료 후 재시작 -> 같은 쿠키로 /user/isMe 호출 시 로그인 정보 그대로 응답. (메모리 세션이었다면 401)
  3) /user/logout -> 200, Redis의 castlemind:session:* 키 0개(세션 삭제 확인).
  4) 확인용으로 띄운 서버(4000)는 종료했다.
## ♬♬ 끝 [2] ♬♬

## [3-1.] CLAUDE 지시사항 [26.10.15 - 01:25]=============================================
1.root로 할거임. .env 직접 만드는 방법 알려줘.
2.mariadb 연결하자.
3.users Table은 내가 직접 만들음.

create table users (
login_id varchar(20) not null unique,
user_nickname varchar(30) not null default "유저"
);

login Id로만 로그인 할거야. 닉네임은 우선...디폴트로 냅둬.

4. ws연결도 해야지. 로그인 완료시에 붙일거지? castlechat과 유사한 구조로 진행할거야??? (방마다 ws이 아닌, 유저 1명당 ws 1개) 아니면 다른 방식으로?

## [3-2.] CLAUDE 결과 [26.10.15 - 01:25]=================================================
(1번 .env 만드는 방법, 4번 WS 구조는 안내/질문이라 답변만 하고 기록하지 않는다. 2·3번 코드 변경만 기록한다.)

1. MariaDB 커넥션 풀 추가
- 원인 : mysql2 는 설치했지만 DB 에 접속하는 코드가 없었다.
- 해결방법
  1) express_server/src/db/dbPool.js 새 파일. mysql2/promise 의 createPool 로 풀을 만든다. 값은 .env 의 DB_HOST · DB_PORT · DB_USER · DB_PASSWORD · DB_NAME, connectionLimit 10.
  2) express_server/package.json : start · dev 실행 명령에 --env-file=.env 추가. Node 22 내장 기능이라 dotenv 설치가 필요 없다.
  3) express_server/src/server.js : 서버 시작 때 dbPool.query('SELECT 1') 로 한 번 접속해 보고 "MariaDB 연결 : ..." 로그를 남긴다.
- 의도
  - Spring 비유 : application.properties(spring.datasource.*) = .env, HikariCP DataSource = dbPool, maximum-pool-size = connectionLimit. Spring 은 설정만 적으면 Boot 가 풀을 만들어 주지만 Express 는 직접 만든다.
  - 시작 때 SELECT 1 : 풀은 실제 쿼리 때 연결을 만들어서, .env 값이 틀려도 첫 로그인 때에야 알게 된다. 시작할 때 바로 실패하게 해서 원인을 빨리 찾는다. (Spring 도 시작 시 DataSource 연결 실패면 기동이 멈춘다)
- tradeoff : --env-file=.env 는 .env 파일이 없으면 서버가 아예 시작되지 않는다. 대신 설정 누락을 바로 알 수 있다.

2. users 테이블 SQL 모음 추가
- 해결방법 : express_server/src/user/userMapper.js 새 파일.
  - getUserByLoginId(loginId) : SELECT login_id AS loginId, user_nickname AS nickname FROM users WHERE login_id = ? (없으면 null)
  - join(loginId) : INSERT INTO users (login_id) VALUES (?). 닉네임은 테이블 기본값 '유저'.
- 의도 : castleChat UserMapper(MyBatis)의 getUserByLoginId · join 과 같은 이름 · 역할. ? 자리 바인딩은 MyBatis #{} 와 같아서 SQL 인젝션을 막는다. 컬럼 이름(login_id, user_nickname)은 AS 로 JS 쪽 이름(loginId, nickname)에 맞췄다. (MyBatis map-underscore-to-camel-case 역할)

3. 로그인을 DB users 기준으로 변경
- 원인 : 지금까지 임시 로그인은 DB 없이 입력한 id 를 그대로 세션에 넣었다. 사용자가 "login Id로만 로그인", "닉네임은 디폴트"로 정했다.
- 해결방법 : express_server/src/user/userRouter.js
  - POST /user/tempLogin : users 에서 login_id 를 찾는다. 있으면 세션 LOGIN_USER = { loginId, nickname(DB 값) }. 없으면 401 "존재하지 않는 아이디입니다."
  - POST /user/demoLogin : 랜덤 id(guest + 6자리)로 users 에 INSERT 한 뒤 바로 로그인. id 가 이미 있으면(ER_DUP_ENTRY) 최대 5번 다른 id 로 다시 시도.
  - 핸들러를 async 로 바꿨다. Express 5 는 async 핸들러의 예외(DB 오류 등)를 알아서 에러 처리로 넘긴다. (Spring 컨트롤러 예외가 @ExceptionHandler 로 가는 것과 비슷)
  - castle_mind_front/src/components/Home/TempLogin.jsx : 400 일 때만 서버 문구를 alert 하던 조건을 401 까지 넓혔다. "존재하지 않는 아이디입니다." 가 사용자에게 보이게 하려는 것이다.
- tradeoff : 회원가입 화면이 아직 없어서, 새 아이디는 시연 로그인으로 만들거나 DB 에 직접 INSERT 해야 로그인할 수 있다. 헤더 닉네임은 모두 '유저' 로 보인다(테이블 기본값).

- 검증
  - server 4개 파일 node --check 통과, 프론트 npm run lint 통과.
  - .env 가 아직 없어서, 같은 값을 환경변수로 잠깐 넘겨 실행했다. "MariaDB 연결 : 127.0.0.1:3306/castle_mind_db" 로그 확인.
  - 없는 id 로 tempLogin -> 401 "존재하지 않는 아이디입니다."
  - demoLogin -> {"loginId":"guestPM4WRP","nickname":"유저"}, DB users 에 guestPM4WRP / 유저 행 생성 확인.
  - 로그아웃 후 같은 id 로 tempLogin -> 200, 같은 정보로 로그인.
  - 테스트로 만든 users 행(guestPM4WRP)과 테스트 세션 키(castlemind:session:*)는 지웠다. users 행 0개로 원상복구. 확인용 서버(4000)는 종료.
## ♬♬ 끝 [3] ♬♬

## [4-1.] CLAUDE 지시사항 [26.10.15 - 10:45]=============================================
ㅇㅋ

## [4-2.] CLAUDE 결과 [26.10.15 - 10:45]=================================================
([3-1] 4번 "ws연결도 해야지. 로그인 완료시에 붙일거지? castlechat과 유사한 구조로 진행할거야???"에 대해 "유저 1명당 WS 1개, 로그인 완료 시 연결, castleChat과 같은 구조"를 제안했고, 사용자가 ws 설치 · .env 생성 후 "ㅇㅋ"로 진행했다.)

1. Redis 가 꺼져 있을 때 서버가 멈춰 있던 문제 수정
- 원인 : .env 로 서버를 띄워 보니 Docker Desktop 이 꺼져 mind-castle 이 없었다. redis 클라이언트는 기본으로 끝없이 재연결을 시도해서 await redisClient.connect() 가 영원히 끝나지 않았다. 오류 로그도 err.message 가 비어 "Redis 연결 오류" 만 반복됐다.
- 해결방법 : express_server/src/server.js
  - createClient 의 socket.reconnectStrategy 로 "처음 연결 전에는 재시도하지 않고(false) 바로 실패, 한 번 연결된 뒤 끊기면 최대 3초 간격으로 재시도" 하게 했다. (isRedisStarted 플래그)
  - connect() 를 try/catch 로 감싸서 실패하면 "Redis(redis://localhost:6380)에 연결할 수 없습니다. Docker Desktop 과 mind-castle 컨테이너가 켜져 있는지 확인하세요." 를 찍고 process.exit(1).
  - 오류 로그는 err.code ?? err.message 로 바꿔 ECONNREFUSED 같은 원인이 보이게 했다.
- 의도 : Spring 도 시작할 때 필수 연결이 실패하면 기동을 멈추고 원인을 찍는다. 멈춘 채 아무 말 없는 서버보다, 바로 끝나면서 무엇을 켜야 하는지 알려 주는 것이 개발할 때 빠르다.
- 검증 : Docker 꺼진 상태로 실행 -> "Redis 연결 오류 : ECONNREFUSED" + 안내 문구, exit code 1 로 바로 종료 확인.

2. WebSocket 서버 추가 (유저 1명당 WS 1개, castleChat 구조)
- 해결방법
  1) express_server/src/ws/wsSessionRegistry.js 새 파일 : 접속자 명부. loginIdToWs(loginId -> ws), wsToLoginUser(ws -> 로그인 유저) 두 Map. registerConnectedUser / removeConnectedUser / findWsByLoginId / getConnectedUserCount. 같은 유저가 다른 탭에서 또 연결하면 예전 연결을 4001(DUPLICATED_CONNECTION)로 닫아 1명 1연결을 유지한다.
  2) express_server/src/ws/wsDispatcher.js 새 파일 : attachWsDispatcher(httpServer, sessionMiddleware).
     - ws 라이브러리 WebSocketServer 를 noServer 로 만들어, Express 와 같은 http 서버(4000)의 /ws upgrade 요청만 넘겨받는다.
     - handshake : upgrade 요청에 sessionMiddleware 를 돌려 CASTLEMIND_SESSION 쿠키로 Redis 세션을 읽고, req.session.LOGIN_USER 가 없으면 401 로 연결을 거절한다.
     - 메시지 형식은 castleChat 과 같은 { requestId, wsType, payload }, 응답 { requestId, wsType, isSuccess, wsMessage, payload }. 지금은 CONNECT_USER -> CONNECT_USER_OK(로그인 유저) 하나와, 모르는 타입 -> UNKNOWN_TYPE 실패 응답만 있다.
     - close 때 명부에서 지운다.
  3) express_server/src/server.js : session(...) 을 sessionMiddleware 변수로 꺼내 app.use 와 WS handshake 에서 같이 쓴다. app.listen 이 돌려주는 httpServer 에 attachWsDispatcher 를 붙인다.
  4) castle_mind_front/src/webSocket/wsClient.js 새 파일 : castleChat wsClient 와 같은 모듈 변수 구조와 이름(connectWs, disconnectWs, emitWs, isWsConnected, registerGlobalWsHandler, emitWsConnectUser). 열리면 CONNECT_USER 를 보낸다. 브라우저 내장 WebSocket 이라 설치 없음.
  5) castle_mind_front/src/components/AppShell/AppShell.jsx : me 가 생기면 connectWs(), me 가 null 이 되면(로그아웃) disconnectWs('LOGOUT'), AppShell 이 사라지면 disconnectWs. 로그인 완료 시 연결.
  6) castle_mind_front/vite.config.js : '/ws' proxy (target ws://localhost:4000, ws: true) 추가. 프론트는 같은 주소(3000)로 WS 를 열고 Vite 가 4000 으로 넘긴다. 같은 주소라 세션 쿠키가 그대로 따라간다.
- 의도
  - Spring 비유 : wsDispatcher = WsGateDispatcher(TextWebSocketHandler), handshake 세션 확인 = HttpSessionHandshakeInterceptor, wsSessionRegistry = WsGateSessionRegistry, ws 라이브러리 = spring-boot-starter-websocket.
  - castleChat 은 websocket-gateway 와 channel-engine 을 나누고 gRPC 로 이었지만, castleMind 는 지금 Express 서버 하나라 WS 도 같은 프로세스 · 같은 포트에서 처리한다.
  - Node 는 스레드가 하나(이벤트 루프)라 castleChat 의 ConcurrentHashMap 대신 일반 Map 으로 충분하다.
  - 로그인 시 연결 : 래더 매칭 결과, 로비 알림, 게임 이벤트를 연결 하나로 받는다. 방은 나중에 서버 메모리 Map(방 -> 유저들)으로 관리한다.
- tradeoff : 서버가 1대일 때만 맞는 구조다. 접속자 명부가 프로세스 메모리에 있어서 서버를 2대 이상 띄우면 서로의 접속자를 모른다. (castleChat 도 같은 한계였다. 필요해지면 Redis pub/sub 로 서버끼리 알린다.)
- 검증 : 서버 3개 파일 node --check 통과, 프론트 npm run lint 통과, vite.config.js 문법 통과. Redis(mind-castle)가 꺼져 있어서 실제 WS 연결 확인은 Docker 를 켠 뒤 진행한다.
## ♬♬ 끝 [4] ♬♬
