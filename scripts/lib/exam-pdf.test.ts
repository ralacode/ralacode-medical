import assert from "node:assert/strict"
import { test } from "node:test"
import {
  assignQuestionPages,
  detectQuestionCandidates,
  joinSplitQuestion100,
} from "./exam-pdf.ts"

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

test("問100の百の位が読み順の末尾でも見出し行にする", () => {
  const items = [
    { str: "00", transform: [1, 0, 0, 1, 115, 525] },
    { str: " ", transform: [1, 0, 0, 1, 125, 525] },
    { str: "次の記述で正しいのはどれか。", transform: [1, 0, 0, 1, 135, 525] },
    { str: "1", transform: [1, 0, 0, 1, 110, 525] },
  ]
  joinSplitQuestion100(items)
  assert.equal(items[0]!.str, "100")
  assert.equal(items[3]!.str, "")
  assert.deepEqual(
    detectQuestionCandidates([
      "100 次の記述で正しいのはどれか。",
      "1．肢",
      "2．肢",
    ]),
    [100]
  )
})

test("離れた 1 と 00 は問100に結合しない", () => {
  const items = [
    { str: "1", transform: [1, 0, 0, 1, 10, 100] },
    { str: "00", transform: [1, 0, 0, 1, 400, 200] },
  ]
  joinSplitQuestion100(items)
  assert.equal(items[0]!.str, "1")
  assert.equal(items[1]!.str, "00")
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

test("3桁の問番号が 1 と 00 に分かれても問100にする", () => {
  const body = [
    "99 次の記述で正しいのはどれか。",
    "1．塩素",
    "00 次の記述で正しいのはどれか。",
    "1．炭素",
    "1",
  ]
  assert.deepEqual(detectQuestionCandidates(body), [99, 100])
})

test("孤立した 1 が無くても 00 見出しは問100にする", () => {
  const body = [
    "00 次の記述で正しいのはどれか。",
    "1．炭素",
  ]
  assert.deepEqual(detectQuestionCandidates(body), [100])
})

test("末尾の孤立した 1 だけでは問番号にしない", () => {
  const body = [
    "99 次の記述で正しいのはどれか。",
    "1．塩素",
    "1",
  ]
  assert.deepEqual(detectQuestionCandidates(body), [99])
})
