'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/shared/file-upload'
import { FilesList } from '@/components/shared/files-list'

type ProjectFilesTabProps = {
  projectId: string
}

export function ProjectFilesTab({ projectId }: ProjectFilesTabProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="space-y-6">
      <FileUpload
        projectId={projectId}
        onUploadComplete={() => setRefreshTrigger((prev) => prev + 1)}
      />
      <FilesList
        projectId={projectId}
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}
