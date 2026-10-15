import { Router } from 'express';

import { getUserByLoginId, join } from './userMapper.js';

const userRouter = Router();

const DEMO_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function createDemoLoginId() {
    let suffix = '';

    for (let i = 0; i < 6; i++) {
        suffix += DEMO_ID_CHARS[Math.floor(Math.random() * DEMO_ID_CHARS.length)];
    }

    return 'guest' + suffix;
}

// 세션에 로그인 유저를 넣는다. 값은 DB users 에서 읽은 loginId · nickname 이다.
function saveLoginUser(req, user) {
    const loginUser = {
        loginId: user.loginId,
        nickname: user.nickname
    };

    req.session.LOGIN_USER = loginUser;

    return loginUser;
}

// ======[ 임시 로그인 : id만 입력. users 에 있는 id 만 로그인된다 ]===================================================================================================
// Express 5 는 async 함수에서 난 예외(DB 오류 등)를 알아서 에러 처리로 넘긴다. (Spring 에서 컨트롤러 예외가 @ExceptionHandler 로 가는 것과 비슷)
userRouter.post('/tempLogin', async (req, res) => {
    const loginId = req.body?.loginId?.trim();

    if (!loginId) {
        return res.status(400).send('아이디를 입력해주세요.');
    }

    const user = await getUserByLoginId(loginId);

    if (!user) {
        return res.status(401).send('존재하지 않는 아이디입니다.');
    }

    const me = saveLoginUser(req, user);
    console.log(`${loginId} 임시 로그인`);

    res.json(me);
});

// ======[ 시연 로그인 : 랜덤 id 로 users 에 가입시킨 뒤 바로 로그인 ]===================================================================================================
userRouter.post('/demoLogin', async (req, res) => {
    let loginId = null;

    // 랜덤 id 가 이미 있으면(UNIQUE 충돌) 다른 id 로 다시 시도한다.
    for (let attempt = 0; attempt < 5 && !loginId; attempt++) {
        const candidateId = createDemoLoginId();

        try {
            await join(candidateId);
            loginId = candidateId;
        } catch (e) {
            if (e.code !== 'ER_DUP_ENTRY') throw e;
        }
    }

    if (!loginId) {
        return res.status(500).send('시연 계정 생성 실패');
    }

    const me = saveLoginUser(req, await getUserByLoginId(loginId));
    console.log(`${loginId} 시연 로그인`);

    res.json(me);
});

// ======[ 현재 로그인 여부 상태 확인 ]===================================================================================================
userRouter.get('/isMe', (req, res) => {
    const loginUser = req.session.LOGIN_USER;

    if (!loginUser) {
        return res.status(401).send('로그인 필요');
    }

    res.json(loginUser);
});

// ======[ 로그아웃 ]===================================================================================================
userRouter.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }

        res.clearCookie('CASTLEMIND_SESSION');
        res.sendStatus(200);
    });
});

export default userRouter;
