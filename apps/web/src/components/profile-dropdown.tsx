"use client";
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useConvex } from 'convex/react'
import { api } from '@dohy/backend/convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function ProfileDropdown() {
  const router = useRouter()
  const convex = useConvex()

  async function onSignOut() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch {}
    router.replace('/sign-in')
  }

  async function goToMyProfile() {
    try {
      const res = await fetch('/api/admin/me', { cache: 'no-store' })
      const j = await res.json().catch(() => ({}))
      const username: string | undefined = j?.ok ? j.username : undefined
      if (!username) {
        router.push('/dashboard/settings')
        return
      }
      const me = (await convex.query(api.admins.getByUsernameWithHash, { username })) as any
      const id = me?._id
      if (id) router.push(`/dashboard/admins/${id}/edit`)
      else router.push('/dashboard/settings')
    } catch {
      router.push('/dashboard/settings')
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src='/avatars/01.png' alt='@shadcn' />
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1.5'>
            <p className='text-sm leading-none font-medium'>Admin</p>
            <p className='text-muted-foreground text-xs leading-none'>admin@example.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={goToMyProfile}>
            Tài khoản
            <DropdownMenuShortcut>
              
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={'/dashboard/settings' as any}>
              Cài đặt
              <DropdownMenuShortcut>
                
              </DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

