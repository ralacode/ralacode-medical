export const examSubjectIds = [
  "kiso-igaku",
  "rikogaku-hoshasen",
  "xray-kiki",
  "xray-gijutsu",
  "shinryo-gazo-kensa",
  "gazo-kogaku",
  "iryo-gazo-joho",
  "kakui-gaku",
  "hoshasen-chiryo",
  "hoshasen-anzen",
  "iryo-anzen",
] as const

export type ExamSubjectId = (typeof examSubjectIds)[number]

/** 令和6年4月施行の試験科目（規則第10条） */
export const examSubjectLabels: Record<ExamSubjectId, string> = {
  "kiso-igaku": "基礎医学大要",
  "rikogaku-hoshasen": "理工学・放射線科学",
  "xray-kiki": "エックス線撮影機器学",
  "xray-gijutsu": "エックス線撮影技術学",
  "shinryo-gazo-kensa": "診療画像検査学",
  "gazo-kogaku": "画像工学",
  "iryo-gazo-joho": "医療画像情報学",
  "kakui-gaku": "核医学診療技術学",
  "hoshasen-chiryo": "放射線治療技術学",
  "hoshasen-anzen": "放射線安全管理学",
  "iryo-anzen": "医療安全管理学",
}

/** 理工学・放射線科学などを細分化する学習タグ（旧科目名ベース） */
export const studyTopicIds = [
  "hoshasen-seibutsugaku",
  "hoshasen-butsurigaku",
  "iryo-kogaku",
  "hoshasen-keisoku",
] as const

export type StudyTopicId = (typeof studyTopicIds)[number]

export const studyTopicLabels: Record<StudyTopicId, string> = {
  "hoshasen-seibutsugaku": "放射線生物学",
  "hoshasen-butsurigaku": "放射線物理学",
  "iryo-kogaku": "医用工学",
  "hoshasen-keisoku": "放射線計測学",
}

/** 科目ページ・パンくず用（試験科目または学習タグ） */
export type BrowseCategoryId = ExamSubjectId | StudyTopicId

export function isExamSubjectId(id: string): id is ExamSubjectId {
  return (examSubjectIds as readonly string[]).includes(id)
}

export function isStudyTopicId(id: string): id is StudyTopicId {
  return (studyTopicIds as readonly string[]).includes(id)
}

export function isBrowseCategoryId(id: string): id is BrowseCategoryId {
  return isExamSubjectId(id) || isStudyTopicId(id)
}

export function subjectLabel(id: ExamSubjectId) {
  return examSubjectLabels[id]
}

export function studyTopicLabel(id: StudyTopicId) {
  return studyTopicLabels[id]
}

export function browseCategoryLabel(id: BrowseCategoryId) {
  if (isExamSubjectId(id)) return examSubjectLabels[id]
  return studyTopicLabels[id]
}
