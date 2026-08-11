import {
  CalendarDaysIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { siteMeta } from "@/lib/constants"
import { withBase } from "@/lib/paths"

const navItems = [
  { title: "ホーム", href: withBase(), icon: HomeIcon },
  { title: "テスト", href: withBase("test/"), icon: UsersIcon },
  { title: "予約", href: withBase("appointments/"), icon: CalendarDaysIcon },
  { title: "設定", href: withBase("settings/"), icon: SettingsIcon },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={siteMeta.siteTitle}>
              <img
                src={withBase(siteMeta.siteIcon)}
                alt={siteMeta.siteTitle}
                width={32}
                height={32}
                className="size-8 rounded-lg"
              />
              <span className="truncate font-medium">{siteMeta.siteTitle}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    render={<a href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
