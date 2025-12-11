import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PortalLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspaceSlug: string }>
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { workspaceSlug } = await params

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  })

  if (!workspace) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Portal Header */}
      <header 
        className="border-b bg-card"
        style={{ borderBottomColor: workspace.brandColor }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workspace.logo ? (
              <img
                src={workspace.logo}
                alt={workspace.name}
                className="h-10 w-10 rounded"
              />
            ) : (
              <div
                className="h-10 w-10 rounded flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: workspace.brandColor }}
              >
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-lg">{workspace.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Client Portal
          </div>
        </div>
      </header>

      {/* Portal Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Portal Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by ClientHub
        </div>
      </footer>
    </div>
  )
}
