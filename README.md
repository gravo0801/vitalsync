# VitalSync v0.2

Next.js 15 + Firebase + Tailwind CSS 4 기반 다이어트 관리 앱.

## ✨ 이번 버전에서 바뀐 점

### 🔧 버그 수정
- 누락되어 있던 **운동 기록 모달** 추가
- `alert()` → Sonner toast 전환
- 라이트/다크 테마 **localStorage 동기화** + hydration mismatch 방지
- 같은 날짜 체중 등록 시 기존 기록을 삭제하던 버그 → 여러 기록 보존

### 🆕 새 기능
- **프로필 시스템**: 키/생년월일/성별/활동수준 입력 → BMI/BMR/TDEE/일일 칼로리 목표 자동 계산
- **요약 카드 재설계**: 현재 BMI · 목표까지 남은 거리(예상 도달일) · 오늘 잔여 칼로리
- **체중 그래프 강화**: 7일 이동평균선 + 목표 체중 기준선
- **식사 메모/내용** 텍스트 필드 추가 (검색·이력 관리 가능)
- **운동 칼로리 자동 추정** (MET 기반, 수정 가능)
- **캘린더 날짜 클릭 → 일일 상세 모달**: 그날 섭취/소모 칼로리 + 모든 기록 조회/추가/삭제
- 모든 기록에 **삭제·수정 기능**
- 프로필 페이지 (`/profile`)

### 🏗 구조 개선
- 단일 `page.tsx` 400줄 → **컴포넌트 11개 + 커스텀 훅 5개**로 분리
- TypeScript 타입 정리
- 사용 안 하던 `framer-motion` 제거

---

## 🚀 배포 순서

### 1단계: Firestore Database 활성화

https://console.firebase.google.com/u/0/project/vitalsync-8c169/firestore

1. **데이터베이스 만들기** 클릭
2. 위치: `asia-northeast3 (서울)` 선택
3. 시작 모드: **테스트 모드**로 시작 (나중에 규칙으로 교체)
4. 만들기 완료 후 → **규칙 탭**에서 이 프로젝트의 `firestore.rules` 파일 내용 붙여넣기 → **게시**

### 2단계: Firebase Storage 활성화 (식사 사진용)

https://console.firebase.google.com/u/0/project/vitalsync-8c169/storage

1. **시작하기** 클릭
2. 테스트 모드 선택, `asia-northeast3` 위치 선택
3. 완료 후 → **규칙 탭**에서 `storage.rules` 내용 붙여넣기 → **게시**

### 3단계: GitHub 레포 생성

```bash
# 압축을 풀고 폴더로 이동
cd vitalsync

git init
git add .
git commit -m "VitalSync v0.2 - Phase 1 완성"

# GitHub에서 새 레포(예: vitalsync) 만든 뒤
git remote add origin https://github.com/gravo0801/vitalsync.git
git branch -M main
git push -u origin main
```

### 4단계: Vercel 배포

1. https://vercel.com → 새 프로젝트 추가 → 방금 만든 `vitalsync` 레포 선택
2. **Framework Preset**: Next.js (자동 감지)
3. **환경 변수**: 없음 (Firebase 키가 코드에 하드코딩됨 - 프론트엔드 키는 공개되어도 OK)
4. Deploy 클릭

### 5단계: 첫 진입

배포된 URL로 접속 → 자동으로 `/profile`로 이동 → 기본값(키 176, 체중 98, 목표 90, 가벼운 활동)이 미리 들어있음 → 생년월일만 정확히 입력 후 저장.

---

## 🛠 로컬 개발

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인.

---

## 📁 폴더 구조

```
vitalsync/
├── app/
│   ├── layout.tsx           # 루트 레이아웃 (테마 초기화 스크립트)
│   ├── page.tsx             # 대시보드
│   ├── profile/page.tsx     # 프로필 설정
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── SummaryCards.tsx     # BMI/목표/잔여칼로리 3카드
│   ├── WeightChart.tsx      # 7일 이동평균 + 목표선
│   ├── RecentRecords.tsx
│   ├── Calendar.tsx
│   ├── ThemeToggle.tsx
│   └── modals/
│       ├── Modal.tsx        # 공통 모달 셸
│       ├── WeightModal.tsx
│       ├── MealModal.tsx
│       ├── WorkoutModal.tsx
│       └── DayDetailModal.tsx
├── hooks/
│   ├── useProfile.ts
│   ├── useWeights.ts
│   ├── useMeals.ts
│   ├── useWorkouts.ts
│   └── useTheme.ts
├── lib/
│   ├── firebase.ts
│   └── calculations.ts      # BMI/BMR/TDEE/이동평균
├── types/index.ts
├── firestore.rules
└── storage.rules
```

---

## 🔮 향후 계획 (Phase 2)

- Claude Vision API로 식사 사진 자동 칼로리·매크로 분석
- 매크로(P/C/F) 추적 + 그래프
- 허리둘레, 혈압, 공복혈당 등 임상 지표 추가 탭
- 주간/월간 리포트 + 정체기 자동 감지
- PWA 설치, 오프라인 캐싱

---

## ⚠️ 알려진 제한

- **인증 없음**: 단일 사용자(`personal-user`) 하드코딩. 본인만 URL을 알면 단순 사용에는 충분하지만, 공유 우려가 있으면 Firebase Auth(익명 로그인) 추가 권장.
- **Firebase 키 공개**: 프론트엔드 키는 도메인 제한이 안전망 역할. 추후 Firebase Console → 인증 → 승인된 도메인에서 Vercel 도메인만 허용 권장.
