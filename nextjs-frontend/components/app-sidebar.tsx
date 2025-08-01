import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Home, FileText, BarChart3, Settings, Sparkles, List, Users2, Plus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function AppSidebar() {
  const menuItems = [
    { title: "Dashboard", icon: Home, href: "/dashboard", id: "dashboard" },
    { title: "ColPali Search", icon: FileText, href: "/dashboard/colpali", id: "colpali" },
    { title: "Analytics", icon: BarChart3, href: "#", id: "analytics" },
    { title: "Settings", icon: Settings, href: "#", id: "settings" },
  ]

  return (
    <Sidebar className="border-r border-gray-100">
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/vinta.png"
              alt="Vinta"
              width={40}
              height={40}
              className="object-cover rounded-xl shadow-lg"
            />
            <div>
              <h2 className="font-bold text-xl text-gray-900">Dashboard</h2>
              <p className="text-sm text-gray-500">Admin Panel</p>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild className="w-full justify-start px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Link href={item.href}>
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
