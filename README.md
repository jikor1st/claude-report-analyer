# Claude Report Analyzer

<div align="center">
  
  📊 **Claude Code 대화 세션 자동 분석 도구**
  
  macOS 개발자를 위한 로컬 CLI 기반 Claude Code 대화 세션 자동 분석 및 한국어 문서 시각화·내보내기 오픈소스 툴
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-v5.0+-blue.svg)](https://www.typescriptlang.org)
  
</div>

## 🎯 주요 기능

- 🔍 **자동 세션 스캐닝**: JSONL 형식의 Claude Code 대화 로그 자동 탐지 및 분석
- 📈 **통계 시각화**: 세션별 메시지 수, 코드 블록, 주요 토픽 차트 제공
- 📅 **캘린더 뷰**: 날짜별 분석 내역 확인 및 재분석 기능
- 📄 **문서 내보내기**: Markdown/JSON 형식으로 분석 결과 저장
- 🌐 **웹 대시보드**: React 기반 직관적인 UI로 분석 결과 확인
- 🔒 **100% 로컬 처리**: 네트워크 연결 불필요, 완벽한 개인정보 보호

## 🚀 시작하기

### 필수 요구사항

- Node.js v18.0.0 이상
- npm 또는 pnpm
- macOS (Windows/Linux는 추후 지원 예정)

### 설치

```bash
# 저장소 클론
git clone https://github.com/yourusername/claude-report-analyzer.git
cd claude-report-analyzer

# 의존성 설치
npm install

# 전체 프로젝트 빌드
npm run build
```

### 사용법

#### 1. CLI로 세션 분석하기

```bash
# 특정 폴더의 JSONL 파일 분석
node packages/cli/dist/index.js analyze [경로] --output ./reports

# 예제 데이터로 테스트
node packages/cli/dist/index.js analyze example-data
```

#### 2. API 서버 실행

```bash
# API 서버 시작 (포트 3001)
npm start --workspace=@claude-report-analyzer/server

# 또는
cd packages/server && npm start
```

#### 3. 웹 대시보드 실행

```bash
# 개발 서버 시작 (포트 5173)
npm run dev --workspace=@claude-report-analyzer/web

# 또는
cd packages/web && npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 📦 프로젝트 구조

```
claude-report-analyzer/
├── packages/
│   ├── cli/          # CLI 분석 도구
│   ├── server/       # Express API 서버
│   ├── web/          # React 웹 대시보드
│   └── shared/       # 공통 유틸리티
├── example-data/     # 예제 JSONL 파일
├── claude-reports/   # 분석 결과 저장 디렉토리
└── README.md
```

## 🛠️ 기술 스택

- **CLI & API**: Node.js, TypeScript, Express, Commander.js
- **웹 프론트엔드**: React, Vite, TypeScript, Tailwind CSS
- **데이터 시각화**: Recharts
- **빌드 도구**: npm workspaces, TypeScript

## 📊 분석 결과 형식

### JSON 리포트
```json
{
  "version": "1.0",
  "analyzedAt": "2025-08-20T02:34:06.560Z",
  "sourcePath": "/path/to/jsonl/files",
  "summary": {
    "totalSessions": 1,
    "totalMessages": 6,
    "totalCodeBlocks": 3,
    "topTopics": ["React", "컴포넌트", "테스트"]
  }
}
```

### Markdown 요약
- 세션별 통계
- 주요 토픽 분석
- 코드 블록 수 집계
- 타임라인 정보

## 🔧 개발

```bash
# 개발 모드로 전체 프로젝트 실행
npm run dev

# 린트 실행
npm run lint

# 타입 체크
npm run build
```

## 📝 로드맵

- [ ] PDF 내보내기 기능
- [ ] 실시간 분석 진행률 표시
- [ ] AI 기반 패턴 감지
- [ ] Windows/Linux 지원
- [ ] npm 글로벌 패키지 배포
- [ ] 플러그인 시스템

## 🤝 기여하기

기여는 언제나 환영합니다! 다음 절차를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 만든 사람

- [@yourusername](https://github.com/yourusername)

## 🙏 감사의 말

- Claude Code 팀에게 감사드립니다
- 오픈소스 커뮤니티에 감사드립니다

---

<div align="center">
  Made with ❤️ for Korean Developers
</div>