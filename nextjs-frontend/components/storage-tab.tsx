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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">MinIO Storage Management</h3>
          <p className="text-gray-600">View and manage files stored in MinIO buckets</p>
        </div>
        <Button variant="outline" className="rounded-xl bg-transparent">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Storage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="gradient-card-pink text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Folder className="w-6 h-6 text-white/80" />
              <h4 className="font-semibold text-white/90">Buckets</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">documents</span>
                <Badge className="bg-white/20 text-white border-0">3 files</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">manuals</span>
                <Badge className="bg-white/20 text-white border-0">1 file</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">presentations</span>
                <Badge className="bg-white/20 text-white border-0">1 file</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card-orange text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-6 h-6 text-white/80" />
              <h4 className="font-semibold text-white/90">Storage Usage</h4>
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-bold">{storageUsed.toFixed(1)} GB</div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${storagePercentage}%` }} />
              </div>
              <p className="text-sm text-white/70">{(totalStorage - storageUsed).toFixed(1)} GB available</p>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card-purple text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-6 h-6 text-white/80" />
              <h4 className="font-semibold text-white/90">Connection</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="font-medium">Connected</span>
              </div>
              <p className="text-sm text-white/70">Endpoint: localhost:9000</p>
            </div>
          </CardContent>
        </Card>
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
