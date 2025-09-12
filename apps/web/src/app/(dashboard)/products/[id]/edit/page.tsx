import ProductEditClient from "./product-edit.client";

export default async function ProductEditPage({ params }: any) {
  const p = await params;
  const id = p?.id as string;
  return <ProductEditClient id={id} />;
}

