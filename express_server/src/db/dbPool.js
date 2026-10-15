import mysql from 'mysql2/promise';

// MariaDB 커넥션 풀. Spring 이 application.properties 의 spring.datasource.* 를 보고 만들어 주던 HikariCP DataSource 를 직접 만든다.
// 값은 .env 에서 읽는다. (package.json 실행 명령의 --env-file=.env 가 process.env 에 넣어 준다)
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10 // HikariCP 의 maximum-pool-size
});

export default dbPool;
