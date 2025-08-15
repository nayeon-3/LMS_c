const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 디버그 로깅 설정
const debug = require('debug')('app:server');
console.log('=== 서버 시작 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('CLIENT_URL:', process.env.CLIENT_URL);

// 미들웨어
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 라우트 등록 전에 로깅
console.log('=== 라우트 등록 시작 ===');

// 인증 라우트
console.log('인증 라우트 등록: /api/auth');
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// 관리자 라우트
console.log('관리자 라우트 등록: /api/admin');
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

console.log('헬스 체크 라우트 등록: /api/health');
// 헬스 체크 (가장 먼저 정의)
app.get('/api/health', (req, res) => {
  console.log('헬스 체크 요청 수신');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'LMS 서버가 정상적으로 실행 중입니다!',
    database: {
      mongodb: require('./config/mongodb').isConnected() ? 'connected' : 'disconnected',
      postgresql: 'checking...' // PostgreSQL 상태는 별도로 확인 필요
    }
  });
});

// 이전 버전과의 호환성을 위한 리다이렉트
app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

// 기본 API 엔드포인트
app.get('/api', (req, res) => {
  res.json({ 
    message: 'LMS API 서버에 오신 것을 환영합니다!',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/auth/admin/login',
      '/api/auth/teacher/login',
      '/api/auth/student/login'
    ]
  });
});

// 프로덕션 환경에서 React 앱 제공
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  console.log('정적 파일 제공 경로:', clientBuildPath);
  
  // 정적 파일 제공
  app.use(express.static(clientBuildPath));
  
  // SPA를 위한 라우트 처리
  app.get('*', (req, res) => {
    console.log('요청 경로에 대해 index.html 제공:', req.path);
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 개발 환경을 위한 404 처리
  app.use('*', (req, res) => {
    console.log('404 에러 - 요청 경로:', req.originalUrl);
    console.log('사용 가능한 메서드:', req.method);
    res.status(404).json({ 
      message: '요청한 리소스를 찾을 수 없습니다. (개발 모드)',
      path: req.originalUrl,
      method: req.method,
      note: '프로덕션 모드에서는 React 앱이 이 요청을 처리합니다.'
    });
  });
}

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 LMS 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 헬스 체크: http://localhost:${PORT}/health`);
});

module.exports = app;
