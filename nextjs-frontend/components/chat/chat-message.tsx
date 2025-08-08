"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  User, 
  Bot, 
  ImageIcon, 
  Download, 
  Eye,
  Copy,
  Check,
  RefreshCw
} from "lucide-react"
import type { ChatMessage } from "./types"

interface ChatMessageProps {
  message: ChatMessage
  index: number
  copiedMessageId: string | null
  isLoading: boolean
  onImageClick: (imageUrl: string) => void
  onDownloadImage: (imageUrl: string, content: string) => void
  onCopyMessage: (content: string, messageId: string) => void
  onRegenerateResponse: (index: number) => void
}

export function ChatMessageComponent({
  message,
  index,
  copiedMessageId,
  isLoading,
  onImageClick,
  onDownloadImage,
  onCopyMessage,
  onRegenerateResponse
}: ChatMessageProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.type === 'assistant' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Avatar className="w-10 h-10 border-2 border-orange-200 dark:border-orange-800">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
      
      <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : ''}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={`${
            message.type === 'user' 
              ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-white border-0' 
              : message.error 
                ? 'border-destructive/30 bg-destructive/5' 
                : 'bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90'
          } shadow-lg hover:shadow-xl transition-all duration-200`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="prose prose-sm dark:prose-invert max-w-none flex-1">
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyMessage(message.content, message.id)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy response</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRegenerateResponse(index)}
                          className="h-8 w-8 p-0"
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Regenerate response</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
              
              {message.images && message.images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 space-y-3"
                >
                  <Separator />
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Found {message.totalRetrieved} relevant images:
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {message.images.map((imageUrl, imageIndex) => (
                      <motion.div
                        key={imageIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * imageIndex }}
                        className="relative group"
                      >
                        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                          <img
                            src={imageUrl}
                            alt={`Retrieved document ${imageIndex + 1}`}
                            className="w-full h-32 object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                            onClick={() => onImageClick(imageUrl)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder.svg";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2">
                            <Badge variant="secondary" className="text-xs">
                              #{imageIndex + 1}
                            </Badge>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onImageClick(imageUrl)
                                    }}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View full size</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 w-7 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDownloadImage(imageUrl, message.content)
                                    }}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download image</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                {message.images && message.images.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {message.images.length} images analyzed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {message.type === 'user' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="order-3"
        >
          <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-800">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}
    </motion.div>
  )
}
