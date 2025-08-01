"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, CheckCircle, Database, Cloud, FileText, Trash2 } from "lucide-react"

interface MinioFile {
  id: number
  name: string
  size: string
  lastModified: string
  bucket: string
}

interface ManageTabProps {
  collectionStatus: string
  minioFiles: MinioFile[]
  onClearCollection: () => void
}

export function ManageTab({ collectionStatus, minioFiles, onClearCollection }: ManageTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Collection Information</h3>
          <p className="text-gray-600">Manage your document collection and storage</p>
        </div>
        <Button variant="outline" className="rounded-xl bg-transparent">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Info
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Status</h4>
                <p className="text-sm text-gray-600 capitalize">{collectionStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Vector Storage</h4>
                <p className="text-sm text-gray-600">Qdrant</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Cloud className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Object Storage</h4>
                <p className="text-sm text-gray-600">MinIO - localhost:9000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Total Files</h4>
                <p className="text-sm text-gray-600">
                  {minioFiles.length} files across {new Set(minioFiles.map((f) => f.bucket)).size} buckets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="bg-gray-200" />

      <div className="space-y-6">
        <h4 className="text-lg font-bold text-red-600">Danger Zone</h4>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-red-700">Clear All Data</CardTitle>
            <CardDescription className="text-red-600">
              This will permanently delete all indexed documents, images, and MinIO files. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={onClearCollection} className="w-full rounded-xl py-3 font-semibold">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Collection & MinIO Storage
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
