'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
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
import { useDebounce } from '@/hooks/use-debounce'

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

  const debouncedQuery = useDebounce(query, 300)

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
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(null)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  const handleSelect = useCallback((url: string) => {
    setOpen(false)
    setQuery('')
    setResults(null)
    router.push(url)
  }, [router])

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

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search clients, projects, files, invoices..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !results && query.length < 2 && (
            <CommandEmpty>
              <div className="text-center py-6">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            </CommandEmpty>
          )}

          {!loading && results && results.total === 0 && (
            <CommandEmpty>
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  No results found for "{query}"
                </p>
              </div>
            </CommandEmpty>
          )}

          {!loading && results && results.total > 0 && (
            <>
              {results.clients.length > 0 && (
                <CommandGroup heading="Clients">
                  {results.clients.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`client-${result.id}`}
                      onSelect={() => handleSelect(result.url)}
                      className="flex items-center gap-3 py-3"
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
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {results.projects.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Projects">
                    {results.projects.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={`project-${result.id}`}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3 py-3"
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
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {results.files.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Files">
                    {results.files.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={`file-${result.id}`}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3 py-3"
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
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {results.invoices.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Invoices">
                    {results.invoices.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={`invoice-${result.id}`}
                        onSelect={() => handleSelect(result.url)}
                        className="flex items-center gap-3 py-3"
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
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
