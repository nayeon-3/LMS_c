# LMS 시스템 데이터베이스 마이그레이션 가이드

이 디렉토리는 LMS 시스템의 데이터베이스 스키마와 마이그레이션 스크립트를 포함합니다.

## 📊 데이터베이스 구조

### PostgreSQL (관계형 데이터)
- **users**: 사용자 정보 (admin, teacher, student)
- **roles**: 사용자 역할 정의
- **students**: 학생 프로파일 정보
- **courses**: 과목 정보
- **topics**: 주제 정보
- **question_bank**: 문제은행
- **tests**: 테스트 정의
- **test_items**: 테스트와 문제 연결
- **random_test_configs**: 랜덤 출제 설정
- **test_attempts**: 테스트 응시 기록
- **answers**: 답안 정보
- **llm_feedback**: LLM 피드백
- **performance_stats**: 성능 통계

### MongoDB (문서형 데이터)
- **users**: 사용자 정보 (JSON 형태)
- **students**: 학생 프로파일
- **courses**: 과목 정보
- **topics**: 주제 정보
- **questionBank**: 문제은행
- **tests**: 테스트 정의
- **randomTestConfigs**: 랜덤 출제 설정
- **testAttempts**: 테스트 응시 기록
- **answers**: 답안 정보
- **llmFeedback**: LLM 피드백
- **performanceStats**: 성능 통계

## 🚀 마이그레이션 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 필요한 데이터베이스 연결 정보를 설정하세요.

### 3. 마이그레이션 실행

#### 전체 마이그레이션 (권장)
```bash
npm run migrate
```

#### 개별 마이그레이션
```bash
# PostgreSQL만
npm run migrate:postgres

# MongoDB만
npm run migrate:mongo
```

## 🔧 수동 실행

### PostgreSQL 마이그레이션
```bash
node db/migrate-postgresql.js
```

### MongoDB 마이그레이션
```bash
node db/migrate-mongodb.js
```

### 전체 마이그레이션
```bash
node db/migrate-all.js
```

## 📋 마이그레이션 전 확인사항

1. **PostgreSQL 서버 실행 확인**
   - 포트 5432에서 실행 중인지 확인
   - 데이터베이스 `lms_db` 생성 여부 확인

2. **MongoDB 서버 실행 확인**
   - 포트 27017에서 실행 중인지 확인
   - 인증 설정 확인

3. **환경 변수 설정 확인**
   - `.env` 파일에 올바른 연결 정보 설정
   - 데이터베이스 사용자 권한 확인

## 🐳 Docker를 사용한 마이그레이션

Docker Compose를 사용하는 경우:

```bash
# 컨테이너 시작
docker-compose up -d postgres mongodb

# 마이그레이션 실행
npm run migrate
```

## 📝 스키마 변경 시 주의사항

1. **기존 데이터 백업**
   - 마이그레이션 전 반드시 데이터 백업
   - 프로덕션 환경에서는 특히 주의

2. **스키마 버전 관리**
   - `init.sql`과 `mongodb-init.js` 파일 버전 관리
   - 변경 사항 문서화

3. **롤백 계획**
   - 마이그레이션 실패 시 롤백 방법 준비
   - 데이터 무결성 확인

## 🔍 문제 해결

### PostgreSQL 연결 오류
- 서버 실행 상태 확인
- 포트 및 방화벽 설정 확인
- 사용자 권한 확인

### MongoDB 연결 오류
- 서버 실행 상태 확인
- 인증 정보 확인
- 네트워크 연결 확인

### 권한 오류
- 데이터베이스 사용자 권한 확인
- 스키마 생성 권한 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 메시지 확인
2. 데이터베이스 서버 상태 확인
3. 환경 변수 설정 확인
4. 네트워크 연결 상태 확인
