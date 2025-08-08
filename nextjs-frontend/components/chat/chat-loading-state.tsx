"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Loader2 } from "lucide-react"

export function ChatLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 justify-start"
    >
      <Avatar className="w-10 h-10 border-2 border-orange-200 dark:border-orange-800">
        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-yellow-500 text-white">
          <Bot className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <Card className="bg-card/80 backdrop-blur-sm border-border/50 max-w-[85%]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-4 w-4 text-orange-500" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm text-foreground font-medium">
                AI is thinking...
              </span>
              <span className="text-xs text-muted-foreground">
                Analyzing your documents and generating a response
              </span>
            </div>
          </div>
          
          <motion.div 
            className="mt-3 h-1 bg-muted rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
