"use client"

import { useState, useRef, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { conversationalChatAction } from "@/components/actions/colpali-action"
import type { ConversationResponse } from "@/app/clientService"

// Import our refactored components
import { 
  ChatHeader, 
  ChatEmptyState, 
  ChatLoadingState, 
  ChatMessageComponent, 
  ChatInput, 
  ImageModal,
  type ChatMessage, 
  type ChatSettings 
} from "./chat"

export function DocumentChat() {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<ChatSettings>({ topK: 5 })
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  // Refs
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

  // Message handling
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
        settings.topK
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

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const regenerateResponse = async (messageIndex: number) => {
    if (messageIndex === 0) return
    
    const userMessage = messages[messageIndex - 1]
    if (userMessage.type !== 'user') return

    // Remove the assistant message and regenerate
    const newMessages = messages.slice(0, messageIndex)
    setMessages(newMessages)
    setIsLoading(true)
    setError(null)

    try {
      const response: ConversationResponse = await conversationalChatAction(
        userMessage.content,
        settings.topK
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
      console.error("Regeneration error:", err)
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
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20">
        <ChatHeader
          settings={settings}
          onSettingsChange={setSettings}
          showSettings={showSettings}
          onShowSettingsChange={setShowSettings}
          onClearChat={clearChat}
          hasMessages={messages.length > 0}
          error={error}
          onErrorDismiss={() => setError(null)}
        />

        <ScrollArea className="flex-1 px-6 chat-scrollbar">
          <div className="py-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.length === 0 && <ChatEmptyState />}

              {messages.map((message, index) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  index={index}
                  copiedMessageId={copiedMessageId}
                  isLoading={isLoading}
                  onImageClick={handleImageClick}
                  onDownloadImage={handleDownloadImage}
                  onCopyMessage={copyToClipboard}
                  onRegenerateResponse={regenerateResponse}
                />
              ))}

              {isLoading && <ChatLoadingState />}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <ChatInput
          ref={inputRef}
          value={currentMessage}
          onChange={(value) => {
            setCurrentMessage(value)
            if (error) setError(null)
          }}
          onSend={handleSendMessage}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          isLoading={isLoading}
        />

        <ImageModal
          selectedImage={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={(imageUrl, content) => handleDownloadImage(imageUrl, content || "")}
        />
      </div>
    </TooltipProvider>
  )
}
