import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

// CRA 때 react-scripts 안에 들어 있던 코드 검사를 Vite 공식 템플릿과 같은 구성으로 다시 붙였다.
// npm run lint 로 실행한다.
export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{js,jsx}'],
        extends: [
            js.configs.recommended,                 // JS 기본 규칙 (안 쓰는 변수, 선언 안 된 변수 등)
            reactHooks.configs.flat.recommended,    // Hook 규칙 (조건문 안 Hook 금지, 의존성 배열 누락)
            reactRefresh.configs.vite               // Vite 의 화면 즉시 갱신이 깨지는 export 경고
        ],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,               // window, document 같은 브라우저 전역 변수
            parserOptions: {
                ecmaFeatures: { jsx: true }
            }
        },
        rules: {
            // 대문자로 시작하는 이름(컴포넌트, import React 등)은 안 써도 경고하지 않는다.
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }]
        }
    }
]);
