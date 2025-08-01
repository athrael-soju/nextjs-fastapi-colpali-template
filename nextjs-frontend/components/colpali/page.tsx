"use client"

import { useState, useRef, useEffect } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Search, Cloud, Settings, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { StatsCards } from "@/components/stats-cards"
import { IndexTab } from "@/components/index-tab"
import { SearchTab } from "@/components/search-tab"
import { StorageTab } from "@/components/storage-tab"
import { ManageTab } from "@/components/manage-tab"
import { useToast } from "@/lib/hooks/use-toast"
import { colpaliService } from "@/lib/colpali"
import type { CollectionInfoResponse, SearchResult } from "@/app/clientService"

export default function ColPaliDashboard() {
  const [activeTab, setActiveTab] = useState("index")
  const [searchQuery, setSearchQuery] = useState("")
  const [isIndexing, setIsIndexing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [collectionInfo, setCollectionInfo] = useState<CollectionInfoResponse | null>(null)
  const [aiResponse, setAiResponse] = useState<string>("")
  const [message, setMessage] = useState("")
  const [indexedDocs, setIndexedDocs] = useState(0)
  const [indexedImages, setIndexedImages] = useState(0)
  const [storageUsed, setStorageUsed] = useState(0)
  const [totalStorage, setTotalStorage] = useState(10)
  const [minioFiles, setMinioFiles] = useState<{
    id: number;
    name: string;
    size: string;
    lastModified: string;
    bucket: string;
  }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)


  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const pdfFiles = selectedFiles.filter(file => file.type === "application/pdf")
    
    if (pdfFiles.length !== selectedFiles.length) {
      setMessage("Only PDF files are supported. Non-PDF files were filtered out.")
      toast({
        title: "File Filter",
        description: "Only PDF files are supported. Non-PDF files were filtered out.",
        variant: "destructive"
      })
    }
    
    setFiles(pdfFiles)
  }

  const handleFileUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select PDF files to index")
      return
    }

    setIsIndexing(true)
    setMessage("")
    toast({
      title: "Indexing Started",
      description: "Your documents are being processed and indexed...",
    })
    
    try {
      const result = await colpaliService.indexDocuments(files)
      if (result.status === "success") {
        setMessage(`Successfully indexed ${result.indexed_pages} pages from ${files.length} documents`)
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        await refreshCollectionInfo()
        toast({
          title: "Indexing Complete",
          description: `Successfully indexed ${result.indexed_pages} pages from ${files.length} documents`,
        })
      } else {
        setMessage(result.message || "Failed to index documents")
        toast({
          title: "Indexing Failed",
          description: result.message || "Failed to index documents",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = `Error indexing documents: ${error instanceof Error ? error.message : "Unknown error"}`
      setMessage(errorMessage)
      toast({
        title: "Indexing Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsIndexing(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage("Please enter a search query")
      return
    }

    setIsSearching(true)
    setMessage("")
    setSearchResults([])
    setAiResponse("")

    try {
      const result = await colpaliService.searchDocuments(searchQuery, 5)
      if (result.status === "success") {
        setSearchResults(result.results || [])
        setAiResponse(result.ai_response || "")
        setMessage(result.total_results ? `Found ${result.total_results} results` : "Search completed")
        toast({
          title: "Search Complete",
          description: result.total_results ? `Found ${result.total_results} results` : "Search completed",
        })
      } else {
        setMessage(result.message || "Search failed")
        toast({
          title: "Search Failed",
          description: result.message || "Search failed",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = `Error searching documents: ${error instanceof Error ? error.message : "Unknown error"}`
      setMessage(errorMessage)
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  const refreshCollectionInfo = async () => {
    setIsLoading(true)
    try {
      const info = await colpaliService.getCollectionInfo()
      setCollectionInfo(info)
      if (info.indexed_documents !== undefined) {
        setIndexedDocs(info.indexed_documents || 0)
      }
      if (info.indexed_images !== undefined) {
        setIndexedImages(info.indexed_images || 0)
      }
    } catch (error) {
      setMessage(`Error getting collection info: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearCollection = async () => {
    if (!confirm("Are you sure you want to clear all indexed documents? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const result = await colpaliService.clearCollection()
      if (result.status === "success") {
        setMessage("Collection cleared successfully")
        setCollectionInfo(null)
        setSearchResults([])
        setAiResponse("")
        setIndexedDocs(0)
        setIndexedImages(0)
        await refreshCollectionInfo()
        toast({
          title: "Collection Cleared",
          description: "All indexed documents have been removed",
        })
      } else {
        setMessage(result.message || "Failed to clear collection")
        toast({
          title: "Clear Failed",
          description: result.message || "Failed to clear collection",
          variant: "destructive"
        })
      }
    } catch (error) {
      const errorMessage = `Error clearing collection: ${error instanceof Error ? error.message : "Unknown error"}`
      setMessage(errorMessage)
      toast({
        title: "Clear Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFile = (fileId: number) => {
    setMinioFiles((prev) => prev.filter((file) => file.id !== fileId))
    setStorageUsed((prev) => Math.max(0, prev - 0.5))
    setIndexedDocs((prev) => Math.max(0, prev - 1))
    toast({
      title: "File Deleted",
      description: "File has been removed from storage",
    })
  }

  const handleDownloadFile = (fileName: string) => {
    console.log("Downloading:", fileName)
    toast({
      title: "Download Started",
      description: `Downloading ${fileName}...`,
    })
  }

  useEffect(() => {
    refreshCollectionInfo()
  }, [])

  return (
    <SidebarInset className="flex-1">
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 px-6 bg-white">
        <SidebarTrigger className="text-gray-600" />
        <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 gradient-card-blue rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">ColPali Dashboard</h1>
                <p className="text-sm text-gray-500 truncate">Document Search & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                {collectionInfo?.status || "Ready"}
              </Badge>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger
                      value="index"
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Index Documents
                    </TabsTrigger>
                    <TabsTrigger
                      value="search"
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </TabsTrigger>
                    <TabsTrigger
                      value="storage"
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                    >
                      <Cloud className="w-4 h-4" />
                      Storage
                    </TabsTrigger>
                    <TabsTrigger
                      value="manage"
                      className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      Manage
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="index" className="space-y-8 mt-8">
                    <IndexTab 
                      isIndexing={isIndexing} 
                      onFileUpload={handleFileUpload}
                      files={files}
                      onFileSelect={handleFileSelect}
                      message={message}
                    />
                  </TabsContent>

                  <TabsContent value="search" className="space-y-8 mt-8">
                    <SearchTab 
                      searchQuery={searchQuery} 
                      setSearchQuery={setSearchQuery}
                    />
                  </TabsContent>

                  <TabsContent value="storage" className="space-y-8 mt-8">
                    <StorageTab
                      storageUsed={storageUsed}
                      totalStorage={totalStorage}
                      minioFiles={minioFiles}
                      onDeleteFile={handleDeleteFile}
                      onDownloadFile={handleDownloadFile}
                    />
                  </TabsContent>

                  <TabsContent value="manage" className="space-y-8 mt-8">
                    <ManageTab
                      collectionStatus={collectionInfo?.status || "unknown"}
                      minioFiles={minioFiles}
                      onClearCollection={handleClearCollection}
                    />
                  </TabsContent>
                </Tabs>

                {message && (
                  <Alert className={`mt-6 ${
                    message.includes("Error") || message.includes("Failed") 
                      ? "border-red-200 bg-red-50" 
                      : "border-green-200 bg-green-50"
                  }`}>
                    <AlertDescription className={
                      message.includes("Error") || message.includes("Failed") 
                        ? "text-red-800" 
                        : "text-green-800"
                    }>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
      </main>
    </SidebarInset>
  )
}
