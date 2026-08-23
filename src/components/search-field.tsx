import { Input } from "@/components/ui/input"

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

/** 一覧ページ共通の「キーワードで探す」入力欄 */
export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">
        キーワードで探す
      </span>
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11"
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  )
}
