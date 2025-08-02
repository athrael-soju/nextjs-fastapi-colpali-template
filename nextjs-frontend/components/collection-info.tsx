"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Database,
  FileText,
  HardDrive,
  Activity,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Server,
  Zap,
  BarChart3,
  Clock,
} from "lucide-react"

interface CollectionStats {
  total_documents: number
  total_pages: number
  collection_size: string
  last_updated: string
  status: "healthy" | "warning" | "error"
  indexing_progress: number
  qdrant_info: {
    collection_name: string
    vectors_count: number
    indexed_vectors_count: number
    points_count: number
    status: string
    memory_usage: string
    disk_usage: string
  }
  minio_info: {
    bucket_name: string
    objects_count: number
    bucket_size: string
    endpoint: string
    bandwidth_usage: string
    requests_count: number
  }
}

export function CollectionInfo() {
  const [stats, setStats] = useState<CollectionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [isClearingBucket, setIsClearingBucket] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchCollectionInfo()
  }, [])

  const fetchCollectionInfo = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setStats({
        total_documents: 24,
        total_pages: 1247,
        collection_size: "2.3 GB",
        last_updated: "2024-01-15T10:30:00Z",
        status: "healthy",
        indexing_progress: 95,
        qdrant_info: {
          collection_name: "colpali_documents",
          vectors_count: 1247,
          indexed_vectors_count: 1184,
          points_count: 1247,
          status: "healthy",
          memory_usage: "1.2 GB",
          disk_usage: "850 MB",
        },
        minio_info: {
          bucket_name: "colpali-documents",
          objects_count: 1247,
          bucket_size: "2.1 GB",
          endpoint: "minio.example.com:9000",
          bandwidth_usage: "45.2 MB",
          requests_count: 2847,
        },
      })
      setIsLoading(false)
    }, 1000)
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchCollectionInfo()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const clearCollection = async () => {
    setIsClearing(true)
    setTimeout(() => {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              total_documents: 0,
              total_pages: 0,
              collection_size: "0 B",
              last_updated: new Date().toISOString(),
              indexing_progress: 0,
              qdrant_info: {
                ...prev.qdrant_info,
                vectors_count: 0,
                indexed_vectors_count: 0,
                points_count: 0,
                memory_usage: "0 MB",
                disk_usage: "0 MB",
              },
              minio_info: {
                ...prev.minio_info,
                objects_count: 0,
                bucket_size: "0 B",
                bandwidth_usage: "0 MB",
                requests_count: 0,
              },
            }
          : null,
      )
      setIsClearing(false)
    }, 2000)
  }

  const clearBucket = async () => {
    setIsClearingBucket(true)
    setTimeout(() => {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              minio_info: {
                ...prev.minio_info,
                objects_count: 0,
                bucket_size: "0 B",
                bandwidth_usage: "0 MB",
                requests_count: 0,
              },
            }
          : null,
      )
      setIsClearingBucket(false)
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "from-green-500 to-emerald-500"
      case "warning":
        return "from-yellow-500 to-orange-500"
      case "error":
        return "from-red-500 to-pink-500"
      default:
        return "from-gray-500 to-slate-500"
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 h-full overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-orange-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-orange-100 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-orange-100 rounded-2xl"></div>
              <div className="h-64 bg-orange-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 h-full overflow-auto bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
              Collection Overview
            </h1>
            <p className="text-gray-600 text-lg">Monitor your document collection and system health</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              variant="outline"
              className="border-orange-200 hover:bg-orange-50 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-100">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Last updated: {stats ? formatDate(stats.last_updated) : "Never"}
              </span>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {stats && (
          <Card className="bg-card border border-border shadow-sm rounded-xl hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(stats.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                    <p className="text-gray-600">All services are running smoothly</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`bg-gradient-to-r ${getStatusColor(stats.status)} text-white border-0`}>
                    {stats.status.toUpperCase()}
                  </Badge>
                  {stats.indexing_progress < 100 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Indexing Progress</p>
                      <Progress value={stats.indexing_progress} className="w-32" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border border-border shadow-sm rounded-xl hover:shadow-xl hover:shadow-orange-200/30 dark:hover:shadow-orange-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Documents</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stats?.total_documents.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total indexed</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm rounded-xl hover:shadow-xl hover:shadow-orange-200/30 dark:hover:shadow-orange-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pages</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {stats?.total_pages.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Searchable pages</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm rounded-xl hover:shadow-xl hover:shadow-orange-200/30 dark:hover:shadow-orange-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Storage</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {stats?.collection_size}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total size</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                  <HardDrive className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border shadow-sm rounded-xl hover:shadow-xl hover:shadow-orange-200/30 dark:hover:shadow-orange-900/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Vectors</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats?.qdrant_info.vectors_count.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Indexed vectors</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Qdrant Information */}
          {stats?.qdrant_info && (
            <Card className="bg-card border border-border shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Vector Database</h3>
                    <p className="text-sm text-gray-600 font-normal">Qdrant Collection Status</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-600">Collection</p>
                    <p className="text-lg font-semibold text-gray-900 truncate">{stats.qdrant_info.collection_name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge
                      className={`mt-1 ${stats.qdrant_info.status === "healthy" ? "bg-green-500" : "bg-red-500"} text-white border-0`}
                    >
                      {stats.qdrant_info.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Vectors</span>
                    <span className="font-semibold">{stats.qdrant_info.vectors_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Points</span>
                    <span className="font-semibold">{stats.qdrant_info.points_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Memory Usage</span>
                    <span className="font-semibold">{stats.qdrant_info.memory_usage}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Disk Usage</span>
                    <span className="font-semibold">{stats.qdrant_info.disk_usage}</span>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-transparent"
                      disabled={stats.qdrant_info.vectors_count === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Vector Database
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Vector Database?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {stats.qdrant_info.vectors_count.toLocaleString()} vectors from
                        the "{stats.qdrant_info.collection_name}" collection. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearCollection}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isClearing}
                      >
                        {isClearing ? "Clearing..." : "Clear Database"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {/* MinIO Information */}
          {stats?.minio_info && (
            <Card className="bg-card border border-border shadow-sm rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Server className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Object Storage</h3>
                    <p className="text-sm text-gray-600 font-normal">MinIO Bucket Status</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-600">Bucket</p>
                    <p className="text-lg font-semibold text-gray-900 truncate">{stats.minio_info.bucket_name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className="mt-1 bg-green-500 text-white border-0">healthy</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Objects</span>
                    <span className="font-semibold">{stats.minio_info.objects_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Storage Size</span>
                    <span className="font-semibold">{stats.minio_info.bucket_size}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Bandwidth</span>
                    <span className="font-semibold">{stats.minio_info.bandwidth_usage}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Requests</span>
                    <span className="font-semibold">{stats.minio_info.requests_count.toLocaleString()}</span>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-transparent"
                      disabled={stats.minio_info.objects_count === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Storage Bucket
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Storage Bucket?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {stats.minio_info.objects_count.toLocaleString()} objects from
                        the "{stats.minio_info.bucket_name}" bucket. The indexed vectors will remain intact.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={clearBucket}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isClearingBucket}
                      >
                        {isClearingBucket ? "Clearing..." : "Clear Bucket"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
