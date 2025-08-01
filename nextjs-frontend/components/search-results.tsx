import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Download } from "lucide-react"

interface SearchResult {
  id: number
  document: string
  page: number
  score: number
  imageUrl: string
  snippet: string
}

interface SearchResultsProps {
  results: SearchResult[]
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900">Search Results</h4>
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          {results.length} results found
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <Card key={result.id} className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
                <img
                  src={result.imageUrl || "/placeholder.svg"}
                  alt={`Page ${result.page} from ${result.document}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    Page {result.page}
                  </Badge>
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {(result.score * 100).toFixed(0)}% match
                  </Badge>
                </div>
                <h5 className="font-semibold text-gray-900 truncate">{result.document}</h5>
                <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg bg-transparent">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-lg bg-transparent">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
