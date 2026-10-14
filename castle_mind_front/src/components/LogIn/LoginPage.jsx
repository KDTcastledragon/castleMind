import './LoginPage.css';

// import axios from 'axios'; // axios 안 쓰고 있넹...?!
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoLogin, useLogin } from '../../hooks/useAuthUser';

// import { useQueryClient } from '@tanstack/react-query';

function LoginPage() {
    const navigator = useNavigate();
    const loginMutation = useLogin();
    const demoLoginMutation = useDemoLogin();
    // const queryClient = useQueryClient();

    // ==============================================

    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');

    // =====[체험 계정 생성 + 입장]==============================================
    function startDemo() {
        demoLoginMutation.mutate(undefined, {
            onSuccess: (res) => {
                const demo = res.demoAccounts;

                if (demo) {
                    alert(
                        '체험 계정이 생성되었습니다.\n\n'
                        + `내 계정 : ${demo.mainLoginId} (이미 로그인됨)\n`
                        + `친구 계정 : ${demo.friendLoginIds.join(', ')}\n`
                        + `비밀번호 : ${demo.password} (모든 계정 공통)\n\n`
                        + '친구 계정을 다른 브라우저(또는 시크릿 창)로 로그인하시면\n'
                        + '실시간 채팅을 직접 확인하실 수 있습니다.'
                    );
                }

                navigator('/');
            },
            onError: (e) => {
                if (e.response?.status === 429) {
                    alert(e.response?.data ?? '체험 계정 생성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.');
                } else {
                    alert('체험 계정 생성에 실패했습니다.');
                    console.error(e);
                }
            }
        });
    }


    // =====[로그인 함수]======================================================

    function login(enteredLoginID, enteredPassword) {
        loginMutation.mutate(
            { loginId: enteredLoginID, password: enteredPassword },
            {
                onSuccess: () => {
                    navigator('/');
                },
                onError: (e) => {
                    if (e.response?.status === 401) {
                        alert('아이디 또는 비밀번호가 틀립니다.');
                    } else if (e.response?.status === 403) {
                        alert('이용이 제한된 사용자입니다.');
                    } else {
                        alert('로그인 오류');
                        console.log(e);
                    }
                }
            }
        );
    }



    // ======< return >================================================================================================
    return (
        <div className='LogInPageContainer'
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !loginMutation.isPending) {
                    e.preventDefault();
                    login(loginId, password);
                }
            }}
        >
            {/* <div className='loginTitle'><span>로그인</span></div> */}
            <div className='loginBox'>
                <div className='loginIdPw'>
                    <div className='loginId'>
                        <span>아이디</span>
                        <input type="text" value={loginId}
                            onChange={(e) => setLoginId(e.target.value)} minLength={5} />
                    </div>
                    <div className='loginPw'>
                        <span>비밀번호</span>
                        <input type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} minLength={7} />
                    </div>

                    <div className='findAndJoinBox'>
                        <button onClick={() => navigator('/')}>아이디/비밀번호 찾기</button>
                        <button onClick={() => navigator('/join')}>회원가입</button>
                    </div>
                </div>

                <div className='loginButton'>
                    <button
                        onClick={() => login(loginId, password)}
                        disabled={loginMutation.isPending}
                    >
                        {loginMutation.isPending ? '로그인 중...' : '로그인'}
                    </button>
                    {/* <button onClick={() => login(loginId, password)}>로그인</button> */}
                </div>
            </div>

            <div className='demoLoginBox'>
                <span className='demoLoginTitle'>처음 오셨나요?</span>

                <div className='demoLoginButtons'>
                    <button
                        className='demoLoginButton'
                        onClick={startDemo}
                        disabled={demoLoginMutation.isPending || loginMutation.isPending}
                    >
                        {demoLoginMutation.isPending ? '체험 계정 만드는 중...' : '시연 로그인'}
                    </button>
                </div>

                <span className='demoLoginHint'>
                    버튼을 누르면 체험용 임시 계정과 친구 3명이 자동으로 만들어지고 바로 입장합니다.<br />
                    친구 계정으로도 로그인하실 수 있어 실시간 채팅을 직접 확인해보실 수 있습니다.
                </span>
            </div>

        </div>
    );
}

export default LoginPage;


// function login(enteredLoginID, enteredPassword) {
//     const data = { loginId: enteredLoginID, password: enteredPassword }

//     axios
//         .post(`/user/login`, data)
//         .then((res) => {
//             queryClient.setQueryData(['me'], res.data);
//             navigator('/');

//         }).catch((e) => {
//             if (e.response.status) {
//                 switch (e.response.status) {
//                     case 401:
//                         alert('아이디 또는 비밀번호가 틀립니다.');
//                         break;

//                     case 403:
//                         alert('이용이 제한된 사용자입니다.');
//                         break;

//                     default:
//                         alert(`로그인 오류`);
//                         console.log(e);
//                         break;
//                 }
//             } else {
//                 alert(`알 수 없는 오류`);
//             }
//         });

// }