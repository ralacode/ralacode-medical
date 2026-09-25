import { Button } from "@/components/ui/button"
import { withDrillQuery } from "@/lib/questions"
import {
  startStudySession,
  type StudySessionItem,
} from "@/lib/study-session"

type StartStudySessionButtonProps = {
  title: string
  items: StudySessionItem[]
  returnHref: string
}

export function StartStudySessionButton({
  title,
  items,
  returnHref,
}: StartStudySessionButtonProps) {
  const first = items[0]
  if (!first) return null

  function handleClick() {
    startStudySession({ title, items, returnHref })
    window.location.assign(withDrillQuery(first.href))
  }

  return (
    <Button type="button" variant="outline" size="lg" onClick={handleClick}>
      連続で解く
    </Button>
  )
}
