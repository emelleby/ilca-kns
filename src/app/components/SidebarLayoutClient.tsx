'use client'

import * as React from 'react'
import { FlaskConical, Home, ListChecks, Settings, User } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider
} from '@/app/components/ui/sidebar'

export type SidebarItem = {
  title: string
  href: string
  icon?: 'home' | 'tasks' | 'test' | 'profile' | 'settings'
}

const iconMap = {
  home: Home,
  tasks: ListChecks,
  test: FlaskConical,
  profile: User,
  settings: Settings
} as const

interface SidebarLayoutClientProps {
  items: SidebarItem[]
}

export function SidebarLayoutClient({ items }: SidebarLayoutClientProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon ? iconMap[item.icon] : undefined
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild>
                        <a href={item.href}>
                          {Icon && <Icon />}
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}
