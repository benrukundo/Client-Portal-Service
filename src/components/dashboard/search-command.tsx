'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  FolderKanban, 
  FileText, 
  File, 
  Search,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getStatusColor, getStatusLabel } from '@/lib/constants'

type SearchResult = {
  id: string
  type: 'client' | 'project' | 'file' | 'invoice'
  title: string
  subtitle: string
  description: string
  meta: string
  url: string
  fileUrl?: string
}

type SearchResults = {
  clients: SearchResult[]
  projects: SearchResult[]
  files: SearchResult[]
  invoices: SearchResult[]
  total: number
}

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Search when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (!query || query.length < 2) {
        setResults(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults(null)
    }
  }, [open])

  const handleSelect = (url: string) => {
    console.log('Navigating to:', url)
    setOpen(false)
    setTimeout(() => {
      router.push(url)
    }, 100)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'project':
        return <FolderKanban className="h-4 w-4 text-purple-500" />
      case 'file':
        return <File className="h-4 w-4 text-green-500" />
      case 'invoice':
        return <FileText className="h-4 w-4 text-orange-500" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const hasResults = results && results.total > 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full max-w-sm px-3 py-2 text-sm text-muted-foreground bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-2xl">
          <VisuallyHidden>
            <DialogTitle>Search</DialogTitle>
          </VisuallyHidden>
          
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <Input
              placeholder="Search clients, projects, files, invoices..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
              autoFocus
            />
          </div>
          
          <div className="max-h-[400px] overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {!loading && query.length >= 2 && !hasResults && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {!loading && hasResults && (
              <div className="space-y-4">
                {results.clients.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Clients
                    </div>
                    {results.clients.map((result) => (
                      <div
                        key={`client-${result.id}`}
                        onClick={() => handleSelect(result.url)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.meta}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {results.projects.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Projects
                    </div>
                    {results.projects.map((result) => (
                      <div
                        key={`project-${result.id}`}
                        onClick={() => handleSelect(result.url)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <Badge className={getStatusColor(result.meta)} variant="secondary">
                          {getStatusLabel(result.meta)}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {results.files.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Files
                    </div>
                    {results.files.map((result) => (
                      <div
                        key={`file-${result.id}`}
                        onClick={() => handleSelect(result.url)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle} • {result.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{result.meta}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {results.invoices.length > 0 && (
                  <div>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Invoices
                    </div>
                    {results.invoices.map((result) => (
                      <div
                        key={`invoice-${result.id}`}
                        onClick={() => handleSelect(result.url)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
                      >
                        {getTypeIcon(result.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <span className="font-medium">{result.description}</span>
                        <Badge variant="secondary" className="capitalize">
                          {result.meta}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>Press ESC to close</span>
            <span>{hasResults ? `${results.total} result${results.total !== 1 ? 's' : ''}` : ''}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
