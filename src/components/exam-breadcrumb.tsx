import { buttonVariants } from "@/components/ui/button"
import { useQuestionBrowseState } from "@/hooks/use-question-browse-state"
import {
  browseCategoryLabel,
  type BrowseCategoryId,
  type ExamSubjectId,
} from "@/lib/exam-subjects"
import {
  browseCategoryHref,
  examsHref,
  sessionLabel,
  yearHref,
  type ExamSession,
} from "@/lib/questions"
import { cn } from "@/lib/utils"

type ExamBreadcrumbProps = {
  year?: number
  session?: ExamSession
  number?: number
  category?: BrowseCategoryId
  subject?: ExamSubjectId
  className?: string
  class?: string
}

const currentClass = "px-1 text-foreground"
const linkClass = buttonVariants({ variant: "default", size: "sm" })

function CrumbSep() {
  return (
    <li aria-hidden="true" className="text-muted-foreground">
      /
    </li>
  )
}

export function ExamBreadcrumb({
  year,
  session,
  number,
  category,
  subject,
  className,
  class: classProp,
}: ExamBreadcrumbProps) {
  const navClass = className ?? classProp
  const { fromSubject, topic } = useQuestionBrowseState()
  const questionPage = year != null && session != null && number != null
  const browseId =
    questionPage && fromSubject ? (topic ?? subject) : undefined
  const atRoot = year == null && category == null

  return (
    <nav aria-label="パンくずリスト" className={navClass}>
      <ol className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
        <li>
          {atRoot ? (
            <span className={currentClass}>国家試験対策</span>
          ) : (
            <a className={linkClass} href={examsHref()}>
              国家試験対策
            </a>
          )}
        </li>
        {browseId ? (
          <>
            <CrumbSep />
            <li>
              <a className={linkClass} href={browseCategoryHref(browseId)}>
                {browseCategoryLabel(browseId)}
              </a>
            </li>
          </>
        ) : null}
        {year != null && !browseId ? (
          <>
            <CrumbSep />
            <li>
              {session ? (
                <a className={linkClass} href={yearHref(year)}>
                  {year}年
                </a>
              ) : (
                <span className={currentClass}>{year}年</span>
              )}
            </li>
          </>
        ) : null}
        {session && number ? (
          <>
            <CrumbSep />
            <li className={cn(currentClass, "truncate")}>
              {sessionLabel(session)} 問{number}
            </li>
          </>
        ) : null}
        {category && year == null && !browseId ? (
          <>
            <CrumbSep />
            <li className={cn(currentClass, "truncate")}>
              {browseCategoryLabel(category)}
            </li>
          </>
        ) : null}
      </ol>
    </nav>
  )
}
