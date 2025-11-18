# Sidebar Layout Refactor Plan

This document describes how to implement a grid-based sidebar layout with a header, collapsible sidebar, and mobile menu for pages that use `SidebarPageLayout` (e.g. **Tasks** and **Test**).

## 1. Goals

- Add a **header above the main content** for sidebar pages.
- Use a **CSS grid with template areas** for clear semantics:
  - Desktop: header on top, sidebar on the left, main content on the right.
  - Mobile: header on top, main content below; sidebar as an overlay.
- Sidebar behavior:
  - Adjustable width on desktop (expanded vs collapsed).
  - Toggle button in the header to collapse/expand on desktop.
  - Mobile-first off-canvas menu controlled from the header.
- Maintain good semantics: `<header>`, `<aside>`, `<nav>`, `<main>`.
- Add tests for structure and interaction (Vitest + Testing Library).

## 2. Target Layout Structure

### 2.1 Overall layout

Use a root grid container with named areas:

```css
/* Desktop + mobile grid skeleton */
.sidebar-layout-grid {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "header"
    "main";
}

@media (min-width: 768px) {
  .sidebar-layout-grid {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "header header"
      "sidebar main";
  }
}

.sidebar-layout-header {
  grid-area: header;
}

.sidebar-layout-sidebar {
  grid-area: sidebar;
}

.sidebar-layout-main {
  grid-area: main;
}
```

### 2.2 Semantics

- Root: `<div className="sidebar-layout-grid">`.
- Header: `<header className="sidebar-layout-header" role="banner">`.
- Sidebar: `<aside className="sidebar-layout-sidebar" aria-label="Primary sidebar">`.
- Nav inside sidebar: `<nav role="navigation">`.
- Main content: `<main className="sidebar-layout-main" id="main-content">`.

On mobile, the sidebar will be a **fixed overlay** (not part of the grid) when open.

## 3. Components & Responsibilities

### 3.1 `SidebarPageLayout` (server)

File: `src/app/layouts/SidebarPageLayout.tsx`.

**Responsibilities:**
- Compute the list of sidebar items based on `RequestInfo['ctx']`.
- Render a client shell that owns all interactive behavior.

Example structure:

```tsx
import type { RequestInfo } from 'rwsdk/worker'
import { link } from '@/app/shared/links'
import { SidebarShellClient } from '@/app/layouts/SidebarShellClient'

interface SidebarNavItem {
  title: string
  href: string
}

function getSidebarItems(ctx: RequestInfo['ctx']): SidebarNavItem[] {
  const items: SidebarNavItem[] = [
    { title: 'Home', href: link('/home') },
    { title: 'Tasks', href: link('/tasks') },
    { title: 'Test', href: link('/test') },
  ]

  if (ctx?.user?.username) {
    const username = ctx.user.username
    items.push(
      { title: 'Profile', href: link('/user/:username/profile', { username }) },
      { title: 'Settings', href: link('/user/:username/settings', { username }) },
    )
  }

  return items
}

export function SidebarPageLayout(props: RequestInfo & { children: React.ReactNode }) {
  const items = getSidebarItems(props.ctx)

  return (
    <SidebarShellClient items={items} requestInfo={props}>
      {props.children}
    </SidebarShellClient>
  )
}
```

### 3.2 `SidebarShellClient` (client)

File: `src/app/layouts/SidebarShellClient.tsx` (new).

**Responsibilities:**
- Implement the **grid layout** and structural semantics.
- Manage state:
  - `isCollapsed` for desktop (sidebar width / icon-only mode).
  - `mobileOpen` for mobile off-canvas menu.
- Use `useIsMobile()` to branch behavior.
- Render a header with:
  - App title / logo placeholder.
  - Toggle button to control sidebar (desktop + mobile).
- Render sidebar nav using the `items` prop.
- Render `children` inside a container within `<main>`.

Suggested API:

```tsx
'use client'

import * as React from 'react'
import type { LayoutProps } from 'rwsdk/router'
import { useIsMobile } from '@/app/hooks/use-mobile'
import { Menu, X } from 'lucide-react'

interface SidebarNavItem {
  title: string
  href: string
}

interface SidebarShellClientProps {
  items: SidebarNavItem[]
  requestInfo: LayoutProps['requestInfo'] | null
  children: React.ReactNode
}

export function SidebarShellClient({ items, requestInfo, children }: SidebarShellClientProps) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      setIsCollapsed((prev) => !prev)
    }
  }

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64'

  return (
    <div className="sidebar-layout-grid">
      <header className="sidebar-layout-header flex items-center justify-between border-b bg-background px-4 py-2" role="banner">
        <div className="font-semibold">App</div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="inline-flex items-center rounded border px-2 py-1 text-sm"
          aria-label="Toggle sidebar"
          aria-expanded={isMobile ? mobileOpen : !isCollapsed}
          aria-controls={isMobile ? 'mobile-sidebar' : 'desktop-sidebar'}
        >
          {isMobile ? (mobileOpen ? <X size={16} /> : <Menu size={16} />) : <Menu size={16} />}
        </button>
      </header>

      {!isMobile && (
        <aside
          id="desktop-sidebar"
          aria-label="Primary sidebar"
          className={`sidebar-layout-sidebar border-r bg-sidebar text-sidebar-foreground ${sidebarWidth}`}
        >
          <nav role="navigation" className="p-4 space-y-1">
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
      )}

      {isMobile && mobileOpen && (
        <aside
          id="mobile-sidebar"
          aria-label="Mobile navigation"
          className="fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground shadow-lg"
        >
          <nav role="navigation" className="p-4 space-y-1">
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
      )}

      <main className="sidebar-layout-main" role="main" id="main-content">
        <div className="container max-w-5xl mx-auto p-4">{children}</div>
      </main>
    </div>
  )
}
```

You can refine header contents (e.g. include `requestInfo.ctx.user`) later; the key is the structure and toggle behavior.

## 4. Sidebar Behavior Details

### 4.1 Desktop collapse / expand

- State: `isCollapsed: boolean`.
- Sidebar width classes:
  - Expanded: `w-64`.
  - Collapsed: `w-16`.
- Toggle button in header controls `isCollapsed` when `!isMobile`.
- Use `aria-expanded={!isCollapsed}` and `aria-controls="desktop-sidebar"` for accessibility.

### 4.2 Mobile menu

- Use `useIsMobile()` to determine mobile.
- When `isMobile`:
  - Sidebar is not rendered as a grid area.
  - On toggle, render `<aside id="mobile-sidebar" className="fixed inset-y-0 left-0 ...">`.
  - Optionally add a backdrop `<div className="fixed inset-0 bg-black/40" onClick={close} />`.
- Use `aria-expanded={mobileOpen}` for the toggle button when mobile.

## 5. Testing Plan

Create `src/app/layouts/__tests__/SidebarPageLayout.test.tsx` using Vitest + Testing Library.

### 5.1 Helpers

- Create a `mockRequestInfo()` util returning a minimal `RequestInfo`.
- Mock `useIsMobile` to force desktop or mobile in different test suites.

### 5.2 Structure & semantics tests

1. **Renders header, sidebar, and main regions (desktop)**
   - Mock `useIsMobile` to `false`.
   - Render `SidebarPageLayout` with simple children.
   - Assert:
     - `getByRole('banner')` (header).
     - `getByRole('navigation')` (sidebar nav).
     - `getByRole('main')` (main region).

### 5.3 Desktop behavior tests

2. **Toggle collapses/expands sidebar**
   - Mock `useIsMobile` to `false`.
   - Render layout.
   - Find toggle button by `role="button"` + label.
   - Assert initial `aria-expanded="true"` and `sidebar` has `w-64`.
   - Click toggle; assert `aria-expanded="false"` and `sidebar` has `w-16`.

### 5.4 Mobile behavior tests

3. **Toggle opens/closes mobile sidebar**
   - Mock `useIsMobile` to `true`.
   - Render layout.
   - Initially: `queryByLabelText(/mobile navigation/i)` is `null`.
   - Click toggle: expect mobile sidebar `getByLabelText(/mobile navigation/i)` present and `aria-expanded="true"`.
   - Click again: sidebar disappears and `aria-expanded="false"`.

### 5.5 Content visibility checks

4. **Main content remains rendered regardless of sidebar state**
   - For both mobile and desktop tests, assert that the main content text remains in the document before and after toggling.

---

Following this plan will give you:
- A semantic, grid-based layout with a header above main.
- Desktop collapsible sidebar and mobile off-canvas menu.
- Tests to guard against regressions in structure and behavior.

