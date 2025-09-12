import data from "@/lib/vn-locations.json" with { type: "json" };

export type Ward = { code: string; name: string };
export type District = { code: string; name: string; wards: Ward[] };
export type Province = { code: string; name: string; districts: District[] };

export const provinces: Province[] = (data as any).provinces as Province[];

export function findProvince(code?: string | null): Province | undefined {
  if (!code) return undefined;
  return provinces.find((p) => String(p.code) === String(code));
}

export function findDistrict(provinceCode?: string | null, districtCode?: string | null): District | undefined {
  const p = findProvince(provinceCode);
  if (!p || !districtCode) return undefined;
  return p.districts.find((d) => String(d.code) === String(districtCode));
}

export function findWard(
  provinceCode?: string | null,
  districtCode?: string | null,
  wardCode?: string | null
): Ward | undefined {
  const d = findDistrict(provinceCode, districtCode);
  if (!d || !wardCode) return undefined;
  return d.wards.find((w) => String(w.code) === String(wardCode));
}

export function addressLabel(
  provinceCode?: string | null,
  districtCode?: string | null,
  wardCode?: string | null,
  detail?: string | null
) {
  const parts: string[] = [];
  if (detail) parts.push(detail);
  const w = findWard(provinceCode, districtCode, wardCode);
  if (w) parts.push(w.name);
  const d = findDistrict(provinceCode, districtCode);
  if (d) parts.push(d.name);
  const p = findProvince(provinceCode);
  if (p) parts.push(p.name);
  return parts.join(", ");
}

