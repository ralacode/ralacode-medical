import { useEffect, useState } from "react"

import type { StudyTopicId } from "@/lib/exam-subjects"
import { isFromSubjectNavigation, navigationTopic } from "@/lib/questions"

export type QuestionBrowseState = {
  fromSubject: boolean
  topic: StudyTopicId | undefined
}

/** SSR / 初回ハイドレーションは年次ナビに合わせ、マウント後にクエリを読む */
const examBrowseState: QuestionBrowseState = {
  fromSubject: false,
  topic: undefined,
}

export function useQuestionBrowseState() {
  const [state, setState] = useState(examBrowseState)

  useEffect(() => {
    const sync = () => {
      const fromSubject = isFromSubjectNavigation(window.location.search)
      const topic = navigationTopic(window.location.search)
      setState({ fromSubject, topic })
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  return state
}
