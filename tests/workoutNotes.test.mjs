import assert from "node:assert/strict";
import test from "node:test";

import {
  nonRedundantExerciseNote,
  notesAreEquivalent,
} from "../lib/workoutNotes.ts";

test("같은 수행 난이도 메모를 중복으로 판단한다", () => {
  assert.equal(
    notesAreEquivalent(
      "10회까지는 할 만했으나 마지막 5회는 힘들었고 겨우 완료함.",
      "3세트에서 10회까지는 할 만했으나 마지막 5회는 힘들었고 겨우 짜냄.",
    ),
    true,
  );
});

test("같은 통증 메모의 표현 차이를 중복으로 판단한다", () => {
  assert.equal(
    notesAreEquivalent(
      "시행 도중 양쪽 오금 부위에 수축 시 찌릿찌릿한 미세 통증 발생",
      "시행 도중 발 오금 양쪽에 수축 시 찌릿찌릿한 미세 통증이 옴.",
    ),
    true,
  );
});

test("서로 다른 운동 메모는 보존한다", () => {
  assert.equal(
    notesAreEquivalent("25kg는 무거웠음", "오금 통증 발생"),
    false,
  );
  assert.equal(
    nonRedundantExerciseNote("다음 운동에는 20kg 유지", ["마지막 5회는 힘들었음"]),
    "다음 운동에는 20kg 유지",
  );
});

test("세트 메모와 중복되는 종목 메모는 숨긴다", () => {
  assert.equal(
    nonRedundantExerciseNote(
      "3세트에서 10회까지는 할 만했으나 마지막 5회는 힘들었고 겨우 짜냄.",
      ["10회까지는 할 만했으나 마지막 5회는 힘들었고 겨우 완료함."],
    ),
    undefined,
  );
});
