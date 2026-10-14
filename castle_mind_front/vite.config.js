import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// CRA 때 package.json 의 "proxy" 가 하던 일을 여기서 한다.
// 프론트(3000)에서 보낸 /user 요청을 Express(4000)로 넘겨서, 세션 쿠키가 같은 주소처럼 오간다.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/user': 'http://localhost:4000'
        }
    }
});
