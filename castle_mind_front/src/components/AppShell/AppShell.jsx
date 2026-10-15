import { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

import Header from "../Home/Header";
import RouteBody from "../Home/RouteBody";
import { meApi } from "../../api/userApi";
import { connectWs, disconnectWs } from "../../webSocket/wsClient";

function AppShell() {
    const navigator = useNavigate();
    const location = useLocation();

    const [me, setMe] = useState(null);
    const [isCheckingLogin, setIsCheckingLogin] = useState(true);

    // ======== 새로고침해도 로그인 유지 : 서버 세션에 로그인 정보가 있는지 확인 =======
    useEffect(() => {
        meApi()
            .then(setMe)
            .catch(() => setMe(null))
            .finally(() => setIsCheckingLogin(false));
    }, []);

    // ======== 비로그인 상태면 임시 로그인 페이지로 =======
    useEffect(() => {
        if (isCheckingLogin) return;

        if (!me && location.pathname !== '/tempLogin') {
            navigator('/tempLogin', { replace: true });
        }
    }, [me, isCheckingLogin, location.pathname, navigator]);

    // ======== 로그인되면 WS 연결, 로그아웃(me 가 null)되면 WS 종료. 유저 1명당 WS 1개 =======
    useEffect(() => {
        if (!me) {
            disconnectWs('LOGOUT');
            return;
        }

        connectWs();
    }, [me]);

    // ======== AppShell 이 사라질 때(탭 닫기 등) WS 정리 =======
    useEffect(() => {
        return () => disconnectWs('APPSHELL_UNMOUNT');
    }, []);

    if (isCheckingLogin) return null;

    // ======< return >=======================================================================================================
    return (
        <>
            {me && <Header me={me} setMe={setMe} />}
            <RouteBody me={me} setMe={setMe} />
        </>
    );
}

export default AppShell;
