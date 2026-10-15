// 접속 중인 유저 명부. castleChat 의 WsGateSessionRegistry 자리다.
// 유저 1명당 WebSocket 1개라서 loginId -> ws 로 바로 찾는다. (castleChat 의 userIdToWsSessions)
// Map 은 Java 의 HashMap 과 같다. Node 는 스레드 하나(이벤트 루프)라서 ConcurrentHashMap 이 필요 없다.

const loginIdToWs = new Map();
const wsToLoginUser = new Map();

// ====== 로그인 유저 등록 ===========================================================================================
// 같은 유저가 다른 탭에서 또 연결하면 예전 연결을 닫는다. (유저 1명당 WS 1개 유지)
export function registerConnectedUser(ws, loginUser) {
    const prevWs = loginIdToWs.get(loginUser.loginId);

    if (prevWs && prevWs !== ws) {
        prevWs.close(4001, 'DUPLICATED_CONNECTION');
    }

    loginIdToWs.set(loginUser.loginId, ws);
    wsToLoginUser.set(ws, loginUser);
}

// ====== 연결 종료 시 명부에서 삭제 ===========================================================================================
export function removeConnectedUser(ws) {
    const loginUser = wsToLoginUser.get(ws);

    wsToLoginUser.delete(ws);

    // 이미 새 연결로 바뀐 경우에는 새 연결을 지우지 않는다.
    if (loginUser && loginIdToWs.get(loginUser.loginId) === ws) {
        loginIdToWs.delete(loginUser.loginId);
    }

    return loginUser ?? null;
}

// ====== loginId 로 WS 찾기 ===========================================================================================
export function findWsByLoginId(loginId) {
    return loginIdToWs.get(loginId) ?? null;
}

export function getConnectedUserCount() {
    return loginIdToWs.size;
}
