import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Database, HardDrive, Cloud } from "lucide-react"

interface StatsCardsProps {
  indexedDocs: number
  indexedImages: number
  storageUsed: number
  totalStorage: number
}

export function StatsCards({ indexedDocs, indexedImages, storageUsed, totalStorage }: StatsCardsProps) {
  const storagePercentage = (storageUsed / totalStorage) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="gradient-card-blue text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="h-8 w-8 text-white/80" />
            <Badge className="bg-white/20 text-white border-0 font-medium">Running</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">Indexed Documents</h3>
            <div className="text-3xl font-bold">{indexedDocs}</div>
            <p className="text-sm text-white/70">+2 from last week</p>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card-green text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Database className="h-8 w-8 text-white/80" />
            <Badge className="bg-white/20 text-white border-0 font-medium">Active</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">Indexed Images</h3>
            <div className="text-3xl font-bold">{indexedImages}</div>
            <p className="text-sm text-white/70">+8 from last week</p>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card-orange text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <HardDrive className="h-8 w-8 text-white/80" />
            <Badge className="bg-white/20 text-white border-0 font-medium">{storagePercentage.toFixed(0)}%</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">Storage Used</h3>
            <div className="text-3xl font-bold">{storageUsed.toFixed(1)} GB</div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${storagePercentage}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gradient-card-purple text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Cloud className="h-8 w-8 text-white/80" />
            <Badge className="bg-white/20 text-white border-0 font-medium">Online</Badge>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-white/90">MinIO Status</h3>
            <div className="text-3xl font-bold">Connected</div>
            <p className="text-sm text-white/70">3 buckets active</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
