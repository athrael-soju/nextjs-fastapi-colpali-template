import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Home, FileText, BarChart3, Settings, Sparkles } from "lucide-react"

export function AppSidebar() {
  const menuItems = [
    { title: "Dashboard", icon: Home, id: "dashboard" },
    { title: "Document Manager", icon: FileText, id: "manager" },
    { title: "Analytics", icon: BarChart3, id: "analytics" },
    { title: "Settings", icon: Settings, id: "settings" },
  ]

  return (
    <Sidebar className="border-r border-gray-100">
      <SidebarHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-card-blue rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">ColPali</h2>
            <p className="text-sm text-gray-500">Document Search</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton className="w-full justify-start px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                <item.icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
