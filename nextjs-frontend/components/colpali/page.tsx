"use client"

import { useState, useRef, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Search, Cloud, Settings, FileText, Menu, Loader2, Info, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { AppSidebar } from "@/components/app-sidebar"
import { StatsCards } from "@/components/stats-cards"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { useToast } from "@/lib/hooks/use-toast"
import { colpaliService } from "@/lib/colpali"
import type { CollectionInfoResponse, SearchResult } from "@/app/clientService"

export default function Dashboard() {
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()
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

  useEffect(() => {
    refreshCollectionInfo()
  }, [])

  const SidebarContent = () => <AppSidebar />

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50/30">
        {!isMobile ? (
          <SidebarContent />
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        )}
        
        <SidebarInset className="flex-1">
          <header className={`flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white ${isMobile ? 'px-4 pl-16' : 'px-6'}`}>
            {!isMobile && <SidebarTrigger className="text-gray-600" />}
            {!isMobile && <Separator orientation="vertical" className="h-6" />}
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
            <StatsCards 
              indexedDocs={indexedDocs}
              indexedImages={indexedImages}
              storageUsed={storageUsed}
              totalStorage={totalStorage}
            />

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="index" className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Index Documents
                    </TabsTrigger>
                    <TabsTrigger value="search" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Search
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Manage
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="index" className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF Files</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Select PDF documents to index with vision-language models for intelligent search
                      </p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-4">
                      <div>
                        <Label htmlFor="file-input" className="text-sm font-medium text-gray-700">
                          Select PDF Files
                        </Label>
                        <Input
                          id="file-input"
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="mt-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      {files.length > 0 && (
                        <div className="space-y-2">
                          <Label>Selected Files ({files.length}):</Label>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {files.map((file, index) => (
                              <div key={index} className="text-sm p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-blue-900">{file.name}</span>
                                  <span className="text-blue-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                        <div className="w-16 h-16 gradient-card-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Index</h4>
                        <p className="text-gray-600 mb-6">
                          {files.length > 0 
                            ? `${files.length} PDF file${files.length > 1 ? 's' : ''} selected for indexing`
                            : "Select PDF files above to get started"
                          }
                        </p>
                        <Button 
                          onClick={handleFileUpload}
                          disabled={isIndexing || files.length === 0}
                          size="lg"
                          className="gradient-card-blue text-white border-0 hover:opacity-90"
                        >
                          {isIndexing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Indexing Documents...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-5 w-5" />
                              Index {files.length > 0 ? `${files.length} Document${files.length > 1 ? 's' : ''}` : 'Documents'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="search" className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Search Documents</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Use natural language to search through your indexed documents
                      </p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-4">
                      <div className="flex gap-3">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Enter your search query..."
                          className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button 
                          onClick={handleSearch}
                          disabled={isSearching || !searchQuery.trim()}
                          size="lg"
                          className="gradient-card-blue text-white border-0 hover:opacity-90"
                        >
                          {isSearching ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Search className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {aiResponse && (
                        <Card className="bg-blue-50 border-blue-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-blue-900 text-lg flex items-center gap-2">
                              <Info className="w-5 h-5" />
                              AI Response
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-blue-800">{aiResponse}</p>
                          </CardContent>
                        </Card>
                      )}

                      {searchResults.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Search Results ({searchResults.length})</h4>
                          {searchResults.map((result, index) => (
                            <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Rank #{result.rank}
                                  </Badge>
                                  {result.image_size && (
                                    <span className="text-sm text-gray-500">
                                      Size: {Array.isArray(result.image_size) ? result.image_size.join('×') : result.image_size}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-700">{result.page_info}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="manage" className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Manage Collection</h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        View collection information and manage your indexed documents
                      </p>
                    </div>

                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="flex gap-3">
                        <Button 
                          onClick={refreshCollectionInfo}
                          disabled={isLoading}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Info className="mr-2 h-4 w-4" />
                              Refresh Info
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={handleClearCollection}
                          disabled={isLoading}
                          variant="destructive"
                          className="flex-1 rounded-xl"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Clearing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear Collection
                            </>
                          )}
                        </Button>
                      </div>

                      {collectionInfo && (
                        <Card className="border border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Cloud className="w-5 h-5" />
                              Collection Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-500">Status</span>
                                <p className="text-lg font-semibold text-gray-900">{collectionInfo.status}</p>
                              </div>
                              {collectionInfo.storage_type && (
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Storage Type</span>
                                  <p className="text-lg font-semibold text-gray-900">{collectionInfo.storage_type}</p>
                                </div>
                              )}
                              {collectionInfo.indexed_documents !== undefined && (
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Indexed Documents</span>
                                  <p className="text-lg font-semibold text-gray-900">{collectionInfo.indexed_documents}</p>
                                </div>
                              )}
                              {collectionInfo.indexed_images !== undefined && (
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Indexed Images</span>
                                  <p className="text-lg font-semibold text-gray-900">{collectionInfo.indexed_images}</p>
                                </div>
                              )}
                            </div>
                            {collectionInfo.message && (
                              <div className="pt-3 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-500">Message</span>
                                <p className="text-gray-700 mt-1">{collectionInfo.message}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
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
      </div>
    </SidebarProvider>
  )
}
