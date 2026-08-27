import { useEffect } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SIDEBAR_TOGGLE_EVENT } from "@/lib/ui-contracts"

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
    <TooltipProvider>
      <SidebarProvider className="contents">
        <SidebarEventBridge />
        <AppSidebar />
      </SidebarProvider>
    </TooltipProvider>
  )
}
