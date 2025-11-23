# 기여 가이드

Terraform Runner 프로젝트에 기여해 주셔서 감사합니다!

## 🐛 버그 리포트

버그를 발견하셨나요? 다음 정보를 포함하여 Issue를 작성해 주세요:

- **환경**: Windows 버전, Node.js 버전
- **증상**: 어떤 문제가 발생했나요?
- **재현 방법**: 문제를 재현하는 단계
- **예상 결과**: 어떻게 동작해야 하나요?
- **로그**: 오류 메시지 또는 로그 파일

## 💡 기능 제안

새로운 기능을 제안하고 싶으신가요?

1. Issue를 열어 아이디어를 공유하세요
2. 커뮤니티 피드백을 기다립니다
3. 승인되면 구현을 시작하세요

## 🔧 개발 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd terraform-runner

# 의존성 설치
npm install

# Terraform 실행 파일 추가
# bin/terraform.exe 파일 복사

# 개발 모드 실행
npm run dev
```

## 📝 코드 스타일

- **JavaScript**: ES6+ 문법 사용
- **들여쓰기**: 2 spaces
- **세미콜론**: 사용
- **따옴표**: 싱글 쿼트 (`'`)

## 🔀 Pull Request 프로세스

1. Fork the repository
2. 새 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'Add amazing feature'`
4. 브랜치에 Push: `git push origin feature/amazing-feature`
5. Pull Request 생성

### PR 체크리스트

- [ ] 코드가 정상 작동함
- [ ] 기존 기능에 영향 없음
- [ ] README 업데이트 (필요시)
- [ ] 커밋 메시지가 명확함

## 🧪 테스트

현재 자동화된 테스트는 없지만, 다음을 수동으로 확인해 주세요:

- [ ] 앱이 정상적으로 시작됨
- [ ] ZIP 파일 선택 및 압축 해제 작동
- [ ] AWS 설정 작동
- [ ] Terraform 명령 실행 작동
- [ ] 로그가 정상적으로 표시됨

## 📚 문서

문서 개선도 환영합니다!

- README.md
- QUICKSTART.md
- 코드 주석
- JSDoc 주석

## 🙏 감사합니다!

모든 기여는 소중합니다. 작은 오타 수정부터 큰 기능 추가까지 모두 환영합니다!

## 📞 연락처

질문이 있으시면 Issue를 열어주세요.

---

**Happy Coding! 🚀**

