"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { 
  Settings,
  Sparkles,
  Trash2,
  Brain,
  Search,
  AlertCircle,
  X
} from "lucide-react"
import type { ChatSettings } from "./types"

interface ChatHeaderProps {
  settings: ChatSettings
  onSettingsChange: (settings: ChatSettings) => void
  showSettings: boolean
  onShowSettingsChange: (show: boolean) => void
  onClearChat: () => void
  hasMessages: boolean
  error: string | null
  onErrorDismiss: () => void
}

export function ChatHeader({
  settings,
  onSettingsChange,
  showSettings,
  onShowSettingsChange,
  onClearChat,
  hasMessages,
  error,
  onErrorDismiss
}: ChatHeaderProps) {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative p-6 border-b border-border/50 bg-background/80 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-400/20 to-yellow-400/20"
              />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
            />
          </motion.div>
          
          <div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-700 bg-clip-text text-transparent flex items-center gap-3"
            >
              AI Document Assistant
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mt-1"
            >
              Intelligent conversations with your documents powered by advanced AI
            </motion.p>
          </div>
        </div>
        
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2"
        >
          <Sheet open={showSettings} onOpenChange={onShowSettingsChange}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Chat Settings
                </SheetTitle>
                <SheetDescription>
                  Customize your AI chat experience
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topk-chat" className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Retrieved Images per Query
                  </Label>
                  <Input
                    id="topk-chat"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.topK}
                    onChange={(e) => onSettingsChange({ ...settings, topK: Number(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values provide more context but may slow down responses
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearChat}
                  className="h-9 px-3"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all messages</TooltipContent>
            </Tooltip>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-destructive mb-1">Connection Error</h4>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onErrorDismiss}
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
