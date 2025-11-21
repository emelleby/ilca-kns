import { type LayoutProps } from "rwsdk/router"
import { SidebarProvider, SidebarInset } from "@/app/components/ui/sidebar"
import { AppSidebar } from "@/app/layouts/components/app-sidebar"
import SidebarHeader from "@/app/layouts/components/SidebarHeader"

export function SidebarLayout({ children }: LayoutProps) {
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
