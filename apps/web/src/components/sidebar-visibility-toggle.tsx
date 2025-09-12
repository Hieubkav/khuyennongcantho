"use client";
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLayout } from '@/context/layout-provider'

export function SidebarVisibilityToggle() {
  const { sidebarHidden, setSidebarHidden } = useLayout()
  const label = sidebarHidden ? 'Hiện sidebar' : 'Ẩn sidebar'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          aria-label={label}
          className='rounded-full md:size-8 hidden sm:inline-flex'
          onClick={() => setSidebarHidden(!sidebarHidden)}
        >
          {sidebarHidden ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
