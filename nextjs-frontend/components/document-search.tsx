"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, ImageIcon, Download, Bot, User, Send } from "lucide-react"

interface SearchResult {
  id: string
  score: number
  document_name: string
  page_number: number
  image_id: string
  image_url: string
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

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)

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

    // Simulate API call with topK results
    setTimeout(() => {
      const mockResults: SearchResult[] = Array.from({ length: topK }, (_, i) => ({
        id: `result_${i + 1}`,
        score: 0.95 - i * 0.05,
        document_name: [
          "Research Paper - AI in Healthcare",
          "Technical Manual - System Architecture",
          "Financial Report Q3 2024",
          "Product Specification Document",
          "User Guide - Advanced Features",
        ][i % 5],
        page_number: Math.floor(Math.random() * 20) + 1,
        image_id: `img_${i + 1}`,
        image_url: `/placeholder.svg?height=400&width=300&query=document page ${i + 1}`,
      }))

      setResults(mockResults)
      setIsSearching(false)

      // Generate LLM response if enabled
      if (llmEnabled) {
        setIsGenerating(true)
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: `Based on your search for "${query}", I found ${topK} relevant document pages. The most relevant result is from "${mockResults[0].document_name}" on page ${mockResults[0].page_number} with a ${Math.round(mockResults[0].score * 100)}% match. This document appears to contain information directly related to your query. Would you like me to analyze any specific aspect of these results?`,
            timestamp: new Date(),
            images: mockResults,
          }
          setChatMessages((prev) => [...prev, assistantMessage])
          setIsGenerating(false)
        }, 2000)
      }
    }, 1500)
  }

  const handleSendMessage = () => {
    if (!query.trim()) return
    handleSearch()
    setQuery("")
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
                            className={`rounded-lg p-4 ${
                              message.type === "user"
                                ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white ml-auto"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          {message.images && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                              {message.images.map((result) => (
                                <div key={result.id} className="relative group">
                                  <img
                                    src={result.image_url || "/placeholder.svg"}
                                    alt={`${result.document_name} - Page ${result.page_number}`}
                                    className="w-full h-32 object-cover rounded-lg border border-border"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center text-white text-xs p-2">
                                      <p className="font-medium">{result.document_name}</p>
                                      <p>Page {result.page_number}</p>
                                      <Badge variant="secondary" className="mt-1">
                                        {Math.round(result.score * 100)}%
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
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
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="text-lg"
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={isSearching || !query.trim()} className="hf-button">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="text-lg"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="hf-button px-8">
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
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
                        src={result.image_url || "/placeholder.svg"}
                        alt={`${result.document_name} - Page ${result.page_number}`}
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 bg-white/90 text-green-600 border-green-600 dark:bg-black/90 dark:text-green-400"
                      >
                        {Math.round(result.score * 100)}% match
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-card-foreground line-clamp-2">
                        {result.document_name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Page {result.page_number}</span>
                        <Badge variant="outline" className="text-xs">
                          ID: {result.image_id}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
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
      </div>
    </div>
  )
}
