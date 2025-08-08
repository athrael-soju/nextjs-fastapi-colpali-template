"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Zap, ImageIcon } from "lucide-react"

export function ChatEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full text-center py-20"
    >
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative mb-8"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 flex items-center justify-center shadow-xl">
          <MessageSquare className="h-10 w-10 text-white" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/30 to-yellow-400/30 blur-lg"
        />
      </motion.div>
      
      <h3 className="text-2xl font-bold text-foreground mb-3">Ready to Chat!</h3>
      <p className="text-muted-foreground max-w-md mb-8 text-lg">
        Ask me anything about your documents. I'll analyze them and provide detailed, intelligent responses.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        {[
          { icon: Search, text: "Search through document content", color: "from-blue-500 to-cyan-500" },
          { icon: Zap, text: "Get instant AI-powered insights", color: "from-purple-500 to-pink-500" },
          { icon: ImageIcon, text: "Analyze charts and visuals", color: "from-green-500 to-emerald-500" },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className="p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200"
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">{item.text}</p>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-8 text-sm text-muted-foreground space-y-1">
        <p className="flex items-center justify-center gap-2">
          <span>Try:</span>
          <Badge variant="secondary" className="text-xs">What's in document X?</Badge>
        </p>
        <p className="flex items-center justify-center gap-2">
          <span>Or:</span>
          <Badge variant="secondary" className="text-xs">Show me revenue charts</Badge>
        </p>
      </div>
    </motion.div>
  )
}
