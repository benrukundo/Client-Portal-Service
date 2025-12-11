'use client'

import { signOut } from 'next-auth/react'
import type { Workspace } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/utils'
import { Bell, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'

interface DashboardHeaderProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  workspace: Workspace
}

export function DashboardHeader({ user, workspace }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold">Welcome back!</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Portal Link */}
        <Link
          href={`/portal/${workspace.slug}`}
          target="_blank"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View Client Portal
        </Link>

        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || undefined} alt={user.name || ''} />
                <AvatarFallback>
                  {getInitials(user.name || user.email || 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
