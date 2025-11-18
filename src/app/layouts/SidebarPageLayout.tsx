import type { RequestInfo } from 'rwsdk/worker'
import React from 'react'
import { link } from '@/app/shared/links'
import { Home, ListTodo, TestTube, User, Settings } from 'lucide-react'
import { AppSidebar } from '@/app/layouts/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/app/components/ui/sidebar'
import SidebarHeader from '@/app/layouts/components/SidebarHeader'

interface SidebarNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

async function getSidebarItems(ctx: RequestInfo['ctx']): Promise<SidebarNavItem[]> {
  const items: SidebarNavItem[] = [
    { title: 'Home', href: link('/home'), icon: Home },
    { title: 'Tasks', href: link('/tasks'), icon: ListTodo },
    { title: 'Test', href: link('/test'), icon: TestTube }
  ]

  if (ctx?.user?.username) {
    const username = ctx.user.username
    items.push(
      { title: 'Profile', href: link('/user/:username/profile', { username }), icon: User },
      { title: 'Settings', href: link('/user/:username/settings', { username }), icon: Settings }
    )
  }

  return items
}

export function SidebarPageLayout(props: RequestInfo & { children: React.ReactNode }) {
  const items = getSidebarItems(props.ctx)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarHeader />
        <main>
          <SidebarTrigger />
          {props.children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
