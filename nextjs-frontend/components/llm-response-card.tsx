import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Download, Sparkles } from "lucide-react"

interface LLMResponseCardProps {
  response: string
  isStreaming: boolean
}

export function LLMResponseCard({ response, isStreaming }: LLMResponseCardProps) {
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-card-purple rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-purple-900">AI Analysis</CardTitle>
            <CardDescription className="text-purple-700">
              {isStreaming ? "Analyzing search results..." : "Analysis complete"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isStreaming && (
          <div className="flex items-center gap-2 mb-4 text-purple-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Generating response...</span>
          </div>
        )}
        <div className="prose prose-purple max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {response}
            {isStreaming && <span className="animate-pulse">|</span>}
          </div>
        </div>
        {!isStreaming && response && (
          <div className="mt-4 pt-4 border-t border-purple-100">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-lg bg-transparent">
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
              <Button size="sm" variant="outline" className="rounded-lg bg-transparent">
                <Download className="w-4 h-4 mr-1" />
                Export Analysis
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
