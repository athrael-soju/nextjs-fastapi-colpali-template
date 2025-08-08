"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  ImageIcon, 
  Download, 
  AlertCircle, 
  X,
  Loader2,
  Settings
} from "lucide-react"
import { conversationalChatAction } from "@/components/actions/colpali-action"
import type { ConversationResponse } from "@/app/clientService"

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  images?: string[]
  totalRetrieved?: number
  error?: boolean
}

interface RetrievedImage {
  url: string
  name: string
}

export function DocumentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [topK, setTopK] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Handle ESC key to close image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [selectedImage])

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage("")
    setIsLoading(true)
    setError(null)

    try {
      const response: ConversationResponse = await conversationalChatAction(
        userMessage.content,
        topK
      )

      if (response.status === "error") {
        throw new Error(response.message || "Chat request failed")
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: 'assistant',
        content: response.response || "I couldn't generate a response.",
        timestamp: new Date(),
        images: response.retrieved_images || [],
        totalRetrieved: response.total_retrieved || 0,
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error("Chat error:", err)
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      
      const errorAssistantMessage: ChatMessage = {
        id: `assistant_error_${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        error: true,
      }

      setMessages(prev => [...prev, errorAssistantMessage])
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl)
  }

  const handleDownloadImage = async (imageUrl: string, messageMd: string) => {
    try {
      const response = await fetch(imageUrl, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Generate filename from URL or use default
      const urlParts = imageUrl.split('/')
      const filename = urlParts[urlParts.length - 1] || `chat_image_${Date.now()}.png`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold hf-text-gradient mb-2 flex items-center gap-3">
              <MessageSquare className="h-8 w-8" />
              AI Chat
            </h1>
            <p className="text-muted-foreground">
              Chat with your documents using AI. Ask questions and get intelligent responses based on your indexed content.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-8"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="h-8"
              >
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mt-4 hf-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topk-chat" className="text-sm font-medium">
                    Images per query:
                  </Label>
                  <Input
                    id="topk-chat"
                    type="number"
                    min="1"
                    max="20"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="w-20 h-8"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Number of relevant images to retrieve and analyze for each question
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">Chat Error</h4>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Start a conversation</h3>
            <p className="text-muted-foreground max-w-md">
              Ask questions about your indexed documents. I'll search through your collection and provide detailed answers based on the relevant content.
            </p>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p>• "What are the main topics in document X?"</p>
              <p>• "Show me charts about revenue trends"</p>
              <p>• "Summarize the key findings"</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.type === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            
            <div className={`max-w-[70%] ${message.type === 'user' ? 'order-2' : ''}`}>
              <Card className={`hf-card ${message.error ? 'border-red-300 dark:border-red-700' : ''}`}>
                <CardContent className="p-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.images && message.images.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <Separator />
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {message.totalRetrieved} relevant images found:
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {message.images.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Retrieved image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleImageClick(imageUrl)}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleImageClick(imageUrl)
                                  }}
                                >
                                  <ImageIcon className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadImage(imageUrl, message.content)
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="absolute top-2 right-2 text-xs bg-white/90 text-gray-700 dark:bg-black/90 dark:text-gray-300"
                            >
                              {index + 1}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.images && message.images.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {message.images.length} images
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0 order-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>
            <Card className="hf-card max-w-[70%]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking and analyzing your documents...
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border">
        <Card className="hf-card">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  placeholder="Ask a question about your documents..."
                  value={currentMessage}
                  onChange={(e) => {
                    setCurrentMessage(e.target.value)
                    if (error) setError(null)
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="text-base resize-none border-0 focus-visible:ring-0 bg-transparent"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !currentMessage.trim()}
                className="hf-button px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
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
              src={selectedImage}
              alt="Full size image"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
