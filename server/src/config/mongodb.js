const mongoose = require('mongoose');

let connection = null;

async function connectMongoDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/lms_mongo';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
    };

    connection = await mongoose.connect(uri, options);
    
    mongoose.connection.on('connected', () => {
      console.log('🍃 MongoDB에 연결되었습니다.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 오류:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB 연결이 종료되었습니다.');
    });

    // 프로세스 종료 시 연결 정리
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🍃 MongoDB 연결이 정상적으로 종료되었습니다.');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    throw error;
  }
}

async function disconnectMongoDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🍃 MongoDB 연결이 종료되었습니다.');
    }
  } catch (error) {
    console.error('❌ MongoDB 연결 종료 오류:', error);
  }
}

// 연결 상태 확인
function isConnected() {
  return mongoose.connection.readyState === 1;
}

// 헬스 체크
async function healthCheck() {
  try {
    if (isConnected()) {
      await mongoose.connection.db.admin().ping();
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ MongoDB 헬스 체크 실패:', error);
    return false;
  }
}

module.exports = {
  connectMongoDB,
  disconnectMongoDB,
  isConnected,
  healthCheck,
  connection: () => connection
};
