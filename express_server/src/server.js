import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';

import userRouter from './user/userRouter.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

// ====== Redis 연결 (세션 저장소) ===========================================================================================
// mind-castle 컨테이너. castleChat 의 castle-redis(6379)와 겹치지 않게 PC 쪽 6380 으로 붙는다.
const redisClient = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6380' });
redisClient.on('error', (err) => console.error('Redis 연결 오류', err.message));
await redisClient.connect(); // 세션 저장소가 없으면 로그인이 안 되므로, 연결된 뒤에 서버를 연다.

// ====== 공통 미들웨어 ===========================================================================================
app.use(express.json()); // 요청 body의 JSON을 req.body 객체로 바꿔준다. (Spring의 @RequestBody 역할)

// 로그인 세션. Redis 에 저장하므로 서버를 재시작해도 로그인이 유지된다. (castleChat 의 Spring Session Redis 와 같은 구조)
app.use(session({
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
}));

// ====== 라우터 ===========================================================================================
app.use('/user', userRouter);

app.listen(PORT, () => {
    console.log(`express_server 실행 : http://localhost:${PORT}`);
});
