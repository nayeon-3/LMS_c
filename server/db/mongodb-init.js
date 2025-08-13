// LMS MongoDB 초기 스키마 (dbplan.md 기반)
// docker-entrypoint-initdb.d 에 의해 최초 1회 자동 실행됨

db = db.getSiblingDB('lms_mongo');

// Users
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id","password","email","role"],
      properties: {
        id: { bsonType: "string" },
        password: { bsonType: "string" },
        email:    { bsonType: "string", pattern: "^.+@.+\\..+$" },
        Name: { bsonType: "string" },
        role:     { enum: ["admin","teacher","student"] },
        createdAt:{ bsonType: "date" }
      }
    }
  }
});

// Students
db.createCollection("students", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId"],
      properties: {
        userId:     { bsonType: "objectId" },
        classGroup: { bsonType: "string" },
        status:     { enum: ["active","inactive"] }
      }
    }
  }
});

// Courses
db.createCollection("courses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["code","name","instructorId"],
      properties: {
        code:         { bsonType: "string" },
        name:         { bsonType: "string" },
        description:  { bsonType: "string" },
        instructorId: { bsonType: "objectId" }
      }
    }
  }
});

// Topics
db.createCollection("topics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["courseId","name"],
      properties: {
        courseId:   { bsonType: "objectId" },
        name:       { bsonType: "string" },
        description:{ bsonType: "string" }
      }
    }
  }
});

// QuestionBank
db.createCollection("questionBank", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type","difficulty","topicId","prompt","answer"],
      properties: {
        type:       { enum: ["MCQ","ESSAY"] },
        difficulty: { enum: ["low","medium","high"] },
        topicId:    { bsonType: "objectId" },
        prompt:     { bsonType: "string" },
        choices:    { bsonType: "array", items: { bsonType: "object" } },
        answer:     { bsonType: "string" },
        explanation:{ bsonType: "string" }
      }
    }
  }
});

// Tests
db.createCollection("tests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title","creatorId"],
      properties: {
        title:      { bsonType: "string" },
        creatorId:  { bsonType: "objectId" },
        startTime:  { bsonType: "date" },
        endTime:    { bsonType: "date" },
        timeLimit:  { bsonType: "int" }
      }
    }
  }
});

// RandomTestConfigs
db.createCollection("randomTestConfigs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["testId","numQuestions"],
      properties: {
        testId:       { bsonType: "objectId" },
        topicId:      { bsonType: ["objectId","null"] },
        difficulty:   { enum: ["low","medium","high","null"] },
        numQuestions: { bsonType: "int" }
      }
    }
  }
});

// TestAttempts
db.createCollection("testAttempts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["testId","studentId","startedAt"],
      properties: {
        testId:     { bsonType: "objectId" },
        studentId:  { bsonType: "objectId" },
        startedAt:  { bsonType: "date" },
        finishedAt: { bsonType: "date" }
      }
    }
  }
});

// Answers
db.createCollection("answers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["attemptId","questionId","response"],
      properties: {
        attemptId:  { bsonType: "objectId" },
        questionId: { bsonType: "objectId" },
        response:   { bsonType: "string" },
        isCorrect:  { bsonType: "bool" },
        score:      { bsonType: "double" }
      }
    }
  }
});

// LLM Feedback
db.createCollection("llmFeedback", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["attemptId","questionId","feedback","score"],
      properties: {
        attemptId:  { bsonType: "objectId" },
        questionId: { bsonType: "objectId" },
        feedback:   { bsonType: "string" },
        score:      { bsonType: "double" },
        createdAt:  { bsonType: "date" }
      }
    }
  }
});

// PerformanceStats
db.createCollection("performanceStats", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["studentId","topicId","correctCount","totalCount","statDate"],
      properties: {
        studentId:    { bsonType: "objectId" },
        topicId:      { bsonType: "objectId" },
        correctCount: { bsonType: "int" },
        totalCount:   { bsonType: "int" },
        statDate:     { bsonType: "date" }
      }
    }
  }
});

// 인덱스
db.users.createIndex({ id: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.students.createIndex({ userId: 1 }, { unique: true });
db.students.createIndex({ status: 1 });

db.courses.createIndex({ code: 1 }, { unique: true });
db.courses.createIndex({ instructorId: 1 });

db.topics.createIndex({ courseId: 1 });

db.questionBank.createIndex({ topicId: 1 });
db.questionBank.createIndex({ type: 1 });
db.questionBank.createIndex({ difficulty: 1 });

db.tests.createIndex({ creatorId: 1 });
db.tests.createIndex({ startTime: 1 });
db.tests.createIndex({ endTime: 1 });

db.testAttempts.createIndex({ testId: 1 });
db.testAttempts.createIndex({ studentId: 1 });
db.testAttempts.createIndex({ startedAt: 1 });

db.answers.createIndex({ attemptId: 1 });
db.answers.createIndex({ questionId: 1 });

db.llmFeedback.createIndex({ attemptId: 1 });
db.llmFeedback.createIndex({ questionId: 1 });

db.performanceStats.createIndex({ studentId: 1 });
db.performanceStats.createIndex({ topicId: 1 });
db.performanceStats.createIndex({ statDate: 1 });
db.performanceStats.createIndex({ studentId: 1, topicId: 1, statDate: 1 });

// MongoDB 초기화 스크립트 (dbplan.md 기반)

// 사용자 컬렉션 (admin, instructor, student)
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "password", "email", "role"],
      properties: {
        id: { bsonType: "string" },
        password: { bsonType: "string" },
        email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
        Name: { bsonType: "string" },
        role: { enum: ["admin", "teacher", "student"] },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// 학생 프로파일 (users.role='student')
db.createCollection("students", {
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

// 과목 및 주제
db.createCollection("courses", {
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

db.createCollection("topics", {
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

// 문제은행
db.createCollection("questionBank", {
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

// 테스트 정의
db.createCollection("tests", {
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

// 랜덤 출제 설정
db.createCollection("randomTestConfigs", {
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

// 응시 기록 및 답안
db.createCollection("testAttempts", {
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

db.createCollection("answers", {
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

// LLM 피드백
db.createCollection("llmFeedback", {
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

// 성능 통계
db.createCollection("performanceStats", {
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

// 인덱스 생성
db.users.createIndex({ "id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.students.createIndex({ "userId": 1 }, { unique: true });
db.students.createIndex({ "status": 1 });

db.courses.createIndex({ "code": 1 }, { unique: true });
db.courses.createIndex({ "instructorId": 1 });

db.topics.createIndex({ "courseId": 1 });

db.questionBank.createIndex({ "topicId": 1 });
db.questionBank.createIndex({ "type": 1 });
db.questionBank.createIndex({ "difficulty": 1 });

db.tests.createIndex({ "creatorId": 1 });
db.tests.createIndex({ "startTime": 1 });
db.tests.createIndex({ "endTime": 1 });

db.testAttempts.createIndex({ "testId": 1 });
db.testAttempts.createIndex({ "studentId": 1 });
db.testAttempts.createIndex({ "startedAt": 1 });

db.answers.createIndex({ "attemptId": 1 });
db.answers.createIndex({ "questionId": 1 });

db.llmFeedback.createIndex({ "attemptId": 1 });
db.llmFeedback.createIndex({ "questionId": 1 });

db.performanceStats.createIndex({ "studentId": 1 });
db.performanceStats.createIndex({ "topicId": 1 });
db.performanceStats.createIndex({ "statDate": 1 });
db.performanceStats.createIndex({ "studentId": 1, "topicId": 1, "statDate": 1 });

console.log("✅ MongoDB 컬렉션 및 인덱스가 성공적으로 생성되었습니다.");
