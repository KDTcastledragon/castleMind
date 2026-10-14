import { Router } from 'express';

const userRouter = Router();

const DEMO_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function createDemoLoginId() {
    let suffix = '';

    for (let i = 0; i < 6; i++) {
        suffix += DEMO_ID_CHARS[Math.floor(Math.random() * DEMO_ID_CHARS.length)];
    }

    return 'guest' + suffix;
}

// 세션에 로그인 유저를 넣는다. 닉네임은 DB 설계 전까지 loginId를 그대로 쓴다.
function saveLoginUser(req, loginId) {
    const loginUser = {
        loginId,
        nickname: loginId
    };

    req.session.LOGIN_USER = loginUser;

    return loginUser;
}

// ======[ 임시 로그인 : id만 입력 ]===================================================================================================
userRouter.post('/tempLogin', (req, res) => {
    const loginId = req.body?.loginId?.trim();

    if (!loginId) {
        return res.status(400).send('아이디를 입력해주세요.');
    }

    const me = saveLoginUser(req, loginId);
    console.log(`${loginId} 임시 로그인`);

    res.json(me);
});

// ======[ 시연 로그인 : 랜덤 id 생성 후 바로 로그인 ]===================================================================================================
userRouter.post('/demoLogin', (req, res) => {
    const me = saveLoginUser(req, createDemoLoginId());
    console.log(`${me.loginId} 시연 로그인`);

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
