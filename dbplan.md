1. PostgreSQL 테이블 정의
-- 사용자 및 역할
CREATE TABLE roles (
    role_id   SERIAL PRIMARY KEY,
    name      VARCHAR(20) NOT NULL UNIQUE  -- 'admin', 'teacher', 'student'
);

CREATE TABLE users (
    user_id    SERIAL PRIMARY KEY,
    role_id    INT NOT NULL REFERENCES roles(role_id),
    id   VARCHAR(50) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,docker compose up -d postgres mongodb
    email      VARCHAR(100) NOT NULL UNIQUE,
    name  VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 교사 정보 (users.role_id = 2)
CREATE TABLE teachers (
    teacher_id  INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    dept        VARCHAR(100),
    status      VARCHAR(20) DEFAULT 'active'
);

-- 학생 정보 (users.role_id = 3)
CREATE TABLE students (
    student_id   INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    class_group  VARCHAR(50),
    status       VARCHAR(20) DEFAULT 'active'
);

-- 과목 및 주제
CREATE TABLE courses (
    course_id   SERIAL PRIMARY KEY,
    code        VARCHAR(20) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id INT REFERENCES users(user_id)
);

CREATE TABLE topics (
    topic_id    SERIAL PRIMARY KEY,
    course_id   INT NOT NULL REFERENCES courses(course_id),
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

-- 문제은행
CREATE TABLE question_bank (
    question_id SERIAL PRIMARY KEY,
    type        VARCHAR(20) NOT NULL,       -- 'MCQ', 'ESSAY'
    difficulty  VARCHAR(10) NOT NULL,       -- 'low','medium','high'
    topic_id    INT NOT NULL REFERENCES topics(topic_id),
    prompt      TEXT NOT NULL,
    choices     JSONB,                      -- 객관식 선택지 [{"key":"A","text":"..."},...]
    answer      TEXT NOT NULL,
    explanation TEXT
);

-- 테스트 정의
CREATE TABLE tests (
    test_id      SERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    creator_id   INT NOT NULL REFERENCES users(user_id),
    start_time   TIMESTAMP WITH TIME ZONE,
    end_time     TIMESTAMP WITH TIME ZONE,
    time_limit   INT                            -- 분 단위
);

CREATE TABLE test_items (
    test_id      INT REFERENCES tests(test_id) ON DELETE CASCADE,
    question_id  INT REFERENCES question_bank(question_id),
    PRIMARY KEY(test_id, question_id)
);

-- 랜덤 출제 설정(옵션)
CREATE TABLE random_test_configs (
    config_id    SERIAL PRIMARY KEY,
    test_id      INT NOT NULL REFERENCES tests(test_id),
    topic_id     INT,
    difficulty   VARCHAR(10),
    num_questions INT NOT NULL
);

-- 응시 기록 및 답안
CREATE TABLE test_attempts (
    attempt_id   SERIAL PRIMARY KEY,
    test_id      INT NOT NULL REFERENCES tests(test_id),
    student_id   INT NOT NULL REFERENCES students(student_id),
    started_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at  TIMESTAMP WITH TIME ZONE
);

CREATE TABLE answers (
    attempt_id   INT NOT NULL REFERENCES test_attempts(attempt_id) ON DELETE CASCADE,
    question_id  INT NOT NULL REFERENCES question_bank(question_id),
    response     TEXT,
    is_correct   BOOLEAN,
    score        NUMERIC(5,2),
    PRIMARY KEY(attempt_id, question_id)
);

-- LLM 피드백
CREATE TABLE llm_feedback (
    feedback_id  SERIAL PRIMARY KEY,
    attempt_id   INT NOT NULL REFERENCES test_attempts(attempt_id) ON DELETE CASCADE,
    question_id  INT NOT NULL REFERENCES question_bank(question_id),
    feedback     TEXT,
    score        NUMERIC(5,2),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 통계 저장(예: 일간 집계)
CREATE TABLE performance_stats (
    stats_id      SERIAL PRIMARY KEY,
    student_id    INT NOT NULL REFERENCES students(student_id),
    topic_id      INT NOT NULL REFERENCES topics(topic_id),
    correct_count INT,
    total_count   INT,
    stat_date     DATE NOT NULL
);


2. MongoDB 컬렉션 정의
// 사용자 컬렉션 (admin, instructor, student)
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["username","password","email","role"],
      properties: {
        username: { bsonType: "string" },
        password: { bsonType: "string" },
        email:    { bsonType: "string", pattern: "^.+@.+\\..+$" },
        fullName: { bsonType: "string" },
        role:     { enum: ["admin","instructor","student"] },
        createdAt:{ bsonType: "date" }
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

// 과목 및 주제
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

// 문제은행
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

// 테스트 정의
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

// 랜덤 출제 설정
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

// 응시 기록 및 답안
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

// LLM 피드백
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

// 성능 통계
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