# VitalSync v0.3

Next.js 15 + Firebase + Tailwind CSS 4 기반 다이어트 관리 앱.

**v0.3은 디자인 전면 재설계가 핵심입니다** — Claude.com / Gravo finance 톤으로 갈아엎었습니다.

## 🎨 v0.3 디자인 변경사항

### 폰트
- **Pretendard Variable** — 한글 메인 (jsdelivr CDN)
- **Playfair Display Italic** — 이탤릭 세리프 강조어 (Google Fonts)
- 숫자는 모두 `tabular-nums` 적용

### 색상 시스템 — earthy/muted tone
| 용도 | 색상 |
|---|---|
| 배경 | 따뜻한 크림 베이지 `#f5f1ea` |
| 다크 베이스 | 깊은 차콜 `#0f0e0d` |
| 🟢 성공/체중 | Sage Green `#84a07c` |
| 🔴 경고/마이너스 | Wine Red `#a85050` |
| 🟠 식사/예산 | Terracotta `#c89060` |
| 🔵 운동/정보 | Slate Blue `#6b8aa3` |

### 시그니처 디테일
- 모든 카드 상단에 **2px 색상 액센트 라인**
- "체중 변화 *추이*", "오늘의 *건강 현황*" 같은 **이탤릭 세리프 강조어**
- 그림자 없는 flat 카드, 매우 미세한 border (`black/6`)
- 차분한 진행률 바 (4px), 형광색 X

### 레이아웃 변경
- **사이드바 추가** — 데스크탑 좌측 고정 (Gravo finance 스타일)
  - OVERVIEW / 관리 그룹 메뉴
  - active 메뉴는 검정 박스 + 흰 텍스트
  - 모바일에서는 햄버거 → 드로어 (좌측 상단)
- 헤더 액션 버튼은 페이지 상단 우측으로 이동 (체중/식사/운동)
- 라이트 모드가 **기본** (다크는 옵션)

### input 가독성 완전 수정
- v0.2 버그: 라이트 모드 input에 텍스트 색상 미지정 → 안 보임
- v0.3 수정: `color: var(--foreground)` 명시 + `color-scheme: light` 명시
- focus ring 추가 (sage 계열)

---

## 🚀 배포 순서 (Firebase 이미 활성화 되어있다면 3번부터)

### 1. Firestore Database 활성화 (안 되어있다면)

https://console.firebase.google.com/u/0/project/vitalsync-8c169/firestore

- "데이터베이스 만들기" → 위치 `asia-northeast3 (서울)` → 테스트 모드
- **규칙 탭**에서 `firestore.rules` 내용 붙여넣기 → 게시

### 2. Storage 활성화 (안 되어있다면)

https://console.firebase.google.com/u/0/project/vitalsync-8c169/storage

- "시작하기" → `asia-northeast3` → 테스트 모드
- **규칙 탭**에서 `storage.rules` 내용 붙여넣기 → 게시

### 3. GitHub 레포에 push

기존 vitalsync 레포에 그대로 덮어쓰기:

**방법 A: GitHub Desktop (추천)**
1. 로컬 레포 폴더에서 기존 파일 다 삭제 (`.git` 폴더는 유지)
2. 압축 푼 vitalsync 폴더 안의 모든 파일을 복사 → 붙여넣기
3. GitHub Desktop에서 변경사항 확인 → 커밋 메시지 "v0.3 design overhaul" → Push

**방법 B: 터미널**
```bash
cd /로컬/vitalsync/폴더

# .git을 제외한 모든 파일 삭제
find . -mindepth 1 -not -path "./.git*" -delete

# 새 v0.3 파일들 복사 (압축 푼 vitalsync 폴더 안의 모든 항목)
cp -r /다운로드/vitalsync/* .
cp -r /다운로드/vitalsync/.gitignore .

git add .
git commit -m "v0.3 design overhaul"
git push
```

### 4. Vercel 자동 재배포

push하면 자동으로 빌드 시작. 1~2분 후 배포된 URL에서 새 디자인 확인.

---

## 🛠 로컬 개발

```bash
npm install
npm run dev
```

## 📁 폴더 구조

```
vitalsync/
├── app/
│   ├── layout.tsx           # Pretendard + Playfair 폰트 로드
│   ├── page.tsx             # 대시보드 (Sidebar + 컨텐츠)
│   ├── profile/page.tsx
│   └── globals.css          # 디자인 토큰 (--color-cream, --color-sage 등)
├── components/
│   ├── Sidebar.tsx          # ⭐ NEW: 사이드바 (반응형)
│   ├── PageHeader.tsx       # ⭐ NEW: 페이지 상단 (인사말 + 액션 버튼)
│   ├── SummaryCards.tsx     # Card, CardLabel 공통 컴포넌트 export
│   ├── WeightChart.tsx
│   ├── RecentRecords.tsx
│   ├── Calendar.tsx
│   └── modals/
│       ├── Modal.tsx        # inputClass, PrimaryButton 등 공통 export
│       ├── WeightModal.tsx
│       ├── MealModal.tsx
│       ├── WorkoutModal.tsx
│       └── DayDetailModal.tsx
├── hooks/                   # 변경 없음
├── lib/                     # 변경 없음
├── types/                   # 변경 없음
├── firestore.rules
└── storage.rules
```

## 🔮 Phase 2 (다음 단계)

- Claude Vision으로 식사 사진 자동 칼로리·매크로 분석
- 매크로(P/C/F) 추적 그래프
- 사이드바에 메뉴 추가: 분석 & AI, 통장별 자금 흐름 비슷한 식의 임상 지표 탭
- 주간/월간 리포트
- PWA 설치
