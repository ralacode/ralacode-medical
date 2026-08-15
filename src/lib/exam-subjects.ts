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

export function subjectLabel(id: ExamSubjectId) {
  return examSubjectLabels[id]
}
