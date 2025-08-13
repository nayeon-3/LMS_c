const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 환경 변수에서 MongoDB 연결 정보 가져오기
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/lms_mongo?authSource=admin';

async function ensureCollection(db, name, options) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name, options);
  }
}

async function migrateMongoDB() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔌 MongoDB에 연결 중...');
    await client.connect();
    console.log('✅ MongoDB 연결 성공!');
    
    const db = client.db();
    
    console.log('📝 MongoDB 컬렉션 및 인덱스 생성 중...');
    
    // 사용자 컬렉션 생성
    await ensureCollection(db, "users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["username", "password", "email", "role"],
          properties: {
            username: { bsonType: "string" },
            password: { bsonType: "string" },
            email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
            fullName: { bsonType: "string" },
            role: { enum: ["admin", "instructor", "student"] },
            createdAt: { bsonType: "date" }
          }
        }
      }
    });
    
    // 학생 프로파일 컬렉션 생성
    await ensureCollection(db, "students", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId"],
          properties: {
            userId: { bsonType: "objectId" },
            classGroup: { bsonType: "string" },
            status: { enum: ["active", "inactive"] }
          }
        }
      }
    });
    
    // 과목 컬렉션 생성
    await ensureCollection(db, "courses", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["code", "name", "instructorId"],
          properties: {
            code: { bsonType: "string" },
            name: { bsonType: "string" },
            description: { bsonType: "string" },
            instructorId: { bsonType: "objectId" }
          }
        }
      }
    });
    
    // 주제 컬렉션 생성
    await ensureCollection(db, "topics", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["courseId", "name"],
          properties: {
            courseId: { bsonType: "objectId" },
            name: { bsonType: "string" },
            description: { bsonType: "string" }
          }
        }
      }
    });
    
    // 문제은행 컬렉션 생성
    await ensureCollection(db, "questionBank", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["type", "difficulty", "topicId", "prompt", "answer"],
          properties: {
            type: { enum: ["MCQ", "ESSAY"] },
            difficulty: { enum: ["low", "medium", "high"] },
            topicId: { bsonType: "objectId" },
            prompt: { bsonType: "string" },
            choices: { bsonType: "array", items: { bsonType: "object" } },
            answer: { bsonType: "string" },
            explanation: { bsonType: "string" }
          }
        }
      }
    });
    
    // 테스트 컬렉션 생성
    await ensureCollection(db, "tests", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "creatorId"],
          properties: {
            title: { bsonType: "string" },
            creatorId: { bsonType: "objectId" },
            startTime: { bsonType: "date" },
            endTime: { bsonType: "date" },
            timeLimit: { bsonType: "int" }
          }
        }
      }
    });
    
    // 랜덤 출제 설정 컬렉션 생성
    await ensureCollection(db, "randomTestConfigs", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["testId", "numQuestions"],
          properties: {
            testId: { bsonType: "objectId" },
            topicId: { bsonType: ["objectId", "null"] },
            difficulty: { enum: ["low", "medium", "high", "null"] },
            numQuestions: { bsonType: "int" }
          }
        }
      }
    });
    
    // 테스트 응시 기록 컬렉션 생성
    await ensureCollection(db, "testAttempts", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["testId", "studentId", "startedAt"],
          properties: {
            testId: { bsonType: "objectId" },
            studentId: { bsonType: "objectId" },
            startedAt: { bsonType: "date" },
            finishedAt: { bsonType: "date" }
          }
        }
      }
    });
    
    // 답안 컬렉션 생성
    await ensureCollection(db, "answers", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["attemptId", "questionId", "response"],
          properties: {
            attemptId: { bsonType: "objectId" },
            questionId: { bsonType: "objectId" },
            response: { bsonType: "string" },
            isCorrect: { bsonType: "bool" },
            score: { bsonType: "double" }
          }
        }
      }
    });
    
    // LLM 피드백 컬렉션 생성
    await ensureCollection(db, "llmFeedback", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["attemptId", "questionId", "feedback", "score"],
          properties: {
            attemptId: { bsonType: "objectId" },
            questionId: { bsonType: "objectId" },
            feedback: { bsonType: "string" },
            score: { bsonType: "double" },
            createdAt: { bsonType: "date" }
          }
        }
      }
    });
    
    // 성능 통계 컬렉션 생성
    await ensureCollection(db, "performanceStats", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["studentId", "topicId", "correctCount", "totalCount", "statDate"],
          properties: {
            studentId: { bsonType: "objectId" },
            topicId: { bsonType: "objectId" },
            correctCount: { bsonType: "int" },
            totalCount: { bsonType: "int" },
            statDate: { bsonType: "date" }
          }
        }
      }
    });
    
    console.log('✅ MongoDB 컬렉션이 성공적으로 생성되었습니다!');
    
    // 인덱스 생성
    console.log('📊 인덱스 생성 중...');
    
    await db.collection("users").createIndex({ "username": 1 }, { unique: true });
    await db.collection("users").createIndex({ "email": 1 }, { unique: true });
    await db.collection("users").createIndex({ "role": 1 });
    
    await db.collection("students").createIndex({ "userId": 1 }, { unique: true });
    await db.collection("students").createIndex({ "status": 1 });
    
    await db.collection("courses").createIndex({ "code": 1 }, { unique: true });
    await db.collection("courses").createIndex({ "instructorId": 1 });
    
    await db.collection("topics").createIndex({ "courseId": 1 });
    
    await db.collection("questionBank").createIndex({ "topicId": 1 });
    await db.collection("questionBank").createIndex({ "type": 1 });
    await db.collection("questionBank").createIndex({ "difficulty": 1 });
    
    await db.collection("tests").createIndex({ "creatorId": 1 });
    await db.collection("tests").createIndex({ "startTime": 1 });
    await db.collection("tests").createIndex({ "endTime": 1 });
    
    await db.collection("testAttempts").createIndex({ "testId": 1 });
    await db.collection("testAttempts").createIndex({ "studentId": 1 });
    await db.collection("testAttempts").createIndex({ "startedAt": 1 });
    
    await db.collection("answers").createIndex({ "attemptId": 1 });
    await db.collection("answers").createIndex({ "questionId": 1 });
    
    await db.collection("llmFeedback").createIndex({ "attemptId": 1 });
    await db.collection("llmFeedback").createIndex({ "questionId": 1 });
    
    await db.collection("performanceStats").createIndex({ "studentId": 1 });
    await db.collection("performanceStats").createIndex({ "topicId": 1 });
    await db.collection("performanceStats").createIndex({ "statDate": 1 });
    await db.collection("performanceStats").createIndex({ "studentId": 1, "topicId": 1, "statDate": 1 });
    
    console.log('✅ MongoDB 인덱스가 성공적으로 생성되었습니다!');
    
    // 컬렉션 목록 확인
    const collections = await db.listCollections().toArray();
    console.log('\n📊 생성된 컬렉션 목록:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB 마이그레이션 실패:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  migrateMongoDB()
    .then(() => {
      console.log('\n🎉 MongoDB 마이그레이션이 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 마이그레이션 실패:', error);
      process.exit(1);
    });
}

module.exports = { migrateMongoDB };
