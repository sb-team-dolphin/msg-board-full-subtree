# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-22

### Added
- 🎉 초기 릴리스
- ✨ ZIP 파일 선택 및 자동 압축 해제
- ✨ **Terraform 변수 자동 파싱 및 GUI 입력** - variables.tf 자동 분석
- ✨ **기본값 리셋 기능** - 변수 값을 기본값으로 쉽게 복원 🔄
- ✨ **격리된 AWS 자격증명 관리** - 시스템 설정 변경 없이 환경변수로 관리
- ✨ **AWS CLI 자동 설치 기능** - 원클릭으로 AWS CLI 다운로드 및 설치
- ✨ Terraform init/plan/apply 자동 실행
- ✨ **Terraform Destroy 기능** - 변수 화면에서 배포/삭제 선택 가능 🗑️
- ✨ **실시간 컬러 로그** - ANSI 색상 코드를 HTML로 변환하여 표시
- ✨ **컬러 Outputs 표시** - Terraform Outputs도 색상으로 표현 🎨
- ✨ **로컬 시간 표시** - UTC 대신 사용자 시간대로 로그 타임스탬프 표시
- ✨ **Plan 결과 모달** - 90% 크기 팝업으로 로그를 보면서 결과 확인
- ✨ **세션 기반 temp 디렉토리** - 타임스탬프 기반 격리된 임시 디렉토리 🗂️
- ✨ **스마트 진행률 표시** - 실패 시 진행률이 증가하지 않음 📊
- ✨ 단계별 진행 상태 시각화
- ✨ 완료 화면 및 요약 정보
- ✨ 로그 복사 및 저장 기능
- 📦 Terraform 실행 파일 번들링 지원
- 🎨 **컴팩트한 UI** - 1000x700 창 크기, 메뉴바 자동 숨김
- 📝 완전한 한글 지원

### Fixed
- 🐛 **Terraform Plan exit code 2 처리** - 변경사항이 있을 때 정상 처리
- 🐛 **ANSI escape codes 파싱** - 색상 코드로 인한 정규식 매칭 실패 수정
- 🐛 **중첩된 ZIP 구조 처리** - .tf 파일이 하위 폴더에 있어도 자동 감지
- 🐛 **배열 변수 포맷팅** - terraform.tfvars에 배열 값 올바르게 작성
- 🐛 **진행률 정확도** - 실패한 단계에서 진행률이 더 이상 증가하지 않음
- 🐛 **Destroy 워크플로우** - Null 참조 오류 및 실행 단계 표시 수정

### Security
- 🔒 AWS 자격증명은 메모리에만 저장 (파일 저장 안 함)
- 🔒 환경변수를 통한 프로세스 격리 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION)
- 🔒 시스템 전역 AWS 설정 (~/.aws/credentials, ~/.aws/config) 보존
- 🔒 AWS_PROFILE, AWS_SHARED_CREDENTIALS_FILE, AWS_CONFIG_FILE 명시적 비활성화
- 🔒 다른 프로젝트/도구에 영향 없음

### Features
- Electron 기반 데스크톱 앱
- Windows 10 이상 지원
- Terraform 1.0+ 호환
- AWS 리전 선택 기능
- 오류 처리 및 복구
- **임시 파일 자동 정리** - 세션별 격리 및 24시간 자동 정리
- **충돌 없는 동시 실행** - 타임스탬프 기반 세션 ID

### Documentation
- README.md
- QUICKSTART.md
- CONTRIBUTING.md
- PRD, IPC Flow, UI Mockup 문서
- Terraform 라이선스 고지

### Security
- AWS Credentials 메모리 전용 저장
- 로그 마스킹 처리
- contextBridge를 통한 안전한 IPC 통신

## [Unreleased]

### Planned Features (Phase 2)
- 다크 모드 지원
- 다국어 지원 (영어)
- 실행 히스토리 기능
- 즐겨찾기 프로젝트
- 드래그 앤 드롭 ZIP 업로드
- Terraform 변수 편집 UI
- 리소스 비용 추정

---

For more information, see [README.md](README.md)

