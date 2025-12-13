'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileIcon, Download, Image, FileText, Film, Music } from 'lucide-react'
import { formatFileSize, formatDate } from '@/lib/utils'

type File = {
  id: string
  name: string
  url: string
  size: number
  type: string
  createdAt: string
  uploadedBy: {
    name: string | null
    email: string
  }
}

type PortalFilesListProps = {
  projectId: string
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Film
  if (type.startsWith('audio/')) return Music
  if (type.includes('pdf')) return FileText
  return FileIcon
}

export function PortalFilesList({ projectId }: PortalFilesListProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch(`/api/portal/files?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          setFiles(data)
        }
      } catch (error) {
        console.error('Error fetching files:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [projectId])

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading files...</div>
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files shared yet
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const Icon = getFileIcon(file.type)
        const isImage = file.type.startsWith('image/')

        return (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4">
              {isImage ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-gray-500" />
                </div>
              )}
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • Shared by {file.uploadedBy.name || file.uploadedBy.email} • {formatDate(file.createdAt)}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        )
      })}
    </div>
  )
}
