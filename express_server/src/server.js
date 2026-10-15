import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

import userRouter from './user/userRouter.js';
import dbPool from './db/dbPool.js';
import { attachWsDispatcher } from './ws/wsDispatcher.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

// ====== Redis 연결 (세션 저장소) ===========================================================================================
// mind-castle 컨테이너. castleChat 의 castle-redis(6379)와 겹치지 않게 PC 쪽 6380 으로 붙는다.
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6380';
let isRedisStarted = false;

// 처음 연결이 안 되면 재시도하지 않고 바로 실패시킨다. (Redis 가 꺼져 있으면 원인을 알리고 서버를 끝낸다)
// 한 번 연결된 뒤 끊기면 그때는 다시 붙을 때까지 재시도한다.
const redisClient = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => (isRedisStarted ? Math.min(retries * 200, 3000) : false)
    }
});
redisClient.on('error', (err) => console.error('Redis 연결 오류 :', err.code ?? err.message));

try {
    await redisClient.connect(); // 세션 저장소가 없으면 로그인이 안 되므로, 연결된 뒤에 서버를 연다.
    isRedisStarted = true;
} catch {
    console.error(`Redis(${REDIS_URL})에 연결할 수 없습니다. Docker Desktop 과 mind-castle 컨테이너가 켜져 있는지 확인하세요.`);
    process.exit(1);
}

// ====== MariaDB 연결 확인 ===========================================================================================
// 풀은 쿼리할 때 연결을 만든다. .env 값이 틀렸으면 첫 로그인 때가 아니라 지금 바로 알 수 있게 한 번 찔러 본다.
await dbPool.query('SELECT 1');
console.log(`MariaDB 연결 : ${process.env.DB_HOST}:${process.env.DB_PORT ?? 3306}/${process.env.DB_NAME}`);

// ====== 공통 미들웨어 ===========================================================================================
app.use(express.json()); // 요청 body의 JSON을 req.body 객체로 바꿔준다. (Spring의 @RequestBody 역할)

// 로그인 세션. Redis 에 저장하므로 서버를 재시작해도 로그인이 유지된다. (castleChat 의 Spring Session Redis 와 같은 구조)
// WS handshake 에서도 같은 세션을 읽어야 해서 변수로 꺼내 두고 wsDispatcher 에 넘긴다.
const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient, prefix: 'castlemind:session:' }),
    name: 'CASTLEMIND_SESSION',
    secret: process.env.SESSION_SECRET ?? 'castlemind-local-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 30
    }
});
app.use(sessionMiddleware);

// ====== 라우터 ===========================================================================================
app.use('/user', userRouter);

// app.listen 은 Node 의 http 서버를 만들어 돌려준다. 같은 서버(4000)의 /ws 로 WebSocket 연결도 받는다.
const httpServer = app.listen(PORT, () => {
    console.log(`express_server 실행 : http://localhost:${PORT}`);
});

attachWsDispatcher(httpServer, sessionMiddleware);
