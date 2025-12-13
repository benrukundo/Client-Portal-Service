'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, User, CreditCard, Users } from 'lucide-react'

const settingsNav = [
  {
    title: 'Workspace',
    href: '/dashboard/settings',
    icon: Building2,
  },
  {
    title: 'Profile',
    href: '/dashboard/settings/profile',
    icon: User,
  },
  {
    title: 'Team',
    href: '/dashboard/settings/team',
    icon: Users,
  },
  {
    title: 'Billing',
    href: '/dashboard/settings/billing',
    icon: CreditCard,
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your workspace and account settings
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 space-y-1">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
