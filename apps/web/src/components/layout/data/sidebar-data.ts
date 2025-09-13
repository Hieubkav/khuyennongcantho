import {
  LayoutDashboard,
  ListTodo,
  FileX,
  Settings as SettingsIcon,
  Package,
  ShieldCheck,
  Users,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    { name: 'Shadcn Admin', logo: Command, plan: 'Next + ShadcnUI' },
    { name: 'Acme Inc', logo: GalleryVerticalEnd, plan: 'Enterprise' },
    { name: 'Acme Corp.', logo: AudioWaveform, plan: 'Startup' },
  ],
  navGroups: [
    {
      title: '',
      items: [
        { title: 'Tổng quan', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Chợ', url: '/dashboard/markets', icon: ListTodo },
        { title: 'Sản phẩm', url: '/dashboard/products', icon: Package },
        { title: 'Đơn vị', url: '/dashboard/units', icon: ListTodo },
        { title: 'Báo cáo', url: '/dashboard/reports', icon: FileX },
        { title: 'Khảo sát', url: '/dashboard/surveys', icon: ListTodo },
        { title: 'Quản trị viên', url: '/dashboard/admins', icon: ShieldCheck },
        { title: 'Nhân viên', url: '/dashboard/members', icon: Users },
        { title: 'Cài đặt', url: '/dashboard/settings', icon: SettingsIcon },
      ],
    },
  ],
}
