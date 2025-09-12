"use client";
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { type NavCollapsible, type NavItem, type NavLink, type NavGroup as NavGroupProps } from './types'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const key = `${item.title}-${'url' in item ? item.url : 'group'}`
          if (!('items' in item)) return <SidebarMenuLink key={key} item={item as NavLink} pathname={pathname} />
          if (state === 'collapsed' && !isMobile) return <SidebarMenuCollapsedDropdown key={key} item={item as NavCollapsible} pathname={pathname} />
          return <SidebarMenuCollapsible key={key} item={item as NavCollapsible} pathname={pathname} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: React.ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs shrink-0'>{children}</Badge>
}

function isActive(href: string, item: NavItem, mainNav = false) {
  if ('url' in item) {
    return href === item.url || href.split('?')[0] === item.url
  }
  return (
    !!item.items.find((i) => i.url === href) ||
    (mainNav && href.split('/')[1] !== '' && href.split('/')[1] === item.items[0]?.url.split('/')[1])
  )
}

function SidebarMenuLink({ item, pathname }: { item: NavLink; pathname: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive(pathname, item)} tooltip={item.title}>
        <Link href={item.url as any} onClick={() => setOpenMobile(false)}>
          {item.icon && <item.icon className='shrink-0' />}
          <span className='truncate'>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({ item, pathname }: { item: NavCollapsible; pathname: string }) {
  const { setOpenMobile } = useSidebar()
  return (
    <Collapsible asChild defaultOpen={isActive(pathname, item, true)} className='group/collapsible'>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon className='shrink-0' />}
            <span className='truncate'>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((sub) => (
              <SidebarMenuSubItem key={sub.title}>
                <SidebarMenuSubButton asChild isActive={pathname === sub.url}>
                  <Link href={sub.url as any} onClick={() => setOpenMobile(false)}>
                    {sub.icon && <sub.icon className='shrink-0' />}
                    <span className='truncate'>{sub.title}</span>
                    {sub.badge && <NavBadge>{sub.badge}</NavBadge>}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({ item, pathname }: { item: NavCollapsible; pathname: string }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={item.title} isActive={isActive(pathname, item)}>
        {item.icon && <item.icon className='shrink-0' />}
        <span className='truncate'>{item.title}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
