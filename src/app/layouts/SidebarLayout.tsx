import { SidebarProvider, SidebarInset } from '@/app/components/ui/sidebar'
import { AppSidebar } from '@/app/layouts/components/app-sidebar'
import SidebarHeader from '@/app/layouts/components/SidebarHeader'

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main>
          <SidebarHeader />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
