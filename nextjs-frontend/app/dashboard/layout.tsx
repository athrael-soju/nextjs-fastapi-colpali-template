"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Extract active tab from pathname
  const getActiveTab = () => {
    const segments = pathname.split('/')
    const lastSegment = segments[segments.length - 1]
    
    switch (lastSegment) {
      case 'search':
        return 'search'
      case 'upload':
        return 'upload'
      case 'collection':
        return 'collection'
      case 'profile':
        return 'profile'
      default:
        return 'search' // default to search
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeTab={getActiveTab()} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ColPali Dashboard</h1>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
