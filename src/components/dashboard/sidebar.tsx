'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Workspace } from '@prisma/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Receipt,
  Settings,
  HelpCircle,
} from 'lucide-react'

interface DashboardSidebarProps {
  workspace: Workspace
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

export function DashboardSidebar({ workspace }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          {workspace.logo ? (
            <img
              src={workspace.logo}
              alt={workspace.name}
              className="h-8 w-8 rounded"
            />
          ) : (
            <div
              className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: workspace.brandColor }}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-lg">{workspace.name}</span>
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

      {/* Plan Info */}
      <div className="p-4 border-t">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-sm font-medium capitalize">{workspace.plan} Plan</p>
          <p className="text-xs text-muted-foreground mt-1">
            {workspace.plan === 'trial' ? 'Trial expires soon' : 'Manage subscription'}
          </p>
        </div>
      </div>
    </aside>
  )
}
