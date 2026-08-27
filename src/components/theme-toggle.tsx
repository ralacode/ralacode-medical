import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { THEME_STORAGE_KEY } from "@/lib/ui-contracts"
import { cn } from "@/lib/utils"

function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5",
        !mounted && "invisible"
      )}
      role="radiogroup"
      aria-label="外観"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        className={cn(
          "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors",
          !isDark && "bg-background text-foreground shadow-sm"
        )}
        onClick={() => setTheme("light")}
      >
        <SunIcon className="size-3.5" aria-hidden="true" />
        ライト
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        className={cn(
          "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors",
          isDark && "bg-background text-foreground shadow-sm"
        )}
        onClick={() => setTheme("dark")}
      >
        <MoonIcon className="size-3.5" aria-hidden="true" />
        ダーク
      </button>
    </div>
  )
}

export function ThemeToggle() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <ThemeSwitch />
    </ThemeProvider>
  )
}
