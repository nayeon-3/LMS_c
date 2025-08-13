const { Pool } = require('pg');

function sanitize(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return value.trim();
  return value;
}

const pool = new Pool({
  user: sanitize(process.env.DB_USER, 'postgres'),
  host: sanitize(process.env.DB_HOST, 'localhost'),
  database: sanitize(process.env.DB_NAME, 'lms_db'),
  password: sanitize(process.env.DB_PASSWORD, 'password'),
  port: parseInt(sanitize(process.env.DB_PORT, '5432'), 10) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 테스트
pool.on('connect', () => {
  console.log('📊 PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

async function connectDB() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    throw error;
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📝 쿼리 실행:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ 쿼리 실행 오류:', error);
    throw error;
  }
}

module.exports = {
  connectDB,
  query,
  pool
};
