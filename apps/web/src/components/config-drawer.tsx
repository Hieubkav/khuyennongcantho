"use client";
import { Moon, Sun, Monitor, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useTheme } from '@/context/theme-provider'
import { useLayout, type Collapsible } from '@/context/layout-provider'
import { useSidebar } from '@/components/ui/sidebar'

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className='space-y-3'>
      <div>
        <div className='text-sm font-medium'>{title}</div>
        {desc ? <div className='text-xs text-muted-foreground mt-0.5'>{desc}</div> : null}
      </div>
      <div className='flex flex-wrap gap-2'>{children}</div>
    </div>
  )
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      size='sm'
      variant={active ? 'default' : 'outline'}
      className='h-8 rounded-md'
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function ConfigDrawer() {
  const { theme, setTheme } = useTheme()
  const { variant, setVariant, collapsible, setCollapsible, sidebarHidden, setSidebarHidden } = useLayout()
  const { toggleSidebar } = useSidebar()

  const collOptions: { value: Collapsible; label: string }[] = [
    { value: 'offcanvas', label: 'Trượt ngoài màn (offcanvas)' },
    { value: 'icon', label: 'Thu gọn về biểu tượng' },
    { value: 'none', label: 'Không thu gọn' },
  ]

  function LayoutPreview() {
    return (
      <div className='rounded-lg border p-3'>
        <div className='relative h-20 w-full overflow-hidden rounded-md bg-muted'>
          {/* Sidebar */}
          <div
            className='absolute inset-y-0 left-0 bg-foreground/15'
            style={{ width: collapsible === 'icon' ? 24 : 64, opacity: sidebarHidden ? 0.15 : 1 }}
          />
          {/* Content container reacts to variant */}
          <div
            className={
              variant === 'inset'
                ? 'absolute right-2 top-2 bottom-2 left-[72px] rounded-md bg-background'
                : variant === 'floating'
                ? 'absolute right-4 top-3 bottom-3 left-[72px] rounded-lg bg-background shadow-sm'
                : 'absolute inset-0 left-[72px] bg-background'
            }
          />
        </div>
      </div>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='rounded-full'>
          <Settings2 className='h-4 w-4' />
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='flex w-[92vw] sm:w-[420px] flex-col gap-6 overflow-y-auto p-4'>
        <SheetHeader>
          <SheetTitle>Cài đặt giao diện</SheetTitle>
        </SheetHeader>

        <Section title='Chế độ' desc='Chọn cách hiển thị màu.'>
          <OptionButton active={theme === 'light'} onClick={() => { setTheme('light' as any); toast.success('Đã chuyển sang Light'); }}>
            <Sun className='h-4 w-4 me-1.5' /> Light
          </OptionButton>
          <OptionButton active={theme === 'dark'} onClick={() => { setTheme('dark' as any); toast.success('Đã chuyển sang Dark'); }}>
            <Moon className='h-4 w-4 me-1.5' /> Dark
          </OptionButton>
          <OptionButton active={theme === 'system'} onClick={() => { setTheme('system' as any); toast.success('Theo hệ thống'); }}>
            <Monitor className='h-4 w-4 me-1.5' /> System
          </OptionButton>
        </Section>

        <Separator />

        <Section title='Sidebar' desc='Tùy chỉnh hiển thị và bố cục sidebar.'>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox checked={sidebarHidden} onCheckedChange={(v) => setSidebarHidden(Boolean(v))} />
            Ẩn hoàn toàn sidebar
          </label>
          <Button size='sm' variant='outline' onClick={() => { toggleSidebar(); toast.message('Đã chuyển trạng thái thu gọn/mở') }}>
            Thu gọn/Mở ngay (Ctrl/Cmd + B)
          </Button>
        </Section>

        <Section title='Hành vi thu gọn' desc='Cách thu gọn sidebar trên desktop.'>
          {collOptions.map((c) => (
            <OptionButton key={c.value} active={collapsible === c.value} onClick={() => { setCollapsible(c.value); toast.message(`Thu gọn: ${c.label}`) }}>
              {c.label}
            </OptionButton>
          ))}
        </Section>

        <LayoutPreview />

        <div className='mt-auto border-t pt-4 flex items-center justify-between'>
          <div className='text-xs text-muted-foreground'>Áp dụng ngay • Lưu trong cookie 7 ngày</div>
          <Button variant='secondary' size='sm' onClick={() => {
            setSidebarHidden(false); setVariant('inset'); setCollapsible('offcanvas'); toast.success('Đã đặt lại cài đặt')
          }}>Đặt lại mặc định</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

