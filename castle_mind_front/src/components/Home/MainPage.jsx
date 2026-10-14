function MainPage({ me }) {

    // ======< return >================================================================================================
    return (
        <div className='MainPageContainer'>
            {me?.nickname}님 환영합니다.
        </div>
    );
}

export default MainPage;
