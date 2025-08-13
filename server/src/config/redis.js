const redis = require('redis');

let client = null;

async function connectRedis() {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || null,
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('❌ Redis 서버가 거부했습니다.');
          return new Error('Redis 서버가 거부했습니다.');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('❌ Redis 재시도 시간이 초과되었습니다.');
          return new Error('Redis 재시도 시간이 초과되었습니다.');
        }
        if (options.attempt > 10) {
          console.error('❌ Redis 재시도 횟수가 초과되었습니다.');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('connect', () => {
      console.log('🔴 Redis에 연결되었습니다.');
    });

    client.on('error', (err) => {
      console.error('❌ Redis 오류:', err);
    });

    client.on('ready', () => {
      console.log('✅ Redis가 준비되었습니다.');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Redis 연결 실패:', error);
    throw error;
  }
}

async function get(key) {
  try {
    if (!client) throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('❌ Redis GET 오류:', error);
    return null;
  }
}

async function set(key, value, expireTime = 3600) {
  try {
    if (!client) throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    await client.setEx(key, expireTime, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('❌ Redis SET 오류:', error);
    return false;
  }
}

async function del(key) {
  try {
    if (!client) throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    await client.del(key);
    return true;
  } catch (error) {
    console.error('❌ Redis DEL 오류:', error);
    return false;
  }
}

async function flush() {
  try {
    if (!client) throw new Error('Redis 클라이언트가 연결되지 않았습니다.');
    await client.flushAll();
    return true;
  } catch (error) {
    console.error('❌ Redis FLUSH 오류:', error);
    return false;
  }
}

module.exports = {
  connectRedis,
  get,
  set,
  del,
  flush,
  client: () => client
};
