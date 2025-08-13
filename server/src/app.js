const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 인증 라우트
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// 관리자 라우트
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);

// 헬스 체크
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'LMS 서버가 정상적으로 실행 중입니다!'
  });
});

// 기본 API 엔드포인트
app.get('/api', (req, res) => {
  res.json({ 
    message: 'LMS API 서버에 오신 것을 환영합니다!',
    version: '1.0.0',
    endpoints: ['/health', '/api']
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 LMS 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 헬스 체크: http://localhost:${PORT}/health`);
});

module.exports = app;
