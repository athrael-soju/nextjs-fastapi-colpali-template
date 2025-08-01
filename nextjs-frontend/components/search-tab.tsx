"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Search, RefreshCw, Sparkles } from "lucide-react"
import { SearchResults } from "@/components/search-results"
import { LLMResponseCard } from "@/components/llm-response-card"

interface SearchTabProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function SearchTab({ searchQuery, setSearchQuery }: SearchTabProps) {
  const [enableLLMResponse, setEnableLLMResponse] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [llmResponse, setLlmResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSearch = async () => {
    console.log("Searching for:", searchQuery)
    setIsSearching(true)
    setSearchResults([])
    setLlmResponse("")

    // Simulate search results with images
    setTimeout(() => {
      const mockResults = [
        {
          id: 1,
          document: "financial_report_q3.pdf",
          page: 2,
          score: 0.95,
          imageUrl: "/placeholder.svg?height=300&width=400",
          snippet: "Q3 revenue increased by 23% compared to previous quarter",
        },
        {
          id: 2,
          document: "product_catalog.pdf",
          page: 5,
          score: 0.87,
          imageUrl: "/placeholder.svg?height=300&width=400",
          snippet: "Product comparison showing features and pricing tiers",
        },
        {
          id: 3,
          document: "presentation_slides.pdf",
          page: 12,
          score: 0.82,
          imageUrl: "/placeholder.svg?height=300&width=400",
          snippet: "Market analysis presentation with growth projections",
        },
      ]

      setSearchResults(mockResults)
      setIsSearching(false)

      // If LLM response is enabled, process the results
      if (enableLLMResponse) {
        generateLLMResponse(mockResults)
      }
    }, 2000)
  }

  const generateLLMResponse = async (results) => {
    setIsStreaming(true)
    setLlmResponse("")

    // Simulate streaming LLM response
    const fullResponse = `Based on the search results, I found ${results.length} relevant documents that match your query. Here's what I can tell you:

1. **Financial Report Q3** (Score: ${results[0]?.score}): The document shows strong Q3 performance with revenue growth of 23% compared to the previous quarter. This indicates positive business momentum.

2. **Product Catalog** (Score: ${results[1]?.score}): Contains detailed product comparisons with pricing information, which could be useful for understanding your product positioning and competitive landscape.

3. **Presentation Slides** (Score: ${results[2]?.score}): Includes market analysis with growth projections, providing insights into future business opportunities.

The visual content in these documents suggests a focus on data-driven decision making and comprehensive business analysis. Would you like me to elaborate on any specific aspect of these findings?`

    // Stream the response character by character
    for (let i = 0; i <= fullResponse.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      setLlmResponse(fullResponse.slice(0, i))
    }

    setIsStreaming(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Search Documents</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Enter your search query to find relevant documents and images stored in MinIO
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Textarea
          placeholder="Enter your search query... (e.g., 'financial reports from Q3' or 'charts showing revenue growth')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-[120px] rounded-2xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-lg p-6"
        />

        {/* LLM Response Toggle */}
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">AI-Powered Analysis</h4>
                </div>
                <p className="text-sm text-purple-700">
                  Enable LLM to analyze search results and provide intelligent insights
                </p>
              </div>
              <Switch
                checked={enableLLMResponse}
                onCheckedChange={setEnableLLMResponse}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSearch}
          className="w-full rounded-xl py-6 text-lg font-semibold gradient-card-green border-0 hover:shadow-lg transition-all"
          size="lg"
          disabled={!searchQuery.trim() || isSearching}
        >
          {isSearching ? (
            <>
              <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-3" />
              Search Documents
            </>
          )}
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <SearchResults results={searchResults} />

          {/* LLM Response Section */}
          {enableLLMResponse && <LLMResponseCard response={llmResponse} isStreaming={isStreaming} />}
        </div>
      )}
    </div>
  )
}
