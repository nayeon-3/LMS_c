const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// 환경 변수에서 MongoDB 연결 정보 가져오기
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/lms_mongo?authSource=admin';

async function ensureCollection(db, name, options) {
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name, options);
  } else if (options && options.validator) {
    // 기존 컬렉션의 validator 업데이트
    try {
      await db.command({ collMod: name, validator: options.validator });
      // 필요한 경우 validationLevel/Action도 조정 가능
    } catch (e) {
      console.warn(`⚠️  collMod 실패 (${name}):`, e.message);
    }
  }
}

// [ADDED] 역할별 프로파일 1회 백필: 기존 users는 손대지 않고, 누락된 프로파일만 생성
async function syncRoleProfilesOnce(db) {
  const usersCol = db.collection('users');
  const studentsCol = db.collection('students');
  const teachersCol = db.collection('teachers');

  // 학생: users.role === 'student' 이고 students.userId가 없는 경우만 생성
  const studentCursor = usersCol.find({ role: 'student' }, { projection: { _id: 1 } });
  while (await studentCursor.hasNext()) {
    const u = await studentCursor.next();
    const exists = await studentsCol.findOne({ userId: u._id }, { projection: { _id: 1 } });
    if (!exists) {
      await studentsCol.insertOne({
        userId: u._id,
        status: 'active',
        createdAt: new Date()
      });
    }
  }

  // 교사: users.role === 'teacher' 이고 teachers.userId가 없는 경우만 생성
  const teacherCursor = usersCol.find({ role: 'teacher' }, { projection: { _id: 1 } });
  while (await teacherCursor.hasNext()) {
    const u = await teacherCursor.next();
    const exists = await teachersCol.findOne({ userId: u._id }, { projection: { _id: 1 } });
    if (!exists) {
      await teachersCol.insertOne({
        userId: u._id,
        status: 'active',
        createdAt: new Date()
      });
    }
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
            role: { enum: ["admin", "teacher", "student"] }, // teacher 사용
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

    // [ADDED] 교사 프로파일 컬렉션 생성
    await ensureCollection(db, "teachers", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId"],
          properties: {
            userId: { bsonType: "objectId" },
            dept: { bsonType: "string" },
            status: { enum: ["active", "inactive"] }
          }
        }
      }
    });
    
    // 과목 컬렉션 생성 (PostgreSQL 양식에 맞춰 name, teacherId 사용)
    await ensureCollection(db, "courses", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["code", "name", "teacherId"],
          properties: {
            code: { bsonType: "string" },
            name: { bsonType: "string" },
            description: { bsonType: "string" },
            teacherId: { bsonType: "objectId" } // teacherId 사용
          }
        }
      }
    });
    
    // 주제 컬렉션 생성 (courseId 참조)
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
    
    // 문제은행 컬렉션 생성 (prompt 필드 사용)
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

    // [ADDED] teachers 인덱스
    await db.collection("teachers").createIndex({ "userId": 1 }, { unique: true });
    await db.collection("teachers").createIndex({ "status": 1 });
    
    await db.collection("courses").createIndex({ "code": 1 }, { unique: true });
    // [FIX] teacherId로 인덱스 생성 (기존 instructorId 오타 수정)
    await db.collection("courses").createIndex({ "teacherId": 1 });
    
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

    // [ADDED] 역할→프로파일 1회 백필(기존 문서는 수정하지 않음)
    console.log('🔄 역할-프로파일 백필 실행(누락된 문서만 생성)...');
    await syncRoleProfilesOnce(db);
    console.log('✅ 백필 완료!');
    
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