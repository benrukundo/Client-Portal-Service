'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type Workspace = {
  id: string
  name: string
  slug: string
  brandColor: string | null
  logo: string | null
}

type WorkspaceContextType = {
  workspace: Workspace | null
  setWorkspace: (workspace: Workspace) => void
  refreshWorkspace: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({
  children,
  initialWorkspace
}: {
  children: ReactNode
  initialWorkspace: Workspace | null
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace)

  const refreshWorkspace = useCallback(async () => {
    if (!workspace?.id) return

    try {
      const response = await fetch(`/api/workspaces/${workspace.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorkspace(data)
      }
    } catch (error) {
      console.error('Failed to refresh workspace:', error)
    }
  }, [workspace?.id])

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, refreshWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
