export const dynamic = 'force-static'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardHeading } from './DashboardHeading.client'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeading />




      {/* Stats */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="transition-colors hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Người dùng</CardTitle>
            <CardDescription>Trong 30 ngày qua</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-semibold">12,384</div>
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">+8.2%</Badge>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Tương tác</CardTitle>
            <CardDescription>Hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-semibold">1,047</div>
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30">+2.1%</Badge>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Đơn vị</CardTitle>
            <CardDescription>Đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-semibold">56</div>
            <Badge variant="outline" className="text-sky-600 dark:text-sky-400 border-sky-500/30">ổn định</Badge>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:border-foreground/20">
          <CardHeader>
            <CardTitle>Báo cáo</CardTitle>
            <CardDescription>Tháng này</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-semibold">128</div>
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">+3 mới</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 transition-colors hover:border-foreground/20">
          <CardHeader className="border-b">
            <CardTitle>Hiệu suất hệ thống</CardTitle>
            <CardDescription>Xu hướng tải và phản hồi (tĩnh mô phỏng)</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Simple sparkline style placeholder */}
            <div className="mt-4 h-40 w-full rounded-md bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute inset-0 grid grid-cols-12 gap-2 opacity-50">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="self-end h-[calc(20%+var(--h,0px))] bg-primary/30 rounded-sm" style={{ ['--h' as any]: `${(i % 5) * 10}px` }} />
                ))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Độ sẵn sàng</div>
                <div className="mt-1 text-lg font-medium">99.98%</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Thời gian phản hồi TB</div>
                <div className="mt-1 text-lg font-medium">182ms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-colors hover:border-foreground/20">
          <CardHeader className="border-b">
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Nhật ký hệ thống mẫu</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">Đồng bộ dữ liệu</div>
                  <div className="text-muted-foreground">10:21 hôm nay</div>
                </div>
                <Badge variant="outline">OK</Badge>
              </li>
              <li className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">Cập nhật cấu hình</div>
                  <div className="text-muted-foreground">Hôm qua</div>
                </div>
                <Badge variant="outline">Đã áp dụng</Badge>
              </li>
              <li className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">Kiểm tra sức khỏe</div>
                  <div className="text-muted-foreground">2 ngày trước</div>
                </div>
                <Badge variant="outline">Ổn định</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
