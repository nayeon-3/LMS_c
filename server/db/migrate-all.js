const { migratePostgreSQL } = require('./migrate-postgresql');
const { migrateMongoDB } = require('./migrate-mongodb');

async function migrateAll() {
  console.log('🚀 LMS 시스템 데이터베이스 마이그레이션을 시작합니다...\n');
  
  try {
    // PostgreSQL 마이그레이션
    console.log('📊 PostgreSQL 마이그레이션 시작');
    console.log('='.repeat(50));
    await migratePostgreSQL();
    console.log('='.repeat(50));
    
    console.log('\n');
    
    // MongoDB 마이그레이션
    console.log('📊 MongoDB 마이그레이션 시작');
    console.log('='.repeat(50));
    await migrateMongoDB();
    console.log('='.repeat(50));
    
    console.log('\n🎉 모든 데이터베이스 마이그레이션이 성공적으로 완료되었습니다!');
    
  } catch (error) {
    console.error('\n💥 마이그레이션 실패:', error.message);
    throw error;
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  migrateAll()
    .then(() => {
      console.log('\n✅ LMS 시스템이 사용할 준비가 되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateAll };
