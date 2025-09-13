import AdminEditClient from "./admin-edit.client";

export default async function AdminEditPage({ params }: any) {
  const p = await params;
  const id = p?.id as string;
  return <AdminEditClient id={id} />;
}

