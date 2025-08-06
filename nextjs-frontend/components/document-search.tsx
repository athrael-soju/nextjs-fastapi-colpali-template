"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, ImageIcon, Download, Bot, User, Send, AlertCircle, X } from "lucide-react"
import { searchDocumentsAction } from "@/components/actions/colpali-action"
import type { SearchResponse, SearchResult as APISearchResult } from "@/app/clientService"

interface SearchResult {
  id: string
  score: number
  document_name: string
  page_number: number
  image_id: string
  image_url: string // Full-size image URL
  thumbnail_url: string // Thumbnail URL for grid display
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
  images?: SearchResult[]
}

export function DocumentSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [llmEnabled, setLlmEnabled] = useState(false)
  const [topK, setTopK] = useState(5)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<SearchResult | null>(null)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setError(null)

    // Add user message to chat if LLM is enabled
    if (llmEnabled) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        content: query,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, userMessage])
    }

    try {
      // Call the server action with proper authentication
      const searchResponse = await searchDocumentsAction(query, topK)

      if (searchResponse.status === "error") {
        throw new Error(searchResponse.message || "Search failed")
      }

      // Transform API results to match our interface
      const transformedResults: SearchResult[] = (searchResponse.results || []).map((result: APISearchResult) => {
        // Extract document name and page number from page_info
        const pageInfoParts = result.page_info.split(" - Page ")
        const documentName = pageInfoParts[0] || "Unknown Document"
        const pageNumber = pageInfoParts[1] ? parseInt(pageInfoParts[1]) : 1

        // Construct image URLs - handle both relative and absolute URLs
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
        
        // Convert relative URLs to absolute URLs
        const makeAbsoluteUrl = (url: string | null | undefined): string => {
          if (!url) return ''
          if (url.startsWith('http')) return url // Already absolute
          return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}` // Make absolute
        }

        // Full-size image URL - convert to absolute
        const fullImageUrl = makeAbsoluteUrl(result.image_url)

        // Thumbnail URL - convert to absolute
        const thumbnailUrl = makeAbsoluteUrl(result.thumbnail_url)

        return {
          id: `result_${result.rank}`,
          score: 1 - (result.rank - 1) * 0.05, // Convert rank to score (higher rank = lower score)
          document_name: documentName,
          page_number: pageNumber,
          image_id: `img_${result.rank}`,
          image_url: fullImageUrl,
          thumbnail_url: thumbnailUrl,
        }
      })

      setResults(transformedResults)

      // Generate LLM response if enabled and AI response is available
      if (llmEnabled) {
        setIsGenerating(true)

        // Use AI response from backend if available, otherwise generate a default response
        const aiResponseContent = searchResponse.ai_response ||
          `Based on your search for "${query}", I found ${transformedResults.length} relevant document pages. ${transformedResults.length > 0 ? `The most relevant result is from "${transformedResults[0].document_name}" on page ${transformedResults[0].page_number} with a ${Math.round(transformedResults[0].score * 100)}% match.` : "No relevant documents were found for this query."}`

        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: aiResponseContent,
            timestamp: new Date(),
            images: transformedResults,
          }
          setChatMessages((prev) => [...prev, assistantMessage])
          setIsGenerating(false)
        }, 1000)
      }
    } catch (err) {
      console.error("Search error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)

      if (llmEnabled) {
        const errorAssistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `I encountered an error while searching: ${errorMessage}. Please check if documents are indexed and try again.`,
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, errorAssistantMessage])
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendMessage = () => {
    if (!query.trim()) return
    handleSearch()
    setQuery("")
  }

  const handleViewImage = (result: SearchResult) => {
    // Show image in overlay modal
    setSelectedImage(result)
  }

  const handleDownloadImage = async (result: SearchResult) => {
    try {
      // For images served by our backend, we might need authentication
      const response = await fetch(result.image_url, {
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${result.document_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_page_${result.page_number}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      setError(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Fallback: open in new tab if download fails
      window.open(result.image_url, '_blank')
    }
  }

  if (llmEnabled) {
    return (
      <div className="p-8 h-full flex flex-col bg-background">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold hf-text-gradient mb-2">AI Document Search</h1>
                <p className="text-muted-foreground">Search and chat with your document collection</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topk" className="text-foreground">
                    Top K:
                  </Label>
                  <Input
                    id="topk"
                    type="number"
                    min="1"
                    max="20"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="llm-mode" checked={llmEnabled} onCheckedChange={setLlmEnabled} />
                  <Label htmlFor="llm-mode" className="text-foreground">
                    AI Chat
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <Card className="hf-card flex-1 mb-4">
            <CardContent className="p-0 h-full">
              <ScrollArea className="h-[500px] p-6">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
                      <p className="text-muted-foreground">
                        Ask questions about your documents and I'll help you find relevant information.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.type === "assistant" && (
                          <Avatar className="h-8 w-8 bg-blue-600">
                            <AvatarFallback>
                              <Bot className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${message.type === "user" ? "order-first" : ""}`}>
                          <div
                            className={`rounded-lg p-4 ${message.type === "user"
                                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white ml-auto"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          {message.images && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                              {message.images.map((result) => (
                                <Card key={result.id} className="hf-card group">
                                  <CardContent className="p-3">
                                    <div className="relative mb-3">
                                      <img
                                        src={result.thumbnail_url}
                                        alt={`${result.document_name} - Page ${result.page_number}`}
                                        className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => handleViewImage(result)}
                                      />
                                      <Badge
                                        variant="secondary"
                                        className="absolute top-2 right-2 bg-white/90 text-green-600 border-green-600 dark:bg-black/90 dark:text-green-400"
                                      >
                                        {Math.round(result.score * 100)}% match
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <h3 className="font-semibold text-xs text-card-foreground line-clamp-2">
                                        {result.document_name}
                                      </h3>
                                      <p className="text-xs text-muted-foreground">Page {result.page_number}</p>
                                      <div className="flex gap-1 pt-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 text-xs py-1 h-7 bg-transparent hover:bg-primary/10"
                                          onClick={() => handleViewImage(result)}
                                        >
                                          <ImageIcon className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 text-xs py-1 h-7 bg-transparent hover:bg-primary/10"
                                          onClick={() => handleDownloadImage(result)}
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Download
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{message.timestamp.toLocaleTimeString()}</p>
                        </div>
                        {message.type === "user" && (
                          <Avatar className="h-8 w-8 bg-gray-600">
                            <AvatarFallback>
                              <User className="h-4 w-4 text-white" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-8 w-8 bg-blue-600">
                          <AvatarFallback>
                            <Bot className="h-4 w-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span className="text-sm text-muted-foreground">Analyzing documents...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Input Area */}
          <Card className="hf-card">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Ask a question about your documents..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      if (error) setError(null)
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="text-lg"
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={isSearching || !query.trim()} className="hf-button">
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Search Error</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Overlay Modal */}
          {selectedImage && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-full">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
                >
                  <X className="h-8 w-8" />
                </button>
                <img
                  src={selectedImage.image_url}
                  alt={`${selectedImage.document_name} - Page ${selectedImage.page_number}`}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = selectedImage.thumbnail_url; // Fallback to thumbnail if full image fails
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                  <h3 className="font-semibold text-lg">{selectedImage.document_name}</h3>
                  <p className="text-sm opacity-90">Page {selectedImage.page_number} • {Math.round(selectedImage.score * 100)}% match</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(selectedImage);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular search mode (non-chat)
  return (
    <div className="p-8 h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold hf-text-gradient mb-2">Search Documents</h1>
              <p className="text-muted-foreground">
                Search through your indexed document collection using natural language queries
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="topk-regular" className="text-foreground">
                  Top K:
                </Label>
                <Input
                  id="topk-regular"
                  type="number"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="llm-mode-regular" checked={llmEnabled} onCheckedChange={setLlmEnabled} />
                <Label htmlFor="llm-mode-regular" className="text-foreground">
                  AI Chat
                </Label>
              </div>
            </div>
          </div>
        </div>

        <Card className="hf-card mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    if (error) setError(null)
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="text-lg"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="hf-button px-8">
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Search Error</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Search Results ({results.length})</h2>

            {/* Image Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => (
                <Card key={result.id} className="hf-card">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <img
                        src={result.thumbnail_url}
                        alt={`${result.document_name} - Page ${result.page_number}`}
                        className="w-full h-48 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleViewImage(result)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 bg-white/90 text-green-600 border-green-600 dark:bg-black/90 dark:text-green-400"
                      >
                        {Math.round(result.score * 100)}% match
                      </Badge>
                    </div>

                    <div className="space-y-2">

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          <h3 className="font-semibold text-sm text-card-foreground line-clamp-2">
                            {result.document_name}
                          </h3>
                        </span>
                        <Badge variant="outline" className="text-xs">
                          ID: {result.image_id}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent hover:bg-primary/10"
                          onClick={() => handleViewImage(result)}
                        >
                          <ImageIcon className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent hover:bg-primary/10"
                          onClick={() => handleDownloadImage(result)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {results.length === 0 && query && !isSearching && (
          <Card className="hf-card">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search query or check if documents are properly indexed.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Image Overlay Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={selectedImage.image_url}
                alt={`${selectedImage.document_name} - Page ${selectedImage.page_number}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = selectedImage.thumbnail_url; // Fallback to thumbnail if full image fails
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                <h3 className="font-semibold text-lg text-center">{selectedImage.document_name} • {Math.round(selectedImage.score * 100)}% match</h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
