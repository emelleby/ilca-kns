import type { RequestInfo } from 'rwsdk/worker'
import { link } from '@/app/shared/links'
import { HomeLayout } from '@/app/layouts/HomeLayout'
import { SidebarLayoutClient, type SidebarItem } from '@/app/components/SidebarLayoutClient'

function getSidebarItems(ctx: RequestInfo['ctx']): SidebarItem[] {
  const items: SidebarItem[] = [
    { title: 'Home', href: link('/home'), icon: 'home' },
    { title: 'Tasks', href: link('/tasks'), icon: 'tasks' },
    { title: 'Test', href: link('/test'), icon: 'test' }
  ]

  if (ctx?.user?.username) {
    const username = ctx.user.username
    items.push(
      { title: 'Profile', href: link('/user/:username/profile', { username }), icon: 'profile' },
      { title: 'Settings', href: link('/user/:username/settings', { username }), icon: 'settings' }
    )
  }

  return items
}

export function SidebarPageLayout(props: RequestInfo & { children: React.ReactNode }) {
  const items = getSidebarItems(props.ctx)

  return (
    <HomeLayout {...props}>
      <div className="flex min-h-screen">
        <SidebarLayoutClient items={items} />
        <main className="flex-1">{props.children}</main>
      </div>
    </HomeLayout>
  )
}
