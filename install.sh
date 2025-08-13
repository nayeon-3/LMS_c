#!/bin/bash

# LMS System 자동 설치 스크립트
# Linux/macOS용

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 LMS System 설치를 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 시스템 확인
check_system() {
    log_info "시스템 정보를 확인합니다..."
    
    # OS 확인
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_info "Linux 시스템을 감지했습니다."
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_info "macOS 시스템을 감지했습니다."
    else
        log_error "지원하지 않는 운영체제입니다: $OSTYPE"
        exit 1
    fi
    
    # 아키텍처 확인
    ARCH=$(uname -m)
    log_info "아키텍처: $ARCH"
}

# 필수 도구 확인
check_requirements() {
    log_info "필수 도구를 확인합니다..."
    
    # Git 확인
    if command -v git &> /dev/null; then
        log_success "Git이 설치되어 있습니다: $(git --version)"
    else
        log_error "Git이 설치되어 있지 않습니다. 먼저 Git을 설치해주세요."
        exit 1
    fi
    
    # Node.js 확인
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            log_success "Node.js가 설치되어 있습니다: $(node --version)"
        else
            log_error "Node.js 18 이상이 필요합니다. 현재 버전: $(node --version)"
            exit 1
        fi
    else
        log_error "Node.js가 설치되어 있지 않습니다. 먼저 Node.js를 설치해주세요."
        exit 1
    fi
    
    # npm 확인
    if command -v npm &> /dev/null; then
        log_success "npm이 설치되어 있습니다: $(npm --version)"
    else
        log_error "npm이 설치되어 있지 않습니다."
        exit 1
    fi
    
    # Docker 확인
    if command -v docker &> /dev/null; then
        log_success "Docker가 설치되어 있습니다: $(docker --version)"
    else
        log_warning "Docker가 설치되어 있지 않습니다. Docker 설치를 권장합니다."
    fi
    
    # Docker Compose 확인
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose가 설치되어 있습니다: $(docker-compose --version)"
    else
        log_warning "Docker Compose가 설치되어 있지 않습니다."
    fi
}

# 환경 변수 설정
setup_environment() {
    log_info "환경 변수를 설정합니다..."
    
    if [ ! -f .env ]; then
        if [ -f env.example ]; then
            cp env.example .env
            log_success ".env 파일이 생성되었습니다."
            log_warning ".env 파일을 편집하여 필요한 설정을 입력해주세요."
        else
            log_error "env.example 파일을 찾을 수 없습니다."
            exit 1
        fi
    else
        log_info ".env 파일이 이미 존재합니다."
    fi
}

# 의존성 설치
install_dependencies() {
    log_info "프로젝트 의존성을 설치합니다..."
    
    # 루트 의존성 설치
    if [ -f package.json ]; then
        log_info "루트 의존성을 설치합니다..."
        npm install
        log_success "루트 의존성 설치 완료"
    fi
    
    # 서버 의존성 설치
    if [ -d server ] && [ -f server/package.json ]; then
        log_info "서버 의존성을 설치합니다..."
        cd server
        npm install
        cd ..
        log_success "서버 의존성 설치 완료"
    fi
    
    # 클라이언트 의존성 설치
    if [ -d client ] && [ -f client/package.json ]; then
        log_info "클라이언트 의존성을 설치합니다..."
        cd client
        npm install
        cd ..
        log_success "클라이언트 의존성 설치 완료"
    fi
}

# Docker 컨테이너 빌드
build_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        log_info "Docker 컨테이너를 빌드합니다..."
        
        if [ -f docker-compose.yml ]; then
            docker-compose build
            log_success "Docker 컨테이너 빌드 완료"
        else
            log_warning "docker-compose.yml 파일을 찾을 수 없습니다."
        fi
    else
        log_warning "Docker가 설치되어 있지 않아 컨테이너를 빌드할 수 없습니다."
    fi
}

# 설치 완료 메시지
show_completion() {
    echo ""
    echo "🎉 LMS System 설치가 완료되었습니다!"
    echo ""
    echo "📋 다음 단계:"
    echo "1. .env 파일을 편집하여 필요한 설정을 입력하세요"
    echo "2. Docker로 실행: npm run docker:up"
    echo "3. 개발 모드로 실행: npm run dev"
    echo ""
    echo "🌐 접속 정보:"
    echo "- 프론트엔드: http://localhost:3000"
    echo "- 백엔드 API: http://localhost:5000"
    echo "- 기본 계정: admin / admin123"
    echo ""
    echo "📚 자세한 내용은 README.md 파일을 참조하세요."
}

# 메인 실행
main() {
    echo "=========================================="
    echo "    LMS System 자동 설치 스크립트"
    echo "=========================================="
    echo ""
    
    check_system
    check_requirements
    setup_environment
    install_dependencies
    build_docker
    show_completion
}

# 스크립트 실행
main "$@"
