import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { demoLoginApi, tempLoginApi } from '../../api/userApi';

// 회원가입/비밀번호 설계 전까지 쓰는 임시 로그인. id만 입력하면 로그인된다.
function TempLogin({ setMe }) {
    const navigator = useNavigate();

    const [loginId, setLoginId] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // =====[로그인 공통 처리]======================================================
    async function enterAfterLogin(loginRequest) {
        if (isLoggingIn) return;

        setIsLoggingIn(true);

        try {
            const me = await loginRequest();

            setMe(me);
            navigator('/');
        } catch (e) {
            alert(e.response?.status === 400 ? e.response.data : '로그인 오류');
            console.error(e);
        } finally {
            setIsLoggingIn(false);
        }
    }

    // =====[로그인 함수]======================================================
    function login() {
        if (!loginId.trim()) {
            alert('아이디를 입력해주세요.');
            return;
        }

        enterAfterLogin(() => tempLoginApi(loginId));
    }

    // =====[시연 로그인 : 랜덤 id로 바로 입장]==============================================
    function startDemo() {
        enterAfterLogin(demoLoginApi);
    }

    // ======< return >================================================================================================
    return (
        <div className='TempLoginContainer'>
            <input
                type="text"
                value={loginId}
                placeholder="아이디"
                onChange={(e) => setLoginId(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') login();
                }}
            />

            <button onClick={login} disabled={isLoggingIn}>로그인</button>
            <button onClick={startDemo} disabled={isLoggingIn}>시연 로그인</button>
        </div>
    );
}

export default TempLogin;
