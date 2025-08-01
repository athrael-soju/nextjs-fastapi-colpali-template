import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Folder, HardDrive, Cloud, CheckCircle } from "lucide-react"
import { FileTable } from "@/components/file-table"

interface MinioFile {
  id: number
  name: string
  size: string
  lastModified: string
  bucket: string
}

interface StorageTabProps {
  storageUsed: number
  totalStorage: number
  minioFiles: MinioFile[]
  onDeleteFile: (fileId: number) => void
  onDownloadFile: (fileName: string) => void
}

export function StorageTab({ storageUsed, totalStorage, minioFiles, onDeleteFile, onDownloadFile }: StorageTabProps) {
  const storagePercentage = (storageUsed / totalStorage) * 100

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Storage Management</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          View and manage files stored in MinIO buckets
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" className="rounded-xl px-6">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Files
        </Button>
        <Button variant="outline" className="rounded-xl px-6">
          <Folder className="w-4 h-4 mr-2" />
          New Bucket
        </Button>
      </div>

      {/* File List */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-bold text-gray-900">Stored Files</CardTitle>
          <CardDescription>Manage files stored in MinIO buckets</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <FileTable files={minioFiles} onDeleteFile={onDeleteFile} onDownloadFile={onDownloadFile} />
        </CardContent>
      </Card>
    </div>
  )
}
