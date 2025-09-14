export const dynamic = 'force-static'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardHeading } from './DashboardHeading.client'
import DashboardCharts from './DashboardCharts.client'
import DashboardStats from './DashboardStats.client'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeading />

      <DashboardStats />

      {/* Real charts from active reports */}
      <DashboardCharts />
    </div>
  )
}
