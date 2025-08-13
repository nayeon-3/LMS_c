@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM LMS System 자동 설치 스크립트 (Windows용)

echo ==========================================
echo     LMS System 자동 설치 스크립트
echo ==========================================
echo.

echo 🚀 LMS System 설치를 시작합니다...
echo.

REM 색상 정의
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 로그 함수
:log_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:log_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM 시스템 확인
call :log_info "시스템 정보를 확인합니다..."
ver | findstr /i "Windows" >nul
if %errorlevel% neq 0 (
    call :log_error "Windows 시스템이 아닙니다."
    pause
    exit /b 1
)

call :log_success "Windows 시스템을 감지했습니다."

REM 필수 도구 확인
call :log_info "필수 도구를 확인합니다..."

REM Git 확인
git --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    call :log_success "Git이 설치되어 있습니다: !GIT_VERSION!"
) else (
    call :log_error "Git이 설치되어 있지 않습니다. 먼저 Git을 설치해주세요."
    echo https://git-scm.com/에서 다운로드
    pause
    exit /b 1
)

REM Node.js 확인
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
    call :log_success "Node.js가 설치되어 있습니다: !NODE_VERSION!"
    
    REM 버전 체크 (간단한 체크)
    echo !NODE_VERSION! | findstr /r "v1[8-9]\|v[2-9][0-9]" >nul
    if %errorlevel% neq 0 (
        call :log_warning "Node.js 18 이상을 권장합니다. 현재 버전: !NODE_VERSION!"
    )
) else (
    call :log_error "Node.js가 설치되어 있지 않습니다. 먼저 Node.js를 설치해주세요."
    echo https://nodejs.org/에서 LTS 버전 다운로드
    pause
    exit /b 1
)

REM npm 확인
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
    call :log_success "npm이 설치되어 있습니다: !NPM_VERSION!"
) else (
    call :log_error "npm이 설치되어 있지 않습니다."
    pause
    exit /b 1
)

REM Docker 확인
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    call :log_success "Docker가 설치되어 있습니다: !DOCKER_VERSION!"
) else (
    call :log_warning "Docker가 설치되어 있지 않습니다. Docker 설치를 권장합니다."
    echo https://www.docker.com/products/docker-desktop에서 다운로드
)

REM Docker Compose 확인
docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=3" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    call :log_success "Docker Compose가 설치되어 있습니다: !COMPOSE_VERSION!"
) else (
    call :log_warning "Docker Compose가 설치되어 있지 않습니다."
)

REM 환경 변수 설정
call :log_info "환경 변수를 설정합니다..."
if not exist .env (
    if exist env.example (
        copy env.example .env >nul
        call :log_success ".env 파일이 생성되었습니다."
        call :log_warning ".env 파일을 편집하여 필요한 설정을 입력해주세요."
    ) else (
        call :log_error "env.example 파일을 찾을 수 없습니다."
        pause
        exit /b 1
    )
) else (
    call :log_info ".env 파일이 이미 존재합니다."
)

REM 의존성 설치
call :log_info "프로젝트 의존성을 설치합니다..."

REM 루트 의존성 설치
if exist package.json (
    call :log_info "루트 의존성을 설치합니다..."
    npm install
    if %errorlevel% equ 0 (
        call :log_success "루트 의존성 설치 완료"
    ) else (
        call :log_error "루트 의존성 설치 실패"
        pause
        exit /b 1
    )
)

REM 서버 의존성 설치
if exist server\package.json (
    call :log_info "서버 의존성을 설치합니다..."
    cd server
    npm install
    if %errorlevel% equ 0 (
        call :log_success "서버 의존성 설치 완료"
    ) else (
        call :log_error "서버 의존성 설치 실패"
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

REM 클라이언트 의존성 설치
if exist client\package.json (
    call :log_info "클라이언트 의존성을 설치합니다..."
    cd client
    npm install
    if %errorlevel% equ 0 (
        call :log_success "클라이언트 의존성 설치 완료"
    ) else (
        call :log_error "클라이언트 의존성 설치 실패"
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

REM Docker 컨테이너 빌드
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    docker-compose --version >nul 2>&1
    if %errorlevel% equ 0 (
        call :log_info "Docker 컨테이너를 빌드합니다..."
        if exist docker-compose.yml (
            docker-compose build
            if %errorlevel% equ 0 (
                call :log_success "Docker 컨테이너 빌드 완료"
            ) else (
                call :log_warning "Docker 컨테이너 빌드 실패"
            )
        ) else (
            call :log_warning "docker-compose.yml 파일을 찾을 수 없습니다."
        )
    ) else (
        call :log_warning "Docker Compose가 설치되어 있지 않아 컨테이너를 빌드할 수 없습니다."
    )
) else (
    call :log_warning "Docker가 설치되어 있지 않아 컨테이너를 빌드할 수 없습니다."
)

REM 설치 완료 메시지
echo.
echo 🎉 LMS System 설치가 완료되었습니다!
echo.
echo 📋 다음 단계:
echo 1. .env 파일을 편집하여 필요한 설정을 입력하세요
echo 2. Docker로 실행: npm run docker:up
echo 3. 개발 모드로 실행: npm run dev
echo.
echo 🌐 접속 정보:
echo - 프론트엔드: http://localhost:3000
echo - 백엔드 API: http://localhost:5000
echo - 기본 계정: admin / admin123
echo.
echo 📚 자세한 내용은 README.md 파일을 참조하세요.
echo.

pause
