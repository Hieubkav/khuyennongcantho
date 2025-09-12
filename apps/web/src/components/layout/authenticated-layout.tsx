"use client";
import { LayoutProvider, useLayout } from '@/context/layout-provider'
import { ThemeProvider } from '@/context/theme-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { cn } from '@/lib/utils'

export function AuthenticatedLayout({ children }: { children?: React.ReactNode }) {
  function Inner({ children }: { children?: React.ReactNode }) {
    const { sidebarHidden } = useLayout()
    return (
      <SidebarProvider>
        <SkipToMain />
        {!sidebarHidden && <AppSidebar />}
        <SidebarInset
          className={cn(
            '@container/content',
            'has-[[data-layout=fixed]]:h-svh',
            'peer-data-[variant=inset]:has-[[data-layout=fixed]]:h-[calc(100svh-(var(--spacing)*4))]'
          )}
        >
          {children}
        </SidebarInset>
      </SidebarProvider>
    )
  }
  return (
    <SearchProvider>
      <ThemeProvider>
        <LayoutProvider>
          <Inner>{children}</Inner>
        </LayoutProvider>
      </ThemeProvider>
    </SearchProvider>
  )
}
