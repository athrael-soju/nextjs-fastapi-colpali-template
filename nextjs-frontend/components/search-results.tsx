import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SearchResult {
  id: number
  document: string
  page: number
  score: number
  imageUrl: string
  thumbnailUrl: string
  snippet: string
  fullImageLoading?: boolean
  fullImageLoaded?: boolean
}

interface SearchResultsProps {
  results: SearchResult[]
}

export function SearchResults({ results: initialResults }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleViewImage = async (imageUrl: string, documentName: string) => {
    setSelectedImage({ url: imageUrl, title: documentName });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleDownload = async (imageUrl: string, documentName: string) => {
    try {
      setIsImageLoading(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentName.toLowerCase().replace(/\s+/g, '-')}-page-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsImageLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-gray-900">Search Results</h4>
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <Card key={result.id} className="border-gray-200 hover:shadow-lg transition-shadow group">
            <CardContent className="p-0">
              <div className="aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden relative">
                <div className="relative w-full h-full">
                  <Image
                    src={result.thumbnailUrl || result.imageUrl}
                    alt={`Thumbnail of page ${result.page}`}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => handleViewImage(result.imageUrl, result.document)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => handleDownload(result.imageUrl, result.document)}
                      disabled={isImageLoading}
                    >
                      {isImageLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-1" />
                      )}
                      Download
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{result.document}</h3>
                  <Badge variant="outline" className="text-xs">
                    Page {result.page}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {result.snippet || 'No text content available'}
                </p>
                
                <div className="flex items-center justify-between pt-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(result.score * 100)}% match
                  </Badge>
                  
                  <div className="text-xs text-gray-500">
                    Click the image to view or download
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>{selectedImage?.title}</DialogTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="relative w-full h-[70vh] bg-gray-100">
            {selectedImage && (
              <Image
                src={selectedImage.url}
                alt={selectedImage.title}
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
          
          <div className="flex justify-end p-4 border-t">
            <Button 
              onClick={() => selectedImage && handleDownload(selectedImage.url, selectedImage.title)}
              disabled={isImageLoading}
              className="flex items-center gap-2"
            >
              {isImageLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Full Resolution
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
