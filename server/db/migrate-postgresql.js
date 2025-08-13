const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 환경 변수에서 데이터베이스 연결 정보 가져오기
const sanitize = (v, fallback = undefined) => {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'string') return v.trim();
  return v;
};

const config = {
  host: sanitize(process.env.DB_HOST, 'localhost'),
  port: parseInt(sanitize(process.env.DB_PORT, '5432'), 10) || 5432,
  database: sanitize(process.env.DB_NAME, 'lms_db'),
  user: sanitize(process.env.DB_USER, 'postgres'),
  password: sanitize(process.env.DB_PASSWORD, 'password')
};

async function migratePostgreSQL() {
  const client = new Client(config);
  
  try {
    console.log('🔌 PostgreSQL에 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');
    
    // init.sql 파일 읽기
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    console.log('📝 데이터베이스 스키마 생성 중...');
    
    // SQL 스크립트 실행
    await client.query(initSql);
    
    console.log('✅ PostgreSQL 마이그레이션이 성공적으로 완료되었습니다!');
    
    // 테이블 목록 확인
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 생성된 테이블 목록:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ PostgreSQL 마이그레이션 실패:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  migratePostgreSQL()
    .then(() => {
      console.log('\n🎉 PostgreSQL 마이그레이션이 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migratePostgreSQL };
