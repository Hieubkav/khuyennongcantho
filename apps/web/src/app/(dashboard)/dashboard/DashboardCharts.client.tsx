"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@dohy/backend/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

function numberVN(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export default function DashboardCharts() {
  const reports = useQuery(api.reports.listBrief, {} as any) as any[] | undefined;

  const latestActive = useMemo(() => {
    if (!reports) return undefined;
    return reports.find((r: any) => r.active) || reports[0];
  }, [reports]);

  const latestFull = useQuery(
    api.reports.getFull,
    latestActive ? ({ id: latestActive._id } as any) : (undefined as any)
  ) as any | null | undefined;

  // Chart 1: Top markets by surveyCount (from latest active report)
  const topMarketsData = useMemo(() => {
    if (!latestFull) return undefined;
    const rows = [...(latestFull.summaryRows || [])];
    rows.sort((a, b) => b.surveyCount - a.surveyCount);
    return rows.slice(0, 8).map((r: any) => ({ name: r.marketName, count: r.surveyCount }));
  }, [latestFull]);

  // Chart 2: surveyed vs not surveyed count of markets (from latest active report)
  const surveyedRatio = useMemo(() => {
    if (!latestFull) return undefined;
    const rows = latestFull.summaryRows || [];
    const surveyed = rows.filter((r: any) => r.surveyCount > 0).length;
    const notSurveyed = rows.length - surveyed;
    return [
      { name: "Da khao sat", value: surveyed },
      { name: "Chua khao sat", value: notSurveyed },
    ];
  }, [latestFull]);

  // Chart 3: time series of total survey counts across recent active reports
  const seriesData = useMemo(() => {
    if (!reports) return undefined;
    const actives = reports.filter((r: any) => r.active).slice(0, 5);
    return actives.map((r: any) => ({ key: r._id, label: `${r.fromDay} - ${r.toDay}` }));
  }, [reports]);

  const id0 = seriesData?.[0]?.key;
  const id1 = seriesData?.[1]?.key;
  const id2 = seriesData?.[2]?.key;
  const id3 = seriesData?.[3]?.key;
  const id4 = seriesData?.[4]?.key;

  const full0 = useQuery(api.reports.getFull, id0 ? ({ id: id0 } as any) : (undefined as any)) as any;
  const full1 = useQuery(api.reports.getFull, id1 ? ({ id: id1 } as any) : (undefined as any)) as any;
  const full2 = useQuery(api.reports.getFull, id2 ? ({ id: id2 } as any) : (undefined as any)) as any;
  const full3 = useQuery(api.reports.getFull, id3 ? ({ id: id3 } as any) : (undefined as any)) as any;
  const full4 = useQuery(api.reports.getFull, id4 ? ({ id: id4 } as any) : (undefined as any)) as any;

  const seriesFilled = useMemo(() => {
    if (!seriesData) return undefined;
    const calct = (f: any) => (f && f.summaryRows ? f.summaryRows.reduce((s: number, r: any) => s + (r.surveyCount || 0), 0) : 0);
    const totals = [calct(full0), calct(full1), calct(full2), calct(full3), calct(full4)];
    return seriesData.map((d, i) => ({ label: d.label, total: totals[i] || 0 }));
  }, [seriesData, full0, full1, full2, full3, full4]);

  const pieColors = ["hsl(var(--color-chart-1))", "hsl(var(--color-chart-2))"];

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-2 transition-colors hover:border-foreground/20">
        <CardHeader className="border-b">
          <CardTitle>Top cho theo so lan khao sat</CardTitle>
          <CardDescription>Tu bao cao active gan nhat</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72 w-full">
            {topMarketsData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMarketsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} dx={-10} />
                  <YAxis tickFormatter={numberVN} />
                  <Tooltip formatter={(value: any) => numberVN(value as number)} />
                  <Bar dataKey="count" fill="hsl(var(--color-chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">Dang tai du lieu...</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="transition-colors hover:border-foreground/20">
        <CardHeader className="border-b">
          <CardTitle>Ty le khaosat</CardTitle>
          <CardDescription>Da vs chua khao sat</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72 w-full">
            {surveyedRatio ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={surveyedRatio} dataKey="value" nameKey="name" outerRadius={90} label>
                    {surveyedRatio.map((_, i) => (
                      <Cell key={`c-${i}`} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => numberVN(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">Dang tai du lieu...</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 transition-colors hover:border-foreground/20">
        <CardHeader className="border-b">
          <CardTitle>Xu huong tong so khao sat</CardTitle>
          <CardDescription>Cac bao cao active gan day</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72 w-full">
            {seriesFilled ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriesFilled}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={numberVN} />
                  <Tooltip formatter={(value: any) => numberVN(value as number)} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--color-chart-2))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-muted-foreground">Dang tai du lieu...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
