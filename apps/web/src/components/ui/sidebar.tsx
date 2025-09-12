"use client";
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { PanelLeftIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useLayout } from '@/context/layout-provider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type SidebarContextProps = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.')
  return context
}

export function SidebarProvider({
  defaultOpen = true,
  children,
  className,
  style,
  ...props
}: React.ComponentProps<'div'> & { defaultOpen?: boolean }) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [open, setOpen] = React.useState(defaultOpen)

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((o) => !o) : setOpen((o) => !o)
  }, [isMobile])

  const state: 'expanded' | 'collapsed' = open ? 'expanded' : 'collapsed'

  const contextValue = React.useMemo(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, isMobile, openMobile, toggleSidebar]
  )

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'b' || event.key === 'B') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  React.useEffect(() => {
    try {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    } catch {}
  }, [open])

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot='sidebar-wrapper'
        style={style as React.CSSProperties}
        className={cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  side = 'left',
  variant = 'sidebar',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar()

  if (collapsible === 'none') {
    return (
      <div data-slot='sidebar' className={cn('bg-sidebar text-sidebar-foreground flex h-full w-64 flex-col', className)} {...props}>
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar='sidebar'
          data-slot='sidebar'
          data-mobile='true'
          className='bg-sidebar text-sidebar-foreground w-72 p-0 [&>button]:hidden'
          side={side}
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className='flex h-full w-full flex-col'>{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  const collapsed = state === 'collapsed'
  const desktopClass = cn(
    'bg-sidebar text-sidebar-foreground group peer hidden md:flex transition-[width,transform] duration-200 ease-in-out motion-reduce:transition-none will-change-transform',
    // width behavior
    collapsed ? (collapsible === 'icon' ? 'w-14' : 'w-64 -translate-x-full absolute') : 'w-64 translate-x-0 relative',
    className
  )

  return (
    <div
      data-sidebar='sidebar'
      data-slot='sidebar'
      data-state={state}
      data-variant={variant}
      data-collapsible={collapsible}
      data-side={side}
      className={desktopClass}
      {...props}
    >
      <div className='relative flex h-svh w-full flex-col'>{children}</div>
    </div>
  )
}

export function SidebarInset({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-inset'
      className={cn(
        'bg-background relative flex w-full flex-1 flex-col',
        // inset variant: subtle card-like container
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ms-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ms-0',
        // when collapsed to icons, remove left radius so it doesn’t cut in
        'md:peer-data-[variant=inset]:peer-data-[state=collapsed]:rounded-s-none md:peer-data-[variant=inset]:peer-data-[state=collapsed]:border-l md:peer-data-[variant=inset]:peer-data-[state=collapsed]:border-border',
        // floating variant: more spacing + stronger elevation
        'md:peer-data-[variant=floating]:m-4 md:peer-data-[variant=floating]:ms-0 md:peer-data-[variant=floating]:rounded-2xl md:peer-data-[variant=floating]:border md:peer-data-[variant=floating]:shadow-md md:peer-data-[variant=floating]:peer-data-[state=collapsed]:ms-4',
        className
      )}
      {...props}
    />
  )
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='sidebar-header' className={cn('flex flex-col gap-2 p-2', className)} {...props} />
}
export function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='sidebar-footer' className={cn('flex flex-col gap-2 p-2', className)} {...props} />
}
export function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator data-slot='sidebar-separator' className={cn('bg-sidebar-border mx-2 w-auto', className)} {...props as any} />
}
export function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot='sidebar-content' className={cn('flex min-h-0 flex-1 flex-col gap-2 overflow-auto', className)} {...props} />
  )
}
export function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='sidebar-group' className={cn('relative flex w-full min-w-0 flex-col p-2', className)} {...props} />
}
export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='sidebar-group-label'
      className={cn(
        'text-sidebar-foreground/70 px-2 py-1 text-xs font-medium',
        // hide labels when collapsed on desktop
        'group-data-[state=collapsed]:sr-only',
        className
      )}
      {...props}
    />
  )
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul data-slot='sidebar-menu' className={cn('m-0 list-none p-0', className)} {...props} />
}
export function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li data-slot='sidebar-menu-item' className={cn('px-1 py-0.5', className)} {...props} />
}
export function SidebarMenuButton({
  asChild,
  isActive,
  tooltip,
  className,
  children,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean; isActive?: boolean; tooltip?: string }) {
  const Comp: any = asChild ? Slot : 'a'
  const { state, isMobile } = useSidebar()
  const content = (
    <Comp
      data-slot='sidebar-menu-button'
      data-active={isActive ? 'true' : undefined}
      className={cn(
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground inline-flex w-full min-w-0 overflow-hidden items-center gap-2 rounded-md px-2 py-2 text-sm',
        isActive && 'bg-primary/10 text-foreground font-semibold border-l-2 border-primary pl-3',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
  if (tooltip && state === 'collapsed' && !isMobile) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side='right'>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }
  return content
}
export function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot='sidebar-menu-sub'
      className={cn(
        'ms-4 mt-1 space-y-1 relative',
        className
      )}
      {...props}
    />
  )
}
export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot='sidebar-menu-sub-item'
      className={cn(
        'relative ps-5',
        // bullet dot centered on the guide line
        'before:absolute before:left-3 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-muted-foreground/50 before:transform',
        className
      )}
      {...props}
    />
  )
}
export function SidebarMenuSubButton({ asChild, isActive, className, children, ...props }: React.ComponentProps<'a'> & { asChild?: boolean; isActive?: boolean }) {
  const Comp: any = asChild ? Slot : 'a'
  return (
    <Comp
      data-slot='sidebar-menu-sub-button'
      data-active={isActive ? 'true' : undefined}
      className={cn(
        'hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground text-sidebar-foreground inline-flex w-full min-w-0 overflow-hidden items-center gap-2 rounded-md px-2 py-1.5 text-sm',
        isActive && 'bg-primary/5 text-foreground font-semibold border-l-2 border-primary pl-3',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

export function SidebarRail({ className, ...props }: React.ComponentProps<'button'>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      data-slot='sidebar-rail'
      aria-label='Toggle Sidebar'
      tabIndex={-1}
      onClick={toggleSidebar}
      title='Toggle Sidebar'
      className={cn('absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 sm:flex', className)}
      {...props}
    />
  )
}

export function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return <Input data-slot='sidebar-input' className={cn('bg-background h-8 w-full shadow-none', className)} {...props} />
}

export function SidebarTrigger({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { isMobile, toggleSidebar, open, setOpen } = useSidebar()
  const { collapsible, setCollapsible } = useLayout()
  const mode: 'expanded' | 'icon' | 'hidden' = !open ? (collapsible === 'icon' ? 'icon' : 'hidden') : 'expanded'

  const onClick = () => {
    if (isMobile) return toggleSidebar()
    if (mode === 'expanded') {
      setCollapsible('icon')
      setOpen(false)
    } else if (mode === 'icon') {
      setCollapsible('offcanvas')
      setOpen(false)
    } else {
      setCollapsible('offcanvas')
      setOpen(true)
    }
  }

  const label = mode === 'expanded' ? 'Thu gọn về biểu tượng' : mode === 'icon' ? 'Ẩn sidebar' : 'Hiện sidebar'

  return (
    <Button size='icon' variant='outline' aria-label={label} title={label} className={cn('md:size-7', className)} onClick={onClick} {...props}>
      <PanelLeftIcon />
      <span className='sr-only'>{label}</span>
    </Button>
  )
}
