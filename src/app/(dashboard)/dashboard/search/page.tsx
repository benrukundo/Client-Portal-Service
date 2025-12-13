'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Users,
  FolderKanban,
  File,
  FileText,
  Loader2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
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
}

type SearchResults = {
  clients: SearchResult[]
  projects: SearchResult[]
  files: SearchResult[]
  invoices: SearchResult[]
  total: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    async function search() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(null)
        return
      }

      setLoading(true)
      try {
        const type = activeTab === 'all' ? '' : `&type=${activeTab}`
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}${type}`)
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
  }, [debouncedQuery, activeTab])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="h-5 w-5 text-blue-500" />
      case 'project':
        return <FolderKanban className="h-5 w-5 text-purple-500" />
      case 'file':
        return <File className="h-5 w-5 text-green-500" />
      case 'invoice':
        return <FileText className="h-5 w-5 text-orange-500" />
      default:
        return <Search className="h-5 w-5" />
    }
  }

  const renderResultsList = (items: SearchResult[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No results found
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {items.map((result) => (
          <Link key={result.id} href={result.url}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {result.subtitle}
                    {result.description && ` • ${result.description}`}
                  </p>
                </div>
                {result.type === 'project' ? (
                  <Badge className={getStatusColor(result.meta)} variant="secondary">
                    {getStatusLabel(result.meta)}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">{result.meta}</span>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground">Find clients, projects, files, and invoices</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && query.length >= 2 && results && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              All ({results.total})
            </TabsTrigger>
            <TabsTrigger value="clients">
              Clients ({results.clients.length})
            </TabsTrigger>
            <TabsTrigger value="projects">
              Projects ({results.projects.length})
            </TabsTrigger>
            <TabsTrigger value="files">
              Files ({results.files.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Invoices ({results.invoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {results.clients.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Clients
                </h3>
                {renderResultsList(results.clients)}
              </div>
            )}
            {results.projects.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Projects
                </h3>
                {renderResultsList(results.projects)}
              </div>
            )}
            {results.files.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Files
                </h3>
                {renderResultsList(results.files)}
              </div>
            )}
            {results.invoices.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Invoices
                </h3>
                {renderResultsList(results.invoices)}
              </div>
            )}
            {results.total === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try different keywords or check your spelling</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            {renderResultsList(results.clients)}
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            {renderResultsList(results.projects)}
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            {renderResultsList(results.files)}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {renderResultsList(results.invoices)}
          </TabsContent>
        </Tabs>
      )}

      {!loading && query.length < 2 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Enter at least 2 characters to search</p>
          <p className="text-sm mt-2">
            Tip: Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘K</kbd> anywhere to quick search
          </p>
        </div>
      )}
    </div>
  )
}
