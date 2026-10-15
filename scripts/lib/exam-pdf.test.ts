import assert from "node:assert/strict"
import { test } from "node:test"
import { assignQuestionPages, detectQuestionCandidates } from "./exam-pdf.ts"

test("表紙の解答例とマーク欄は問1にしない", () => {
  const cover = [
    "DKIX-06-前H-1",
    "◎ 指示があるまで開かないこと。",
    "1 2 3 4 5",
    "（例 1 ）101 次の検査で放射線被",
    "ばくがあるのはどれか｡",
    "1．MRI",
    "2．脳 波",
    "注意事項",
    "1．試験問題の数は 100 問で解答時間は正味 2 時間 35 分である。",
  ]
  assert.deepEqual(detectQuestionCandidates(cover), [])
})

test("マーク欄だけの行は問番号にしない", () => {
  assert.deepEqual(detectQuestionCandidates(["1 2 3 4 5", "1．MRI"]), [])
})

test("本文の問1見出しは残す", () => {
  const body = [
    "1 次の記述で正しいのはどれか。",
    "1．塩素",
    "2．炭素",
  ]
  assert.deepEqual(detectQuestionCandidates(body), [1])
})

test("表紙に候補が無いと本文ページの問1を採用する", () => {
  const assigned = assignQuestionPages([
    { pageNumber: 1, readable: "", questionCandidates: [] },
    { pageNumber: 5, readable: "", questionCandidates: [1, 2, 3] },
  ])
  assert.equal(assigned.get(1), 5)
  assert.equal(assigned.get(2), 5)
  assert.equal(assigned.get(3), 5)
})
