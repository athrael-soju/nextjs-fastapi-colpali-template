"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, X, CheckCircle, AlertCircle, ImageIcon, Database } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { indexDocumentsAction, getProgressStatusAction } from "./actions/colpali-action"

interface UploadedFile {
  id: string
  name: string
  size: number
  status: "pending" | "uploading" | "converting" | "indexing" | "storing" | "completed" | "error"
  progress: number
  currentStep: string
  indexedPages?: number | null
  error?: string
}

interface ProgressEvent {
  task_id: string
  status: string
  progress: number
  current_step: string
  total_files: number
  processed_files: number
  indexed_pages?: number | null
  error_message?: string
  timestamp: number
  type?: string // For heartbeat messages
}

interface ProgressStep {
  name: string
  description: string
  icon: React.ReactNode
}

const UPLOAD_STEPS: ProgressStep[] = [
  {
    name: "uploading",
    description: "Uploading PDF files",
    icon: <Upload className="h-4 w-4" />
  },
  {
    name: "converting",
    description: "Converting to images", 
    icon: <ImageIcon className="h-4 w-4" />
  },
  {
    name: "indexing",
    description: "Indexing in Qdrant",
    icon: <Database className="h-4 w-4" />
  },
  {
    name: "storing",
    description: "Storing in MinIO",
    icon: <FileText className="h-4 w-4" />
  }
]

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentTaskRef = useRef<string | null>(null)

  // Cleanup progress polling on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const trackProgress = async (taskId: string, fileIds: string[]) => {
    // Clear existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    currentTaskRef.current = taskId

    const pollProgress = async () => {
      try {
        const data = await getProgressStatusAction(taskId)
        
        // Update all files in this batch with the current progress
        setFiles((prev) => prev.map((f) => {
          if (fileIds.includes(f.id)) {
            return {
              ...f,
              status: data.status as UploadedFile['status'],
              progress: Math.round(data.progress || 0),
              currentStep: data.current_step || "Processing...",
              indexedPages: data.indexed_pages,
              error: data.error_message
            }
          }
          return f
        }))
        
        // Stop polling when completed or error
        if (data.status === 'completed' || data.status === 'error') {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          setIsUploading(false)
        }
      } catch (error) {
        console.error('Failed to get progress status:', error)
        
        // Mark files as error on API failure
        setFiles((prev) => prev.map((f) => {
          if (fileIds.includes(f.id)) {
            return {
              ...f,
              status: "error",
              error: "Failed to track progress"
            }
          }
          return f
        }))
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        setIsUploading(false)
      }
    }

    // Start polling immediately
    await pollProgress()
    
    // Continue polling every 2 seconds
    progressIntervalRef.current = setInterval(pollProgress, 2000)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (isUploading) return

    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "pending" as const,
      progress: 0,
      currentStep: "Preparing upload...",
    }))

    const fileIds = newFiles.map(f => f.id)
    setFiles((prev) => [...prev, ...newFiles])
    setIsUploading(true)

    try {
      // Start the indexing process
      const response = await indexDocumentsAction(acceptedFiles)
      
      if (response.status === "started") {
        // Track progress using SDK polling
        trackProgress(response.task_id, fileIds)
      } else {
        throw new Error(response.message || "Failed to start indexing")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setIsUploading(false)
      
      // Mark all new files as error
      setFiles((prev) => prev.map((f) => 
        fileIds.includes(f.id) 
          ? { ...f, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
          : f
      ))
    }
  }, [isUploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: true,
    disabled: isUploading
  })

  const removeFile = (fileId: string) => {
    if (isUploading) return
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getCurrentStepIcon = (status: string) => {
    const step = UPLOAD_STEPS.find(s => s.name === status)
    return step ? step.icon : <Upload className="h-4 w-4" />
  }

  return (
    <div className="p-8 h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold hf-text-gradient mb-2">Upload Documents</h1>
          <p className="text-muted-foreground">Upload PDF documents to index them for search with Qdrant and store in MinIO</p>
        </div>

        <Card className="hf-card mb-8">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                  : isUploading
                  ? "border-gray-300 bg-gray-50 dark:bg-gray-950/20 cursor-not-allowed opacity-50"
                  : "border-border hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`h-12 w-12 mx-auto mb-4 ${
                isUploading ? "text-gray-400" : "text-muted-foreground"
              }`} />
              {isDragActive ? (
                <p className="text-lg text-orange-600 dark:text-orange-400">Drop the files here...</p>
              ) : isUploading ? (
                <div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">Processing files...</p>
                  <p className="text-muted-foreground">Real-time progress tracking via Server-Sent Events</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-foreground mb-2">Drag & drop PDF files here, or click to select</p>
                  <p className="text-muted-foreground">Support for multiple PDF files with real-time progress</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card className="hf-card">
            <CardHeader>
              <CardTitle className="text-foreground">Upload Progress (Real-time)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 border border-border rounded-lg bg-card">
                    <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-card-foreground truncate">{file.name}</p>
                        <div className="flex items-center gap-2">
                          {file.status === "completed" && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Indexed {file.indexedPages ? `(${file.indexedPages} pages)` : ''}
                            </Badge>
                          )}
                          {file.status === "error" && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                          {file.status !== "completed" && file.status !== "error" && (
                            <Badge variant="secondary">
                              {getCurrentStepIcon(file.status)}
                              <span className="ml-1 capitalize">{file.status}</span>
                            </Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFile(file.id)}
                            disabled={isUploading && file.status !== "error" && file.status !== "completed"}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        <span>{formatFileSize(file.size)}</span>
                        <div className="flex items-center gap-2">
                          {file.status !== "completed" && file.status !== "error" && (
                            <span>{Math.round(file.progress)}%</span>
                          )}
                        </div>
                      </div>
                      {file.status !== "completed" && file.status !== "error" && (
                        <>
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            {getCurrentStepIcon(file.status)}
                            <span>{file.currentStep}</span>
                          </div>
                          <Progress value={file.progress} className="h-2" />
                        </>
                      )}
                      {file.error && <p className="text-sm text-red-600 mt-1">{file.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
