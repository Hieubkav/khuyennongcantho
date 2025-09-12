"use client";
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname } from 'next/navigation'

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: {
    title: string
    href: string
    isActive?: boolean
    disabled?: boolean
  }[]
}

export function TopNav({ className, links, ...props }: TopNavProps) {
  const pathname = usePathname()
  const withActive = links.map((l) => ({
    ...l,
    isActive: typeof l.isActive === 'boolean' ? l.isActive : pathname === l.href || pathname.startsWith(l.href),
  }))

  return (
    <>
      <div className='lg:hidden'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size='icon' variant='outline' className='md:size-7'>
              <Menu />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='start'>
            {withActive.map(({ title, href, isActive, disabled }) => (
              <DropdownMenuItem key={`${title}-${href}`} asChild>
                <Link
                  href={href as any}
                  className={!isActive ? 'text-muted-foreground' : ''}
                  aria-disabled={disabled}
                >
                  {title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        className={cn(
          'hidden lg:flex items-center lg:space-x-4 xl:space-x-6 overflow-x-auto whitespace-nowrap min-w-0',
          className
        )}
        {...props}
      >
        {withActive.map(({ title, href, isActive, disabled }) => (
          <Link
            key={`${title}-${href}`}
            href={href as any}
            aria-disabled={disabled}
            className={`hover:text-primary text-sm font-medium transition-colors ${isActive ? '' : 'text-muted-foreground'}`}
          >
            {title}
          </Link>
        ))}
      </nav>
    </>
  )
}
