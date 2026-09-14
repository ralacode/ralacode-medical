import type { ExamSession } from "@/lib/questions"
import type { ExamSubjectId, StudyTopicId } from "@/lib/exam-subjects"

/**
 * 形式チェック（1〜5 番ラベル・#page= 必須など）を免除する年次。
 * 2026 年は手順書の現行形式より前に書かれた問が混在するため。
 * 2027 年以降は免除しない。
 */
export const grandfatherYears = [2026] as const

export function isGrandfatherYear(year: number) {
  return (grandfatherYears as readonly number[]).includes(year)
}

/** 知識問題は 5 肢解説と過去問 1〜5 番が必要。計算・式選択は省略可 */
export type ExamSlotKind = "knowledge" | "calculation"

export type ExamManifestSlot = {
  session: ExamSession
  number: number
  subject: ExamSubjectId
  studyTopics: StudyTopicId[]
  /** 公式正答。採点除外のときは null */
  officialAnswer: number | number[] | null
  scoringExcluded: boolean
  hasBooklet: boolean
  kind: ExamSlotKind
  /** 論点の短い要約（公式文の転載ではない） */
  topic: string
}

export type ExamYearManifest = {
  year: number
  exam: number
  slots: ExamManifestSlot[]
}

export function manifestSlotKey(session: ExamSession, number: number) {
  return `${session}:${number}`
}

export function indexManifestSlots(manifest: ExamYearManifest) {
  const index = new Map<string, ExamManifestSlot>()
  for (const slot of manifest.slots) {
    index.set(manifestSlotKey(slot.session, slot.number), slot)
  }
  return index
}
