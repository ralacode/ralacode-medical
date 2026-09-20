import {
  BookOpenIcon,
  CalculatorIcon,
  GraduationCapIcon,
  HomeIcon,
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
import { showTools, siteMeta } from "@/lib/constants"
import { withBase } from "@/lib/paths"
import { articlesHref } from "@/lib/article-paths"
import { examsHref } from "@/lib/questions"

const navItems = [
  { title: "ホーム", href: withBase(), icon: HomeIcon },
  { title: "用語解説", href: articlesHref(), icon: BookOpenIcon },
  {
    title: "国家試験対策",
    href: examsHref(),
    icon: GraduationCapIcon,
  },
  ...(showTools
    ? [{ title: "計算ツール", href: withBase("#tools"), icon: CalculatorIcon }]
    : []),
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 overflow-hidden px-2 py-1.5">
          <img
            src={withBase(siteMeta.siteIcon)}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-lg"
          />
          <span className="truncate font-medium group-data-[collapsible=icon]:sr-only">
            {siteMeta.siteTitle}
          </span>
        </div>
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
