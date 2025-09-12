import UnitEditClient from "./unit-edit.client";

export default async function UnitEditPage({ params }: any) {
  const p = await params;
  const id = p?.id as string;
  return <UnitEditClient id={id} />;
}
