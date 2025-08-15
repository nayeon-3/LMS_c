const jwt = require('jsonwebtoken');

function verifyJwt(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    let token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null;
    // 쿠키에서 토큰 폴백
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
    }
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }
    return next();
  };
}

module.exports = { verifyJwt, requireRole };


