"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DocumentUpload } from "@/components/document-upload"
import { DocumentSearch } from "@/components/document-search"
import { CollectionInfo } from "@/components/collection-info"
import { UserProfile } from "@/components/user-profile"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("search")
  const router = useRouter()

  const renderContent = () => {
    switch (activeTab) {
      case "search":
        return <DocumentSearch />
      case "upload":
        return <DocumentUpload />
      case "collection":
        return <CollectionInfo />
      case "profile":
        return <UserProfile />
      default:
        return <DocumentSearch />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">ColPali Dashboard</h1>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">{renderContent()}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
