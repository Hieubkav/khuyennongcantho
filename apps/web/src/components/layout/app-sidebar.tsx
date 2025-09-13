"use client";
import { useLayout } from '@/context/layout-provider'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { useSettings } from '@/hooks/useSettings'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { state } = useSidebar()
  const { siteName } = useSettings()
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      {state === 'expanded' && (
        <SidebarHeader>
          <div className="px-2 py-1.5">
            <div className="text-sm font-semibold truncate" title={siteName || undefined}>{siteName || ''}</div>
          </div>
        </SidebarHeader>
      )}
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>{/* NavUser could go here */}</SidebarFooter>
    </Sidebar>
  )
}
