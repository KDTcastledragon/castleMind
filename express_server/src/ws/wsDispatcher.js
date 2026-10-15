import { WebSocketServer } from 'ws';

import { getConnectedUserCount, registerConnectedUser, removeConnectedUser } from './wsSessionRegistry.js';

// WS 최상위 입구. castleChat 의 WsGateDispatcher(TextWebSocketHandler) 자리다.
// 메시지 형식도 castleChat 과 같다 : { requestId, wsType, payload } / 응답 { requestId, wsType, isSuccess, wsMessage, payload }

function responseOk(ws, request, wsType, payload) {
    ws.send(JSON.stringify({ requestId: request?.requestId ?? null, wsType, isSuccess: true, payload }));
}

function responseFail(ws, request, wsType, wsMessage) {
    ws.send(JSON.stringify({ requestId: request?.requestId ?? null, wsType, isSuccess: false, wsMessage }));
}

export function attachWsDispatcher(httpServer, sessionMiddleware) {
    // noServer : 포트를 따로 열지 않고, Express 와 같은 http 서버의 upgrade 요청을 넘겨받아 처리한다.
    const wss = new WebSocketServer({ noServer: true });

    // ====== handshake : 로그인 세션 확인 ===========================================================================================
    // castleChat 의 HttpSessionHandshakeInterceptor 자리다.
    // 브라우저가 보낸 CASTLEMIND_SESSION 쿠키로 express-session 이 Redis 에서 세션을 읽어 req.session 에 채운다.
    httpServer.on('upgrade', (req, socket, head) => {
        if (new URL(req.url, 'http://localhost').pathname !== '/ws') {
            socket.destroy();
            return;
        }

        sessionMiddleware(req, {}, () => {
            const loginUser = req.session?.LOGIN_USER;

            if (!loginUser) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, loginUser);
            });
        });
    });

    // ====== 연결 이후 ===========================================================================================
    wss.on('connection', (ws, loginUser) => {
        registerConnectedUser(ws, loginUser);
        console.log(`${loginUser.loginId} WS 연결. 접속자 ${getConnectedUserCount()}명`);

        // ====== 메세지 관리 Dispatcher ===========================================================================================
        ws.on('message', (data) => {
            let request = null;

            try {
                request = JSON.parse(data.toString());

                switch (request.wsType) {
                    case 'CONNECT_USER':
                        responseOk(ws, request, 'CONNECT_USER_OK', loginUser);
                        break;

                    default:
                        responseFail(ws, request, 'UNKNOWN_TYPE', '알 수 없는 WS TYPE');
                }
            } catch (e) {
                console.error('WS 메시지 처리 실패', e);
                responseFail(ws, request, 'WS_MESSAGE_FAIL', 'WebSocket 메시지 처리 실패');
            }
        });

        // ====== ws 연결 종료 ===========================================================================================
        ws.on('close', (code) => {
            removeConnectedUser(ws);
            console.log(`${loginUser.loginId} WS 종료(${code}). 접속자 ${getConnectedUserCount()}명`);
        });
    });
}
