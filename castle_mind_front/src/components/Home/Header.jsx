import './Header.css';

import { useLocation, useNavigate } from 'react-router-dom';

import { logoutApi } from '../../api/userApi';

function Header({ me, setMe }) {
    const nav = useNavigate();
    const location = useLocation();

    function headerButtonClassName(path) {
        return location.pathname === path ? 'active' : '';
    }

    // ====== 로그아웃 ===========================================================================================
    async function logout() {
        try {
            await logoutApi(); // 서버 세션 삭제가 끝난 뒤에 화면을 바꾼다. 실패했는데 로그인 화면으로 가버리는 걸 막기 위해.
            setMe(null);
            nav('/tempLogin');
        } catch (e) {
            alert('로그아웃 실패');
            console.error(e);
        }
    }

    // ======< return >=======================================================================================================
    return (
        <div className='HeaderContainer'>
            <div className='loginedHeader'>
                {/* 프로필 사진 / 친구코드는 attachment, db 설계 후 추가. */}
                <div className='loginedUserProfileBox'>
                    <div className='loginedUserNickname'><span>{me.nickname}</span></div>
                </div>

                <div className='headerButtonSection'>
                    <button className={headerButtonClassName('/ladder')} onClick={() => nav('/ladder')}>래더</button>
                    <button className={headerButtonClassName('/customGame')} onClick={() => nav('/customGame')}>커스텀게임</button>
                    <button className={headerButtonClassName('/myInfo')} onClick={() => nav('/myInfo')}>내정보</button>
                </div>

                <div className='loginedUserLogoutButton'>
                    <button onClick={logout}>로그아웃</button>
                </div>
            </div>
        </div>
    );
}

export default Header;
