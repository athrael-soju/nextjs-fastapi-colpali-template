"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, RefreshCw, Database, Check } from "lucide-react"

interface IndexTabProps {
  isIndexing: boolean
  onFileUpload: () => void
  files: File[]
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  message: string
}

export function IndexTab({ isIndexing, onFileUpload, files, onFileSelect, message }: IndexTabProps) {
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

      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        multiple
        accept=".pdf"
        onChange={onFileSelect}
        className="hidden"
      />

      <div className="max-w-2xl mx-auto">
        <div 
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {files.length > 0 ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-gray-900">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="text-sm text-gray-600 truncate">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">Click to select different files</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 gradient-card-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-3">
                <p className="text-lg font-semibold text-gray-900">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500">Supports PDF files up to 10MB • Files will be stored in MinIO</p>
              </div>
              <Button 
                className="mt-6 rounded-xl px-8 bg-transparent" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('file-input')?.click();
                }}
              >
                Choose Files
              </Button>
            </>
          )}
        </div>
      </div>

      {isIndexing && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium">
              Uploading to MinIO and indexing documents... This may take a few minutes.
            </AlertDescription>
          </Alert>
          
          {/* Progress indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Uploading to MinIO</p>
              <p className="text-xs text-gray-500">In progress...</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Database className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Indexing in Qdrant</p>
              <p className="text-xs text-gray-500">Pending...</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">Processing Complete</p>
              <p className="text-xs text-gray-500">Pending...</p>
            </div>
          </div>
        </div>
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
