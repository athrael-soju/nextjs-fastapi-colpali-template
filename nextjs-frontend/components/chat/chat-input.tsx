"use client"

import { forwardRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Loader2, Sparkles } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  disabled: boolean
  isLoading: boolean
}

export const ChatInput = forwardRef<HTMLInputElement, ChatInputProps>(({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled,
  isLoading
}, ref) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-sm"
    >
      <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:border-orange-300 focus-within:border-orange-400 transition-all duration-200 shadow-lg">
        <CardContent className="p-0">
          <div className="flex items-end gap-4 p-4">
            <div className="flex-1">
              <Input
                ref={ref}
                placeholder="Ask me anything about your documents..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={onKeyPress}
                disabled={disabled}
                className="text-base resize-none border-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/70 min-h-[44px] py-3"
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onSend}
                  disabled={disabled || !value.trim()}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 h-11"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Send className="h-5 w-5" />
                    </motion.div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isLoading ? "Generating response..." : "Send message (Enter)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          Powered by advanced AI • Your data stays secure
        </p>
      </div>
    </motion.div>
  )
})

ChatInput.displayName = "ChatInput"
