import MemberEditClient from "./member-edit.client";

export default async function MemberEditPage({ params }: any) {
  const p = await params;
  const id = p?.id as string;
  return <MemberEditClient id={id} />;
}

