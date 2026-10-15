// < WEBSOCKET MODULE SCOPE >
// castleChat wsClient.js 와 같은 구조. 유저 1명당 WS 1개를 모듈 변수 하나로 들고 있는다.
// WebSocket 은 브라우저 내장 기능이라 설치할 것이 없다.

// ====== 1. module state =========================================================================================================
let ws = null;
let isManualDisconnect = false;
const globalHandlers = new Set();

// ====== 2. constants =========================================================================================================
const WS_TYPES = {
    CONNECT_USER: 'CONNECT_USER'
};

// ====== 3. func =========================================================================================================
export function emitWs(wsType, payload = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('WS 연결 안 됨');
        return false;
    }

    ws.send(JSON.stringify({
        requestId: crypto.randomUUID(),
        wsType,
        payload
    }));
    return true;
}

// 이미 연결되어 있거나 연결 중이면 새로 만들지 않는다. (StrictMode 로 두 번 불려도 연결은 1개)
export function connectWs() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    isManualDisconnect = false;

    // 개발 중에는 Vite(3000)의 /ws proxy 가 Express(4000)로 넘긴다. 같은 주소라 세션 쿠키가 그대로 따라간다.
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

    ws.onopen = () => {
        console.log('CONNECT_WEBSOCKET_OK');
        emitWsConnectUser();
    };

    ws.onmessage = (evt) => {
        const wsEvt = JSON.parse(evt.data);
        console.log('ws 수신', wsEvt);

        globalHandlers.forEach(handler => handler(wsEvt));
    };

    ws.onclose = (evt) => {
        if (isManualDisconnect) {
            console.log('WebSocket 수동 종료', { code: evt.code, reason: evt.reason });
            isManualDisconnect = false;
        } else {
            console.log('WebSocket 비정상/외부 종료', { code: evt.code, reason: evt.reason });
        }

        // 닫힌 소켓이 지금 들고 있는 소켓일 때만 비운다. (새 연결을 실수로 지우지 않게)
        if (ws === evt.target) {
            ws = null;
        }
    };

    ws.onerror = (evt) => {
        console.error('WebSocket 오류', evt);
    };
}

export function disconnectWs(action) {
    const targetWs = ws;

    isManualDisconnect = true;
    ws = null;

    if (targetWs && (targetWs.readyState === WebSocket.OPEN || targetWs.readyState === WebSocket.CONNECTING)) {
        targetWs.close(1000, action);
    }
}

export function isWsConnected() {
    return ws?.readyState === WebSocket.OPEN;
}

export function registerGlobalWsHandler(handler) {
    globalHandlers.add(handler);

    return () => {
        globalHandlers.delete(handler);
    };
}

export function emitWsConnectUser() {
    return emitWs(WS_TYPES.CONNECT_USER);
}
