"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, RefreshCw } from "lucide-react"

interface IndexTabProps {
  isIndexing: boolean
  onFileUpload: () => void
}

export function IndexTab({ isIndexing, onFileUpload }: IndexTabProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload PDF Files</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select PDF documents to index with vision-language models and store in MinIO
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="space-y-2">
          <Label htmlFor="bucket" className="text-sm font-medium text-gray-700">
            MinIO Bucket
          </Label>
          <Input
            id="bucket"
            placeholder="documents"
            defaultValue="documents"
            className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prefix" className="text-sm font-medium text-gray-700">
            Object Prefix (Optional)
          </Label>
          <Input
            id="prefix"
            placeholder="pdfs/"
            className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer">
          <div className="w-16 h-16 gradient-card-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-gray-900">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500">Supports PDF files up to 10MB • Files will be stored in MinIO</p>
          </div>
          <Button className="mt-6 rounded-xl px-8 bg-transparent" variant="outline">
            Choose Files
          </Button>
        </div>
      </div>

      {isIndexing && (
        <Alert className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800 font-medium">
            Uploading to MinIO and indexing documents... This may take a few minutes.
          </AlertDescription>
        </Alert>
      )}

      <div className="max-w-2xl mx-auto">
        <Button
          onClick={onFileUpload}
          disabled={isIndexing}
          className="w-full rounded-xl py-6 text-lg font-semibold gradient-card-blue border-0 hover:shadow-lg transition-all"
          size="lg"
        >
          {isIndexing ? (
            <>
              <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-3" />
              Upload & Index Documents
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
