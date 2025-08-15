const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectMongoDB, isConnected } = require('../config/mongodb');
const { query: pgQuery, connectDB: connectPostgres } = require('../config/database');

const router = express.Router();

function issueJwtToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const payload = { sub: user.id, username: user.username, role: user.role };
  return jwt.sign(payload, secret, { expiresIn: '2h' });
}

// 데모용 메모리 사용자 제거: 항상 DB에서만 조회

async function findUserFromMongo(identifier, requiredRole) {
  try {
    if (!isConnected()) {
      await connectMongoDB();
    }
    const mongoose = require('mongoose');
    const col = mongoose.connection.collection('users');
    const doc = await col.findOne({
      $and: [
        { role: requiredRole },
        { $or: [ { username: identifier }, { id: identifier }, { email: identifier } ] }
      ]
    });
    if (!doc) return null;

    // 표준화된 사용자 객체 형태로 변환
    return {
      id: doc.id || String(doc._id),
      username: doc.username || doc.email || doc.id,
      password: doc.password,
      role: doc.role
    };
  } catch (err) {
    return null;
  }
}

function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

async function findUserFromPostgres(identifier, requiredRole) {
  try {
    await connectPostgres();
    const sql = `
      SELECT u.user_id, u.id AS login_id, u.password, r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE (u.id = $1 OR u.email = $1) AND r.name = $2
      LIMIT 1
    `;
    const result = await pgQuery(sql, [identifier, requiredRole]);
    if (!result.rows || result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.login_id,
      username: row.login_id,
      password: row.password,
      role: row.role,
    };
  } catch (err) {
    return null;
  }
}

function buildLoginHandler(requiredRole) {
  return async (req, res) => {
    try {
      const { id, username, password } = req.body || {};
      console.log(`[AUTH] Login attempt role=${requiredRole}, id/username=${username || id}`);
      const identifier = (username || id || '').trim();
      if (!identifier || !password) {
        return res.status(400).json({ message: '아이디와 비밀번호를 모두 입력해주세요.' });
      }

      // AUTH_SOURCE에 따라 DB에서만 조회 (메모리 폴백 금지)
      let user = null;
      const envSource = (process.env.AUTH_SOURCE || process.env.DB_STRATEGY || '').toLowerCase();
      const authSource = envSource.includes('mongo') ? 'mongo'
                        : (envSource.includes('postg') || envSource === 'pg') ? 'postgres'
                        : '';
      console.log(`[AUTH] Using auth source='${authSource || 'auto'}'`);
      if (authSource === 'mongo') {
        user = await findUserFromMongo(identifier, requiredRole);
      } else if (authSource === 'postgres' || authSource === 'postgresql') {
        user = await findUserFromPostgres(identifier, requiredRole);
      } else {
        // 미설정 시 양쪽 DB를 순차 조회
        user = await findUserFromMongo(identifier, requiredRole);
        if (!user) user = await findUserFromPostgres(identifier, requiredRole);
      }
      console.log(`[AUTH] User lookup result: ${user ? 'FOUND' : 'NOT FOUND'}`);
      if (!user) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({ message: '접근 권한이 없습니다.' });
      }

      let match = false;
      if (isBcryptHash(user.password)) {
        match = await bcrypt.compare(password, user.password);
      } else {
        // 개발 초기 단계 호환: 해시가 아니면 평문 비교
        match = password === user.password;
      }
      console.log(`[AUTH] Password match: ${match}`);
      if (!match) {
        return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
      }

      const token = issueJwtToken(user);
      // 쿠키 설정 (HttpOnly)
      const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
      const twoHoursMs = 2 * 60 * 60 * 1000;
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProd, // 프로덕션에서만 secure
        sameSite: 'lax',
        maxAge: twoHoursMs,
        path: '/',
      });

      return res.status(200).json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch (err) {
      console.error('[AUTH] Login error:', err);
      const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
      return res.status(500).json({ message: isProd ? '서버 오류가 발생했습니다.' : `서버 오류: ${err?.message || err}` });
    }
  };
}

// 역할별 로그인 엔드포인트
router.post('/admin/login', buildLoginHandler('admin'));
router.post('/teacher/login', buildLoginHandler('teacher'));
router.post('/student/login', buildLoginHandler('student'));

// 라우터 상태 확인용 핑
router.get('/ping', (req, res) => {
  res.json({ ok: true, routes: ['POST /admin/login', 'POST /teacher/login', 'POST /student/login'] });
});

module.exports = router;


