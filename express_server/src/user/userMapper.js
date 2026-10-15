import dbPool from '../db/dbPool.js';

// users 테이블 SQL. castleChat 의 UserMapper(MyBatis) 자리다.
// ? 자리에 값이 안전하게 들어간다. MyBatis 의 #{loginId} 와 같고 SQL 인젝션을 막는다.

// ====== login_id 로 유저 1명 조회 (없으면 null) ===========================================================================================
export async function getUserByLoginId(loginId) {
    const [rows] = await dbPool.query(
        'SELECT login_id AS loginId, user_nickname AS nickname FROM users WHERE login_id = ?',
        [loginId]
    );

    return rows[0] ?? null;
}

// ====== 회원 추가. 닉네임은 테이블 기본값('유저')을 쓴다 ===========================================================================================
export async function join(loginId) {
    const [result] = await dbPool.query('INSERT INTO users (login_id) VALUES (?)', [loginId]);

    return result.affectedRows;
}
