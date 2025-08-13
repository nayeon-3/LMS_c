# LMS (Learning Management System) 🎓

관리자, 강사, 학생 역할을 지원하는 온라인 학습 관리 시스템입니다.

## 🚀 주요 기능

### 👨‍💼 관리자
- 학생 및 강사 계정 관리
- 과목/주제 관리
- 문제은행 관리
- 시스템 전반 설정 및 모니터링

### 👨‍🏫 강사
- 학생 관리
- 과목/주제 관리
- 테스트 생성 및 관리
- 시험 진행 모니터링 및 성적 검토

### 👨‍🎓 학생
- 온라인 테스트 응시
- 결과 확인 (정답/오답, 해설, LLM 피드백)
- 개인 대시보드에서 통계 및 분석 그래프 조회

## 🛠 기술 스택

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** (관계형 데이터베이스)
- **MongoDB** (문서형 데이터베이스)
- **Redis** (캐시)
- **RabbitMQ** (메시지 큐)
- **JWT** (인증)

### Frontend
- **React.js** 18
- **Styled Components** (스타일링)
- **React Router** (라우팅)
- **React Query** (상태 관리)
- **Chart.js** (차트 및 통계)

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** (리버스 프록시)
- **SSL/TLS** 지원

## 📋 요구사항

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- MongoDB 7.0+
- Redis 7+
- RabbitMQ 3+

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone <repository-url>
cd lms_c
```

### 2. 환경 변수 설정
- 프로젝트 루트에서 `env.example`를 `.env`로 복사 후 필요한 값을 설정합니다. 자세한 방법은 아래 "프로젝트 초기 설정"을 참고하세요.

### 3. Docker로 실행
- 실행 방법은 아래 "Docker를 사용한 실행" 섹션을 따라 주세요.

 

## 🌐 접속 정보

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379
- **RabbitMQ**: localhost:15672 (관리자: admin/password)

### 데이터베이스 관리 도구

#### 🐘 PostgreSQL + pgAdmin
- **PostgreSQL 직접 접속**:
  - 호스트: `localhost`
  - 포트: `5432`
  - 데이터베이스: `lms_db`
  - 사용자명: `postgres`
  - 비밀번호: `password`

- **pgAdmin 웹 인터페이스**: http://localhost:5050
  - 이메일: `admin@lms.com`
  - 비밀번호: `admin123`

**pgAdmin에서 PostgreSQL 서버 연결 설정**:
1. pgAdmin에 로그인
2. 우클릭 → "Create" → "Server..."
3. General 탭:
   - Name: `LMS PostgreSQL`
4. Connection 탭:
   - Host name/address: `postgres` (Docker 네트워크 내부 주소)
   - Port: `5432`
   - Maintenance database: `lms_db`
   - Username: `postgres`
   - Password: `password`

**pgAdmin 주요 기능**:
- 데이터베이스 스키마 탐색 및 관리
- SQL 쿼리 에디터로 데이터 조회/수정
- 테이블 생성, 수정, 삭제
- 인덱스 및 제약조건 관리
- 사용자 권한 관리
- 데이터베이스 백업 및 복원

#### 🍃 MongoDB + mongo-express
- **MongoDB 직접 접속**:
  - 호스트: `localhost`
  - 포트: `27017`
  - 데이터베이스: `lms_mongo`
  - 사용자명: `admin`
  - 비밀번호: `password`
  - 인증 데이터베이스: `admin`

- **mongo-express 웹 인터페이스**: http://localhost:8081
  - 사용자명: `admin`
  - 비밀번호: `admin123`

**mongo-express 사용 방법**:
1. 브라우저에서 http://localhost:8081 접속
2. 사용자명: `admin`, 비밀번호: `admin123` 입력
3. 로그인 후 MongoDB 데이터베이스 및 컬렉션 탐색
4. 데이터 조회, 수정, 삭제, 추가 가능
5. MongoDB 쿼리 실행 및 인덱스 관리

### 데이터베이스 관리 도구 사용 팁

#### 🔍 데이터베이스 연결 테스트
```bash
# PostgreSQL 연결 테스트
docker exec -it lms_postgres psql -U postgres -d lms_db -c "SELECT version();"

# MongoDB 연결 테스트
docker exec -it lms_mongodb mongosh -u admin -p password --eval "db.runCommand('ping')"
```

#### 📊 데이터베이스 모니터링
- **pgAdmin**: 데이터베이스 성능, 연결 상태, 쿼리 실행 시간 모니터링
- **mongo-express**: MongoDB 서버 상태, 컬렉션 크기, 인덱스 사용량 확인

#### 🔐 보안 설정
- 기본 비밀번호는 개발 환경용이므로 프로덕션에서는 반드시 변경
- 방화벽에서 필요한 포트만 개방
- 데이터베이스 접근 IP 제한 설정

## 🔐 기본 계정

- **관리자**: admin / admin123
- **이메일**: admin@lms.com

## 📁 프로젝트 구조

```
lms_c/
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── contexts/      # React Context
│   │   ├── hooks/         # 커스텀 훅
│   │   └── utils/         # 유틸리티 함수
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Node.js 백엔드
│   ├── src/
│   │   ├── config/        # 설정 파일
│   │   ├── controllers/   # 컨트롤러
│   │   ├── middleware/    # 미들웨어
│   │   ├── models/        # 데이터 모델
│   │   ├── routes/        # API 라우트
│   │   └── services/      # 비즈니스 로직
│   ├── db/                # 데이터베이스 스크립트
│   │   ├── init.sql       # PostgreSQL 초기화
│   │   └── mongodb-init.js # MongoDB 초기화
│   └── Dockerfile
├── nginx/                  # Nginx 설정
├── docker-compose.yml      # Docker Compose 설정
├── package.json            # 루트 패키지 설정
└── README.md
```

## 🔧 개발 명령어

```bash
# 전체 개발 서버 실행
npm run dev

# 서버만 실행
npm run server:dev

# 클라이언트만 실행
npm run client:dev

# 프로덕션 빌드
npm run build

# Docker 관련
npm run docker:build    # 이미지 빌드
npm run docker:up       # 컨테이너 실행
npm run docker:down     # 컨테이너 중지
npm run docker:logs     # 로그 확인
```

## 📊 데이터베이스 스키마

### 🐘 PostgreSQL (관계형 데이터)

주요 테이블:
- `roles` - 사용자 역할 (admin, instructor, student)
- `users` - 사용자 기본 정보
- `students` - 학생 전용 정보
- `courses` - 과목 정보
- `topics` - 주제 정보
- `question_bank` - 문제은행
- `tests` - 테스트 정의
- `test_items` - 테스트 문제 연결
- `random_test_configs` - 랜덤 출제 설정
- `test_attempts` - 테스트 응시 기록
- `answers` - 답안 정보
- `llm_feedback` - LLM 피드백
- `performance_stats` - 성능 통계

### 🍃 MongoDB (문서형 데이터)

주요 컬렉션:
- `users` - 사용자 정보 (JSON 스키마 검증)
- `students` - 학생 프로파일
- `courses` - 과목 정보
- `topics` - 주제 정보
- `questionBank` - 문제은행
- `tests` - 테스트 정의
- `randomTestConfigs` - 랜덤 출제 설정
- `testAttempts` - 응시 기록
- `answers` - 답안 정보
- `llmFeedback` - LLM 피드백
- `performanceStats` - 성능 통계

### 🔄 하이브리드 데이터베이스 전략

- **PostgreSQL**: 사용자 인증, 권한 관리, 테스트 구조 등 관계형 데이터
- **MongoDB**: 문제 내용, 답안, LLM 피드백 등 문서형 데이터
- **Redis**: 세션, 캐시, 임시 데이터
- **RabbitMQ**: 비동기 작업, LLM 채점 큐

## 🚀 데이터베이스 마이그레이션

### 초기 설정

#### 1. PostgreSQL 초기화
```bash
# Docker 컨테이너 실행
docker-compose up postgres -d

# 데이터베이스 연결 확인
docker exec -it lms_postgres psql -U postgres -d lms_db

# 스키마 확인
\dt
```

#### 2. MongoDB 초기화
```bash
# MongoDB 컨테이너 실행
docker-compose up mongodb -d

# MongoDB 연결
docker exec -it lms_mongodb mongosh -u admin -p password

# 컬렉션 확인
show collections
```

#### 3. 수동 초기화 (필요시)
```bash
# PostgreSQL
docker exec -i lms_postgres psql -U postgres -d lms_db < server/db/init.sql

# MongoDB
docker exec -i lms_mongodb mongosh -u admin -p password --authenticationDatabase admin lms_mongo < server/db/mongodb-init.js
```

### 스키마 업데이트

#### PostgreSQL 마이그레이션
```sql
-- 새로운 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 데이터 업데이트
UPDATE users SET phone = '000-0000-0000' WHERE phone IS NULL;
```

#### MongoDB 마이그레이션
```javascript
// 새로운 필드 추가
db.users.updateMany(
  { phone: { $exists: false } },
  { $set: { phone: "000-0000-0000" } }
);

// 인덱스 추가
db.users.createIndex({ "phone": 1 });

// 데이터 검증
db.users.find({ phone: { $exists: true } }).count();
```

### 데이터 백업 및 복원

#### PostgreSQL 백업
```bash
# 백업
docker exec lms_postgres pg_dump -U postgres lms_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 복원
docker exec -i lms_postgres psql -U postgres -d lms_db < backup_file.sql
```

#### MongoDB 백업
```bash
# 백업
docker exec lms_mongodb mongodump --uri="mongodb://admin:password@localhost:27017/lms_mongo?authSource=admin" --out=./backup

# 복원
docker exec lms_mongodb mongorestore --uri="mongodb://admin:password@localhost:27017/lms_mongo?authSource=admin" ./backup
```

### 환경별 설정

#### 개발 환경
```bash
# .env 파일 설정
DB_STRATEGY=hybrid
NODE_ENV=development
```

#### 프로덕션 환경
```bash
# .env 파일 설정
DB_STRATEGY=hybrid
NODE_ENV=production
```

## 🛠️ 처음 실행을 위한 상세 설치 가이드

### 📋 사전 요구사항 확인

#### 1. 시스템 요구사항
- **운영체제**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **메모리**: 최소 8GB RAM (권장 16GB+)
- **저장공간**: 최소 10GB 여유 공간
- **CPU**: 최소 2코어 (권장 4코어+)

#### 2. 필수 소프트웨어 설치

##### Node.js 설치
```bash
# Windows: https://nodejs.org/에서 LTS 버전 다운로드
# macOS: Homebrew 사용
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version  # v18.x.x 이상
npm --version   # 9.x.x 이상
```

##### Docker 설치
```bash
# Windows: Docker Desktop 다운로드 및 설치
# https://www.docker.com/products/docker-desktop

# macOS: Docker Desktop 다운로드 및 설치
# https://www.docker.com/products/docker-desktop

# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 버전 확인
docker --version
docker-compose --version
```

##### Git 설치
```bash
# Windows: https://git-scm.com/에서 다운로드
# macOS
brew install git

# Ubuntu/Debian
sudo apt-get install git

# 버전 확인
git --version
```

### 🚀 프로젝트 초기 설정

#### 1. 프로젝트 다운로드
```bash
# GitHub에서 클론
cd /path/to  # 원하는 상위 경로로 이동
git clone https://github.com/your-username/lms_c.git
cd lms_c  # 반드시 프로젝트 루트에서 다음 단계를 실행

# 또는 ZIP 파일 다운로드 후 압축 해제
```

#### 2. 환경 변수 설정
```bash
# 환경 변수 파일 복사 (프로젝트 루트에서)
cp env.example .env

# .env 파일 편집 (텍스트 에디터 사용)
# Windows: notepad .env
# macOS: open -e .env
# Linux: nano .env 또는 vim .env
```

> 참고
> - Node.js는 프로젝트별 `node_modules`로 격리되므로 별도의 가상환경이 필요 없습니다.
> - Python은 프로젝트별 가상환경(venv)에서 설치하는 것을 권장합니다.
> - Python 의존성은 표준 파일명인 `requirements.txt`를 사용합니다.

### 📦 라이브러리 및 의존성 설치

#### 1. 자동 설치 스크립트 사용 (권장)

##### Linux/macOS
```bash
# 스크립트 실행 권한 부여
chmod +x install.sh

# 자동 설치 실행
./install.sh
```

##### Windows
```cmd
# 배치 파일 실행
install.bat
```

자동 설치 스크립트는 다음 작업을 자동으로 수행합니다:
- 시스템 요구사항 확인
- 필수 도구 버전 검증
- 환경 변수 파일 생성
- 모든 의존성 자동 설치
- Docker 컨테이너 빌드 (선택사항)

#### 2. 의존성 설치 (순서대로)

- Node.js: `package.json` 기반으로 npm 사용 (가상환경 불필요)
- Python: `requirements.txt` 기반으로 pip 사용 (가상환경 권장)

```bash
# [A] Node.js 의존성 설치 — 프로젝트 루트에서 (가상환경 밖)
npm install                 # 루트 의존성 설치
cd server && npm install    # 서버 의존성 설치
cd ../client && npm install # 클라이언트 의존성 설치
cd ..                       # 프로젝트 루트로 복귀

# [B] Python 의존성 설치 — 프로젝트 루트에서 (가상환경 안)
python -m venv venv         # 가상환경 생성

# 가상환경 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

# requirements.txt로 Python 패키지 설치 (중요)
pip install -r requirements.txt
```

#### 3. 의존성 확인
```bash
# 프로젝트 루트 디렉토리에서 실행
cd /path/to/lms_c  # 프로젝트 루트 디렉토리로 이동

# Node.js 버전 확인
node --version
npm --version

# Python 버전 확인
python --version
pip --version

# Docker 버전 확인
docker --version
docker-compose --version
```

#### 4. 의존성 업데이트
```bash
# 프로젝트 루트 디렉토리에서 실행
cd /path/to/lms_c  # 프로젝트 루트 디렉토리로 이동

# Node.js 패키지 업데이트
npm update

# Python 패키지 업데이트
pip install --upgrade -r requirements.txt

# 특정 패키지 업데이트
npm update <package-name>
pip install --upgrade <package-name>
```

### 🐳 Docker를 사용한 실행 (권장)

#### 1. Docker 컨테이너 빌드
```bash
# 프로젝트 루트 디렉토리에서
npm run docker:build

# 또는 직접 실행
docker-compose build
```

#### 2. 컨테이너 실행
```bash
# 백그라운드에서 실행
npm run docker:up

# 또는 직접 실행
docker-compose up -d
```

#### 3. 실행 상태 확인
```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
npm run docker:logs

# 또는 직접 확인
docker-compose logs -f
```

#### 4. 개별 서비스 실행 (선택사항)
```bash
# 데이터베이스만 실행
docker-compose up postgres mongodb redis rabbitmq -d

# 백엔드만 실행
docker-compose up server -d

# 프론트엔드만 실행
docker-compose up client -d
```

### 💻 개발 모드로 실행

#### 1. 데이터베이스 서비스 실행
```bash
# 프로젝트 루트 디렉토리에서 실행
cd /path/to/lms_c  # 프로젝트 루트 디렉토리로 이동

# Docker로 데이터베이스만 실행
docker-compose up postgres mongodb redis rabbitmq -d

# 또는 로컬에 직접 설치
# PostgreSQL, MongoDB, Redis, RabbitMQ를 각각 설치
```

#### 2. 개발 서버 실행
```bash
# 프로젝트 루트 디렉토리에서 실행
cd /path/to/lms_c  # 프로젝트 루트 디렉토리로 이동

# 전체 개발 서버 실행 (새 터미널에서)
npm run dev

# 또는 개별 실행
# 터미널 1: 백엔드 (프로젝트 루트 디렉토리에서)
npm run server:dev

# 터미널 2: 프론트엔드 (프로젝트 루트 디렉토리에서)
npm run client:dev
```

### 🔍 실행 확인 및 문제 해결

#### 1. 서비스 상태 확인
```bash
# Docker 컨테이너 상태
docker-compose ps

# 포트 사용 확인
# Windows
netstat -an | findstr :3000
netstat -an | findstr :5000

# macOS/Linux
lsof -i :3000
lsof -i :5000
```

#### 2. 데이터베이스 연결 확인
```bash
# PostgreSQL 연결 테스트
docker exec -it lms_postgres psql -U postgres -d lms_db -c "SELECT version();"

# MongoDB 연결 테스트
docker exec -it lms_mongodb mongosh -u admin -p password --eval "db.runCommand('ping')"

# Redis 연결 테스트
docker exec -it lms_redis redis-cli ping

# RabbitMQ 연결 테스트
docker exec -it lms_rabbitmq rabbitmq-diagnostics ping
```

#### 3. 로그 확인
```bash
# 전체 로그
docker-compose logs

# 특정 서비스 로그
docker-compose logs server
docker-compose logs client
docker-compose logs postgres
docker-compose logs mongodb

# 실시간 로그
docker-compose logs -f
```

### 🚨 일반적인 문제 해결

#### 1. 포트 충돌 문제
```bash
# 포트 사용 중인 프로세스 확인
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 2. 권한 문제 (Linux/macOS)
```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER

# 새 터미널에서 다시 시도
# 또는 시스템 재부팅
```

#### 3. 메모리 부족 문제
```bash
# Docker 메모리 제한 확인
docker system df

# 사용하지 않는 컨테이너/이미지 정리
docker system prune -a
```

#### 4. 데이터베이스 연결 실패
```bash
# 컨테이너 재시작
docker-compose restart postgres mongodb

# 데이터베이스 초기화 스크립트 재실행
docker exec -i lms_postgres psql -U postgres -d lms_db < server/db/init.sql
```

#### 5. 의존성 설치 실패
```bash
# Node.js 캐시 정리
npm cache clean --force

# Python 캐시 정리
pip cache purge

# 패키지 매니저 업데이트
npm install -g npm@latest
pip install --upgrade pip

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 6. 데이터베이스 관리 도구 문제 해결

**pgAdmin 접속 문제**:
```bash
# pgAdmin 컨테이너 재시작
docker-compose restart pgadmin

# pgAdmin 로그 확인
docker-compose logs pgadmin

# pgAdmin 데이터 초기화 (주의: 설정 정보 삭제됨)
docker-compose down
docker volume rm lms_c_pgadmin_data
docker-compose up -d
```

**mongo-express 접속 문제**:
```bash
# mongo-express 컨테이너 재시작
docker-compose restart mongo-express

# mongo-express 로그 확인
docker-compose logs mongo-express

# MongoDB 연결 상태 확인
docker exec -it lms_mongodb mongosh -u admin -p password --eval "db.runCommand('ping')"
```

**데이터베이스 연결 실패**:
```bash
# 데이터베이스 컨테이너 상태 확인
docker-compose ps postgres mongodb

# 데이터베이스 로그 확인
docker-compose logs postgres
docker-compose logs mongodb

# 네트워크 연결 확인
docker network ls
docker network inspect lms_c_lms_network
```

 

### 📝 다음 단계

#### 1. 기본 설정 완료
- [x] 프로젝트 다운로드
- [x] 환경 변수 설정
- [x] 의존성 설치 (requirements.txt 사용)
- [x] Docker 컨테이너 실행
- [x] 브라우저에서 접속 확인

#### 2. 개발 시작
- [ ] 사용자 계정 생성
- [ ] 과목 및 주제 추가
- [ ] 문제은행 구축
- [ ] 테스트 생성

#### 3. 프로덕션 배포
- [ ] 환경 변수 프로덕션 설정
- [ ] SSL 인증서 설정
- [ ] 도메인 연결
- [ ] 모니터링 설정

## 🔒 보안 기능

- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 해시 처리 (Bcrypt)
- Rate Limiting
- CORS 설정
- 보안 헤더 (Helmet)

## 📈 성능 최적화

- Redis 캐싱
- 데이터베이스 인덱싱
- Gzip 압축
- 정적 파일 캐싱
- 비동기 처리 (RabbitMQ)
- 하이브리드 데이터베이스 최적화

## 🧪 테스트

```bash
# 서버 테스트
cd server
npm test

# 클라이언트 테스트
cd client
npm test
```

## 📝 API 문서

API 엔드포인트:
- `POST /api/auth/login` - 로그인
- `GET /api/users` - 사용자 목록
- `GET /api/courses` - 과목 목록
- `GET /api/tests` - 테스트 목록
- `POST /api/tests/:id/start` - 테스트 시작
- `POST /api/tests/:id/submit` - 테스트 제출

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**LMS Team** 🚀

