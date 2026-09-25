const STUDY_SESSION_STORAGE_KEY = "ralacode-study-session"

export const SESSION_ANSWERED_EVENT = "study-session:answered"

export type StudySessionItem = {
  id: string
  href: string
  heading: string
  stem: string
}

export type StudySessionV1 = {
  version: 1
  title: string
  items: StudySessionItem[]
  index: number
  /** この連続の 1 回目の正誤。未解答はキーなし */
  firstResults: Record<string, boolean>
  returnHref: string
}

function saveStudySession(session: StudySessionV1) {
  sessionStorage.setItem(STUDY_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function loadStudySession(): StudySessionV1 | undefined {
  try {
    const raw = sessionStorage.getItem(STUDY_SESSION_STORAGE_KEY)
    if (raw == null) return undefined
    const data: unknown = JSON.parse(raw)
    if (
      typeof data !== "object" ||
      data === null ||
      !("version" in data) ||
      data.version !== 1 ||
      !("items" in data) ||
      !Array.isArray(data.items)
    ) {
      return undefined
    }
    return data as StudySessionV1
  } catch {
    return undefined
  }
}

export function startStudySession(input: {
  title: string
  items: StudySessionItem[]
  returnHref: string
}) {
  saveStudySession({
    version: 1,
    title: input.title,
    items: input.items,
    index: 0,
    firstResults: {},
    returnHref: input.returnHref,
  })
}

export function isActiveSessionQuestion(questionId: string, search: string) {
  if (new URLSearchParams(search).get("drill") !== "1") return false
  const session = loadStudySession()
  return session?.items.some((item) => item.id === questionId) ?? false
}

export function syncSessionToQuestion(questionId: string) {
  const session = loadStudySession()
  if (!session) return
  const index = session.items.findIndex((item) => item.id === questionId)
  if (index < 0 || session.index === index) return
  saveStudySession({ ...session, index })
}

export function markSessionFirstResult(questionId: string, correct: boolean) {
  const session = loadStudySession()
  if (!session || session.firstResults[questionId] !== undefined) return

  saveStudySession({
    ...session,
    firstResults: { ...session.firstResults, [questionId]: correct },
  })
  document.dispatchEvent(
    new CustomEvent(SESSION_ANSWERED_EVENT, { detail: { questionId } })
  )
}

export function clearStudySession() {
  sessionStorage.removeItem(STUDY_SESSION_STORAGE_KEY)
}
