// New lightweight source: provinces + wards, no districts
import provincesJson from "@/lib/provinces.json" with { type: "json" };
import wardsJson from "@/lib/wards.json" with { type: "json" };

export type Province = { id: string; name: string };
export type Ward = { id: string; name: string; province_id: string; province_name: string };

export const provinces: Province[] = provincesJson as Province[];
export const wards: Ward[] = wardsJson as Ward[];

export function findProvince(id?: string | null): Province | undefined {
  if (!id) return undefined;
  return provinces.find((p) => String(p.id) === String(id));
}

export function wardsOfProvince(provinceId?: string | null): Ward[] {
  if (!provinceId) return [];
  return wards.filter((w) => String(w.province_id) === String(provinceId));
}

export function findWardById(id?: string | null): Ward | undefined {
  if (!id) return undefined;
  return wards.find((w) => String(w.id) === String(id));
}

// Backward-compatible addressLabel signature (ignore district argument if provided)
export function addressLabel(
  provinceId?: string | null,
  _districtCodeOrUnused?: string | null,
  wardId?: string | null,
  detail?: string | null
) {
  const parts: string[] = [];
  if (detail) parts.push(detail);
  const w = findWardById(wardId);
  if (w) parts.push(w.name);
  const p = findProvince(provinceId);
  if (p) parts.push(p.name);
  return parts.join(", ");
}
