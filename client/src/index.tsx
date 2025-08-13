import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// HTML 메타데이터 설정
const setMetaTags = () => {
  // 메타 태그 설정
  const metaTags = [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#000000' },
    { name: 'description', content: 'LMS (Learning Management System) - 학습 관리 시스템' },
    { name: 'apple-touch-icon', content: '%PUBLIC_URL%/logo192.png' },
    { name: 'manifest', content: '%PUBLIC_URL%/manifest.json' }
  ];

  metaTags.forEach(tag => {
    if (tag.charset) {
      // charset 메타 태그 생성
      let charsetMeta = document.querySelector('meta[charset]');
      if (!charsetMeta) {
        charsetMeta = document.createElement('meta');
        charsetMeta.setAttribute('charset', tag.charset);
        document.head.insertBefore(charsetMeta, document.head.firstChild);
      }
    } else if (tag.name && tag.content) {
      let meta = document.querySelector(`meta[name="${tag.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', tag.name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', tag.content);
    }
  });

  // 파비콘 설정
  const favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = '%PUBLIC_URL%/favicon.ico';
    document.head.appendChild(link);
  }

  // 제목 설정
  document.title = 'LMS - 학습 관리 시스템';
};

// 앱 초기화
const initializeApp = () => {
  // 메타 태그 설정
  setMetaTags();

  // 루트 엘리먼트 찾기 또는 생성
  let rootElement = document.getElementById('root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  // React 앱 렌더링
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// JavaScript 비활성화 시 메시지 표시
const showNoScriptMessage = () => {
  const noScript = document.createElement('noscript');
  noScript.textContent = '이 앱을 실행하려면 JavaScript를 활성화해야 합니다.';
  document.body.appendChild(noScript);
};

showNoScriptMessage();
