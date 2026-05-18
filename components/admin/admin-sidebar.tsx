'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, Download, Gauge, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: Gauge },
  { name: 'Articles', href: '/admin/articles', icon: BookOpen },
  { name: 'Import', href: '/admin/import', icon: Download },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'System', href: '/admin/system', icon: ShieldCheck },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="border-b bg-muted/20 lg:min-h-[calc(100vh-4rem)] lg:w-64 lg:border-b-0 lg:border-r">
      <div className="container mx-auto flex gap-2 overflow-x-auto px-4 py-3 lg:sticky lg:top-16 lg:block lg:space-y-2 lg:px-4 lg:py-6">
        {adminLinks.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn('shrink-0 justify-start gap-2 lg:w-full', isActive && 'bg-secondary')}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </div>
    </aside>
  )
}
