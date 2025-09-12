export type Unit = {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
};

export function getMockUnits(): Unit[] {
  return [
    { id: "u1", code: "KG", name: "Kilogram", description: "Weight unit", status: "active" },
    { id: "u2", code: "G", name: "Gram", description: "Weight unit", status: "active" },
    { id: "u3", code: "L", name: "Liter", description: "Volume unit", status: "inactive" },
    { id: "u4", code: "ML", name: "Milliliter", description: "Volume unit", status: "active" },
  ];
}

