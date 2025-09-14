import ReportEditClient from "./report-edit.client";

export default function ReportEditPage({ params }: { params: Promise<{ id: string }> }) {
  return <ReportEditClient id={(params as any).id} />;
}