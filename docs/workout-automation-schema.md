# GPT 운동 자동화 저장 규격

GPT 자동화가 운동 기록을 Firestore `workouts` 컬렉션에 저장할 때 아래 구조를 사용한다.
자유서술 메모만 저장하지 말고, 근력운동은 `exercises[].sets[]`를 반드시 채운다.

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

## 칼로리 계산

```text
추정 kcal = MET × 체중(kg) × 운동시간(분) ÷ 60
```

근력운동 MET 기본값:

- `light`: 3.0 MET
- `moderate`: 3.5 MET
- `vigorous`: 6.0 MET

중량 × 횟수의 합은 `총볼륨(kg)`으로 표시하며 칼로리 공식에 직접 넣지 않는다.
