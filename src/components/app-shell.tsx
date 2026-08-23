import { useEffect } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SIDEBAR_TOGGLE_EVENT, THEME_STORAGE_KEY } from "@/lib/ui-contracts"

function SidebarEventBridge() {
  const { toggleSidebar } = useSidebar()

  useEffect(() => {
    const onToggle = () => toggleSidebar()
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, onToggle)
    return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, onToggle)
  }, [toggleSidebar])

  return null
}

/** Persisted chrome only — page content stays in Astro's slot. */
export function AppShell() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <SidebarProvider className="contents">
          <SidebarEventBridge />
          <AppSidebar />
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
