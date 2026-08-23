const CHOICE_ORDER_STORAGE_KEY = "exam-choice-order"

export type ChoiceOrderMode = "original" | "random"

export function readChoiceOrderMode(): ChoiceOrderMode {
  return localStorage.getItem(CHOICE_ORDER_STORAGE_KEY) === "random"
    ? "random"
    : "original"
}

export function writeChoiceOrderMode(mode: ChoiceOrderMode) {
  localStorage.setItem(CHOICE_ORDER_STORAGE_KEY, mode)
}

export function shuffleItems<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
