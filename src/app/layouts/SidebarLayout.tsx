import { AppSidebar } from "@/app/layouts/components/app-sidebar"
import { NavActions } from "@/app/layouts/components/nav-actions"

import { Separator } from "@/app/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/components/ui/sidebar"

export const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            
          </div>
          <div className="ml-auto px-3">
            <NavActions />
          </div>
        </header>
        <div className="container max-w-5xl mx-auto p-4">
        {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
