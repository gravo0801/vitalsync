# GPT 운동 자동화 저장 규격

> 모든 운동 API 요청에는 GPT Action에 등록한
> `Authorization: Bearer <VitalSync workout API key>` 헤더가 필요하다.
> 서버는 Production 환경변수 `VITALSYNC_GPT_ACTION_KEY`와 Bearer 값을 비교한다.

GPT 자동화가 운동 기록을 Firestore `workouts` 컬렉션에 저장할 때 아래 구조를 사용한다.
자유서술 메모만 저장하지 말고, 근력운동은 `exercises[].sets[]`를 반드시 채운다.

기존 자동화가 사용하는 `strengthExercises[].exerciseName` + `sets[]` 구조도 앱에서 동일하게
정규화해 표시한다. 유산소는 `cardioExercises[]`의 `durationMin`, `speedKmh`, `distanceKm`,
`inclinePercent`를 읽는다. 즉 기존 자동화를 즉시 중단할 필요는 없지만, 두 구조 중 하나에는
반드시 실제 세트 배열이 있어야 한다.

```json
{
  "userId": "personal-user",
  "date": "2026-07-21",
  "duration": 60,
  "type": "헬스",
  "category": "personal",
  "intensity": "moderate",
  "exercises": [
    {
      "id": "seated-chest-press",
      "name": "Seated chest press",
      "sets": [
        { "weightKg": 25, "reps": 15 },
        { "weightKg": 25, "reps": 15 },
        { "weightKg": 30, "reps": 15 }
      ]
    },
    {
      "id": "fixed-pull-down",
      "name": "Fixed pull down",
      "sets": [
        { "weightKg": 30, "reps": 10 },
        { "weightKg": 35, "reps": 10 },
        { "weightKg": 35, "reps": 10 }
      ]
    }
  ],
  "caloriesBurned": 280,
  "calorieEstimate": {
    "method": "met",
    "met": 3.5,
    "bodyWeightKg": 80,
    "durationMin": 60
  },
  "notes": "러닝머신 걷기 포함. 운동 중 불편감 없음."
}
```

## 필드 규칙

- `date`: `YYYY-MM-DD`
- `duration`: 준비·세트 간 휴식·종목 전환을 포함한 전체 운동시간(분)
- `type`: 근력운동은 `헬스`, `근력`, `홈트`, `복합` 중 선택
- `category`: 개인운동은 `personal`, PT는 `PT`
- `intensity`: `light`, `moderate`, `vigorous`
- `exercises[].name`: 기구 또는 운동 종목의 정확한 명칭
- `exercises[].sets[]`: 실제 수행한 세트마다 하나씩 저장
- `weightKg`: 기구에 표시된 중량. 맨몸운동이면 `null`
- `reps`: 해당 세트에서 완료한 반복 횟수
- 같은 중량과 횟수를 반복해도 세트를 합치지 않고 배열 항목을 반복한다.
- 기록에 없는 중량·횟수·시간을 추측해서 채우지 않는다.
- 반복 횟수가 실제로 미기록이면 `reps: null`로 저장하고 앱에는 `횟수 미기록`으로 표시한다.
- 기구 기본저항과 추가 원판을 나눠 기록한 경우 `machineBaseWeightKg`,
  `machineBaseWeightEstimated`, `addedWeightKg`를 유지한다.

## 칼로리 계산

```text
추정 kcal = MET × 체중(kg) × 운동시간(분) ÷ 60
```

근력운동 MET 기본값:

- `light`: 3.0 MET
- `moderate`: 3.5 MET
- `vigorous`: 6.0 MET

중량 × 횟수의 합은 `총볼륨(kg)`으로 표시하며 칼로리 공식에 직접 넣지 않는다.

## GPT Action API

- GPT 최근 5개 세션: `POST /api/gpt/workouts/context?limit=5` (`GET`도 호환)
- GPT 확정 운동 저장: `POST /api/gpt/workouts`
- 이전 단수형 경로인 `/api/gpt/workout/context`, `/api/gpt/workout/confirmed`도 호환을 위해 유지한다.
- 내부/기존 최근 5개 세션: `GET /api/workouts/recent?limit=5`
- 특정 종목 최근 기록: `GET /api/workouts/exercises/recent?name=Rear%20deltoid&limit=5`
- workoutId 상세: `GET /api/workouts/{workoutId}`
- 내부/기존 확정 운동 저장: `POST /api/workouts`
- Action 스키마: `/vitalsync-workout-openapi.yaml` (`/api/gpt/openapi.json`도 같은 스키마로 연결)

모든 GPT API 오류는 Next.js HTML 오류 페이지가 아니라
`{ "ok": false, "error": { "code": "...", "message": "..." } }` JSON으로 반환한다.
`POST /api/workouts`는 `confirmedByUser: true`를 필수로 확인하며 `Idempotency-Key` 헤더 또는
본문의 `idempotencyKey`를 이용해 같은 운동의 중복 생성을 방지하고 `duplicate` 상태를 반환한다.
