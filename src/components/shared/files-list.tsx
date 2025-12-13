'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FileIcon, Download, Trash2, Image, FileText, Film, Music } from 'lucide-react'
import { formatFileSize, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

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

type FilesListProps = {
  projectId: string
  refreshTrigger?: number
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Film
  if (type.startsWith('audio/')) return Music
  if (type.includes('pdf')) return FileText
  return FileIcon
}

export function FilesList({ projectId, refreshTrigger }: FilesListProps) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch(`/api/files?projectId=${projectId}`)
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
  }, [projectId, refreshTrigger])

  async function handleDelete(fileId: string) {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      toast.success('File deleted')
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading files...</div>
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const Icon = getFileIcon(file.type)
        return (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Icon className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.size)} • Uploaded by {file.uploadedBy.name || file.uploadedBy.email} • {formatDate(file.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
