import { Route, Routes } from "react-router-dom";

import TempLogin from "./TempLogin";
import MainPage from "./MainPage";

function RouteBody({ me, setMe }) {

    // ======< return >=======================================================================================================
    return (
        <Routes>
            <Route path="/tempLogin" element={<TempLogin setMe={setMe} />} />
            <Route path="/" element={<MainPage me={me} />} />

            {/* 아직 페이지 미구현. 메뉴 이동 확인용 자리만 둔다. */}
            <Route path="/ladder" element={<div>래더</div>} />
            <Route path="/customGame" element={<div>커스텀게임</div>} />
            <Route path="/myInfo" element={<div>내정보</div>} />
        </Routes>
    );
}

export default RouteBody;
