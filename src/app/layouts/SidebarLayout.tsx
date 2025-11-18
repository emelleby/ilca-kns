//'use client'

import { SidebarProvider, SidebarTrigger } from '@/app/components/ui/sidebar'
import { AppSidebar } from '@/app/layouts/components/app-sidebar'

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
