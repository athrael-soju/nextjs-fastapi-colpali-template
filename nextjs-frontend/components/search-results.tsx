import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Loader2, X, FileText, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"

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
  metadata?: {
    filename?: string
    size?: number
    last_modified?: string
    content_type?: string
  }
}

interface SearchResultsProps {
  results: SearchResult[]
}

export function SearchResults({ results: initialResults }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [selectedImage, setSelectedImage] = useState<{ 
    url: string; 
    title: string;
    metadata?: {
      filename?: string;
      size?: number;
      last_modified?: string;
    };
  } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleViewImage = async (result: SearchResult) => {
    setSelectedImage({ 
      url: result.imageUrl, 
      title: result.metadata?.filename || `Document ${result.id}`,
      metadata: result.metadata
    });
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <Card key={result.id} className="overflow-hidden transition-all hover:shadow-md h-full flex flex-col">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-medium line-clamp-1 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {result.metadata?.filename || `Document ${result.id}`}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {Math.round(result.score * 100)}%
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100 group">
                {result.thumbnailUrl ? (
                  <Image
                    src={result.thumbnailUrl}
                    alt={`Thumbnail for ${result.metadata?.filename || 'document'}`}
                    fill
                    className="object-cover transition-all group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <FileImage className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-all group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white/90 text-gray-900 hover:bg-white"
                    onClick={() => handleViewImage(result)}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-white/90 text-gray-900 hover:bg-white"
                    onClick={() => handleDownload(result.imageUrl, result.metadata?.filename || `document-${result.id}`)}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 pt-3">
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {result.snippet}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-none w-auto p-0 m-0 border-0 bg-transparent shadow-none">
          <DialogTitle className="sr-only">Document Preview</DialogTitle>
          <div className="relative">
            {selectedImage ? (
              <div className="relative max-h-[90vh] max-w-[90vw] flex items-center justify-center">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  width={1920}
                  height={1080}
                  className="max-h-[90vh] w-auto object-contain"
                  priority
                  unoptimized={selectedImage.url.endsWith('.pdf')}
                  onClick={handleCloseModal}
                />
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-64 h-64 bg-background/80 rounded-lg">
                <div className="text-center p-4">
                  <FileImage className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No image available</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
