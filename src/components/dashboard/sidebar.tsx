'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Workspace } from '@prisma/client'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/contexts/workspace-context'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Settings,
  ExternalLink,
  Activity,
  BarChart3,
  Search,
} from 'lucide-react'

interface DashboardSidebarProps {
  workspace: Workspace
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Activity', href: '/dashboard/activity', icon: Activity },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar({ workspace: initialWorkspace }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { workspace } = useWorkspace()

  // Use context workspace if available, fallback to initial
  const currentWorkspace = workspace || initialWorkspace

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          {currentWorkspace.logo ? (
            <img
              src={currentWorkspace.logo}
              alt={currentWorkspace.name}
              className="h-8 w-8 rounded"
            />
          ) : (
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: currentWorkspace.brandColor || '#0066FF' }}
            >
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-lg">{currentWorkspace.name}</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Support
          </p>
          <ul className="space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Link
          href={`/portal/${currentWorkspace.slug}`}
          target="_blank"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <span>View Client Portal</span>
        </Link>
      </div>
    </aside>
  )
}
