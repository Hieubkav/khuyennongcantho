import MarketEditClient from "./market-edit.client";

export default async function MarketEditPage({ params }: any) {
  const p = await params;
  const id = p?.id as string;
  return <MarketEditClient id={id} />;
}

