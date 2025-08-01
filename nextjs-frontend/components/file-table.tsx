"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download, Eye, Trash2 } from "lucide-react"

interface MinioFile {
  id: number
  name: string
  size: string
  lastModified: string
  bucket: string
}

interface FileTableProps {
  files: MinioFile[]
  onDeleteFile: (fileId: number) => void
  onDownloadFile: (fileName: string) => void
}

export function FileTable({ files, onDeleteFile, onDownloadFile }: FileTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-100">
          <TableHead className="font-semibold text-gray-700">Name</TableHead>
          <TableHead className="font-semibold text-gray-700">Bucket</TableHead>
          <TableHead className="font-semibold text-gray-700">Size</TableHead>
          <TableHead className="font-semibold text-gray-700">Last Modified</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id} className="border-gray-100 hover:bg-gray-50/50">
            <TableCell className="font-medium text-gray-900">{file.name}</TableCell>
            <TableCell>
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                {file.bucket}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-600">{file.size}</TableCell>
            <TableCell className="text-gray-600">{file.lastModified}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-lg">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => onDownloadFile(file.name)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDeleteFile(file.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
