## [1-1.] - CLAUDE - 지시사항 - [26.10.13 - 21:14]=============================================
1. axios  설치했음. fetch를 axios로 바꾸는게 좋나? fetch그대로 가는게 좋나??? . 


2. axios로 바꿔야 한다면, 바꾸고 ctxtmd에 기록해. (바꾸지 않는다면 미기록.)
3. 앞으로 나한테 js나 express 관련 보고할때 springboot와 조금 비교해서, 비유해서 보고해줘. 그냥 알려주면 좀 어렵다. 세션을 서버 메모리에 저장하는건 redis에서 할거야. db 저장으로 변경해. ctxtmd 미기록.
4. boot의 app.properties에서 mariadb와 연결하는 것처럼. express에서도 연결해야지. 방법 알려줘.

## [1-2.] - CLAUDE - 결과 - [26.10.13 - 21:14]=================================================
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
## ===[1-3.] - 끝 -

## [2-1.] - CLAUDE - 지시사항 - [26.10.15 - 01:12]=============================================
docker ps -a --filter name=mind-castle 이거는 cmd에서 하나? vscode 터미널에서는 불가능??

일단 redis 설치완료.

## [2-2.] - CLAUDE - 결과 - [26.10.15 - 01:12]=================================================
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
- 검증 : node --check 로 문법 확인. Docker Desktop이 꺼져 있어 mind-castle 컨테이너가 확인되지 않아 실제 실행 확인은 대기. 컨테이너가 뜨면 로그인 -> 서버 재시작 -> isMe 유지까지 확인한다.
## ===[2-3.] - 끝 -
