import type { RequestInfo } from 'rwsdk/worker'
import { link } from '@/app/shared/links'

interface SidebarNavItem {
  title: string
  href: string
}

function getSidebarItems(ctx: RequestInfo['ctx']): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    { title: 'Home', href: link('/home') },
    { title: 'Tasks', href: link('/tasks') },
    { title: 'Test', href: link('/test') }
  ]

  if (ctx?.user?.username) {
    const username = ctx.user.username
    items.push(
      { title: 'Profile', href: link('/user/:username/profile', { username }) },
      { title: 'Settings', href: link('/user/:username/settings', { username }) }
    )
  }

  return items
}

export function SidebarPageLayout(props: RequestInfo & { children: React.ReactNode }) {
  const items = getSidebarItems(props.ctx)

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground">
        <nav className="p-4 space-y-1">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {item.title}
            </a>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <div className="container max-w-5xl mx-auto p-4">{props.children}</div>
      </main>
    </div>
  )
}
