import { useEffect } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

function SidebarEventBridge() {
  const { toggleSidebar } = useSidebar()

  useEffect(() => {
    const onToggle = () => toggleSidebar()
    window.addEventListener("sidebar:toggle", onToggle)
    return () => window.removeEventListener("sidebar:toggle", onToggle)
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
