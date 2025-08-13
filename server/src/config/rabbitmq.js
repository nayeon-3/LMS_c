const amqp = require('amqplib');

let connection = null;
let channel = null;

async function connectRabbitMQ() {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    connection = await amqp.connect(url);
    
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ 연결 오류:', err);
    });

    connection.on('close', () => {
      console.log('🔌 RabbitMQ 연결이 종료되었습니다.');
    });

    channel = await connection.createChannel();
    
    // 큐 선언
    await channel.assertQueue('llm_scoring', { durable: true });
    await channel.assertQueue('test_results', { durable: true });
    await channel.assertQueue('notifications', { durable: true });
    
    console.log('🐰 RabbitMQ에 연결되었습니다.');
    return { connection, channel };
  } catch (error) {
    console.error('❌ RabbitMQ 연결 실패:', error);
    throw error;
  }
}

async function sendToQueue(queueName, data) {
  try {
    if (!channel) throw new Error('RabbitMQ 채널이 연결되지 않았습니다.');
    
    const message = JSON.stringify(data);
    const result = await channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
      timestamp: Date.now()
    });
    
    console.log(`📤 메시지를 ${queueName} 큐에 전송했습니다:`, data);
    return result;
  } catch (error) {
    console.error('❌ 큐 전송 오류:', error);
    throw error;
  }
}

async function consumeQueue(queueName, callback) {
  try {
    if (!channel) throw new Error('RabbitMQ 채널이 연결되지 않았습니다.');
    
    await channel.consume(queueName, (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log(`📥 ${queueName} 큐에서 메시지를 받았습니다:`, data);
          
          callback(data, msg);
          
          // 메시지 확인
          channel.ack(msg);
        } catch (error) {
          console.error('❌ 메시지 처리 오류:', error);
          // 메시지 거부 (재시도 큐로 이동)
          channel.nack(msg, false, false);
        }
      }
    });
    
    console.log(`👂 ${queueName} 큐를 구독하고 있습니다.`);
  } catch (error) {
    console.error('❌ 큐 구독 오류:', error);
    throw error;
  }
}

async function closeConnection() {
  try {
    if (channel) {
      await channel.close();
      console.log('🔌 RabbitMQ 채널이 종료되었습니다.');
    }
    if (connection) {
      await connection.close();
      console.log('🔌 RabbitMQ 연결이 종료되었습니다.');
    }
  } catch (error) {
    console.error('❌ RabbitMQ 연결 종료 오류:', error);
  }
}

module.exports = {
  connectRabbitMQ,
  sendToQueue,
  consumeQueue,
  closeConnection,
  getChannel: () => channel,
  getConnection: () => connection
};
