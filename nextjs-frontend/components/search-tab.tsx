"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Search, RefreshCw, Sparkles } from "lucide-react"
import { SearchResults } from "@/components/search-results"
import { LLMResponseCard } from "@/components/llm-response-card"
import { colpaliService } from "@/lib/colpali"
import type { SearchResult as BackendSearchResult } from "@/app/clientService"

interface SearchResult {
  id: number
  document: string
  page: number
  score: number
  imageUrl: string
  snippet: string
}

interface SearchTabProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function SearchTab({ searchQuery, setSearchQuery }: SearchTabProps) {
  const [enableLLMResponse, setEnableLLMResponse] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [llmResponse, setLlmResponse] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log("Searching for:", searchQuery)
    setIsSearching(true)
    setSearchResults([])
    setLlmResponse("")

    try {
      // Call the actual ColPali backend service
      const response = await colpaliService.searchDocuments(searchQuery, 5)
      
      // Transform backend results to match our UI format
      const transformedResults: SearchResult[] = (response.results || []).map((result: BackendSearchResult, index: number) => {
        // Construct full image URL with API base URL
        const baseURL = process.env.API_BASE_URL || "http://localhost:8000";
        const fullImageUrl = result.image_url ? `${baseURL}${result.image_url}` : "/placeholder.svg?height=300&width=400";
        
        return {
          id: index + 1,
          document: `Document ${index + 1}`,
          page: result.rank,
          score: 0.95 - (index * 0.1), // Mock score for now
          imageUrl: fullImageUrl,
          snippet: result.page_info || "No preview available"
        };
      })

      setSearchResults(transformedResults)
      setIsSearching(false)

      // If LLM response is enabled, process the results
      if (enableLLMResponse) {
        // Use the AI response from the backend if available, otherwise generate our own
        if (response.ai_response) {
          streamLLMResponse(response.ai_response)
        } else {
          generateLLMResponse(transformedResults)
        }
      }
    } catch (error) {
      console.error("Search failed:", error)
      setIsSearching(false)
      // Handle error appropriately in UI
    }
  }

  const streamLLMResponse = async (responseText: string) => {
    setIsStreaming(true)
    setLlmResponse("")

    // Stream the response character by character
    for (let i = 0; i <= responseText.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      setLlmResponse(responseText.slice(0, i))
    }

    setIsStreaming(false)
  }

  const generateLLMResponse = async (results: SearchResult[]) => {
    setIsStreaming(true)
    setLlmResponse("")

    // Generate LLM response based on actual search results
    const fullResponse = `Based on the search results, I found ${results.length} relevant documents that match your query. Here's what I can tell you:

${results.map((result, index) => `${index + 1}. **${result.document}** (Page ${result.page}): ${result.snippet}`).join('\n\n')}

These documents seem to be relevant to your query. Would you like me to elaborate on any specific aspect of these findings?`

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
      
      {/* No Results Message */}
      {searchResults.length === 0 && !isSearching && searchQuery && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No results found</h4>
            <p className="text-gray-600">Try refining your search query or check if documents are indexed.</p>
          </div>
        </div>
      )}
    </div>
  )
}
