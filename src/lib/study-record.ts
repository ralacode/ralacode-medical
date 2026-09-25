const STUDY_RECORD_STORAGE_KEY = "ralacode-study-record"
const MAX_ATTEMPTS_PER_QUESTION = 20

export type AttemptMode = "single" | "session"

export type Attempt = {
  at: string
  /** JSON 上の肢番号（1〜5）。表示上の番号ではない */
  selected: number
  correct: boolean
  /** 同じページ表示の中で「やり直す」後に答えたもの */
  retry: boolean
  mode: AttemptMode
}

export type QuestionRecord = {
  attempts: Attempt[]
}

export type StudyRecordV1 = {
  version: 1
  questions: Record<string, QuestionRecord>
  updatedAt: string
}

export type SaveStudyRecordResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" }

type StoredStudyRecord = StudyRecordV1 & Record<string, unknown>

export function emptyStudyRecord(updatedAt = new Date().toISOString()): StudyRecordV1 {
  return {
    version: 1,
    questions: {},
    updatedAt,
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAttemptMode(value: unknown): value is AttemptMode {
  return value === "single" || value === "session"
}

function parseAttempt(value: unknown): Attempt | undefined {
  if (!isPlainObject(value)) return undefined
  if (typeof value.at !== "string" || value.at.length === 0) return undefined
  if (
    typeof value.selected !== "number" ||
    !Number.isInteger(value.selected) ||
    value.selected < 1 ||
    value.selected > 5
  ) {
    return undefined
  }
  if (typeof value.correct !== "boolean") return undefined
  if (typeof value.retry !== "boolean") return undefined
  if (!isAttemptMode(value.mode)) return undefined

  return {
    at: value.at,
    selected: value.selected,
    correct: value.correct,
    retry: value.retry,
    mode: value.mode,
  }
}

function parseQuestionRecord(value: unknown): QuestionRecord | undefined {
  if (!isPlainObject(value) || !Array.isArray(value.attempts)) return undefined

  const attempts = value.attempts
    .map(parseAttempt)
    .filter((attempt): attempt is Attempt => attempt !== undefined)

  return { attempts }
}

/** 未知 version・破損データは空の記録として扱う */
export function parseStudyRecord(raw: string): StoredStudyRecord {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return emptyStudyRecord()
  }

  if (!isPlainObject(data) || data.version !== 1) return emptyStudyRecord()
  if (!isPlainObject(data.questions)) return emptyStudyRecord()

  const questions: Record<string, QuestionRecord> = {}
  for (const [questionId, value] of Object.entries(data.questions)) {
    const record = parseQuestionRecord(value)
    if (record) questions[questionId] = record
  }

  const updatedAt =
    typeof data.updatedAt === "string" && data.updatedAt.length > 0
      ? data.updatedAt
      : new Date().toISOString()

  return {
    ...data,
    version: 1,
    questions,
    updatedAt,
  }
}

export function loadStudyRecord(): StoredStudyRecord {
  try {
    const raw = localStorage.getItem(STUDY_RECORD_STORAGE_KEY)
    if (raw == null) return emptyStudyRecord()
    return parseStudyRecord(raw)
  } catch {
    return emptyStudyRecord()
  }
}

function isQuotaExceeded(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  )
}

export function saveStudyRecord(record: StoredStudyRecord): SaveStudyRecordResult {
  try {
    localStorage.setItem(STUDY_RECORD_STORAGE_KEY, JSON.stringify(record))
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      reason: isQuotaExceeded(error) ? "quota" : "unavailable",
    }
  }
}

export function addAttempt(
  record: StoredStudyRecord,
  questionId: string,
  attempt: Attempt
): StoredStudyRecord {
  const previous = record.questions[questionId]?.attempts ?? []
  const attempts = [...previous, attempt].slice(-MAX_ATTEMPTS_PER_QUESTION)

  return {
    ...record,
    version: 1,
    questions: {
      ...record.questions,
      [questionId]: { attempts },
    },
    updatedAt: attempt.at,
  }
}

export function recordAttempt(
  questionId: string,
  attempt: Omit<Attempt, "at"> & { at?: string }
): SaveStudyRecordResult {
  const nextAttempt: Attempt = {
    at: attempt.at ?? new Date().toISOString(),
    selected: attempt.selected,
    correct: attempt.correct,
    retry: attempt.retry,
    mode: attempt.mode,
  }

  return saveStudyRecord(addAttempt(loadStudyRecord(), questionId, nextAttempt))
}

export function latestFirstAttempt(
  record: StudyRecordV1,
  questionId: string
): Attempt | undefined {
  const attempts = record.questions[questionId]?.attempts ?? []
  for (let index = attempts.length - 1; index >= 0; index -= 1) {
    const attempt = attempts[index]
    if (attempt && !attempt.retry) return attempt
  }
  return undefined
}

export type IncorrectFirstAttempt = {
  questionId: string
  at: string
  selected: number
}

/** 直近の 1 回目（retry: false）が不正解の問題。新しい順 */
export function listIncorrectFirstAttempts(
  record: StudyRecordV1
): IncorrectFirstAttempt[] {
  const hits: IncorrectFirstAttempt[] = []

  for (const questionId of Object.keys(record.questions)) {
    const attempt = latestFirstAttempt(record, questionId)
    if (attempt && !attempt.correct) {
      hits.push({
        questionId,
        at: attempt.at,
        selected: attempt.selected,
      })
    }
  }

  return hits.sort((left, right) => right.at.localeCompare(left.at))
}

export function hasAnyAttempts(record: StudyRecordV1) {
  return Object.values(record.questions).some(
    (question) => question.attempts.length > 0
  )
}

/** 解答履歴だけ消す。未知のトップレベルキーは残す */
export function clearStudyRecord(): SaveStudyRecordResult {
  const current = loadStudyRecord()
  return saveStudyRecord({
    ...current,
    version: 1,
    questions: {},
    updatedAt: new Date().toISOString(),
  })
}
