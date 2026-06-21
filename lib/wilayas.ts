export const ALGERIAN_WILAYAS = [
  "Adrar",
  "Chlef",
  "Laghouat",
  "Oum El Bouaghi",
  "Batna",
  "Béjaïa",
  "Biskra",
  "Béchar",
  "Blida",
  "Bouira",
  "Tamanrasset",
  "Tébessa",
  "Tlemcen",
  "Tiaret",
  "Tizi Ouzou",
  "Alger",
  "Djelfa",
  "Jijel",
  "Sétif",
  "Saïda",
  "Skikda",
  "Sidi Bel Abbès",
  "Annaba",
  "Guelma",
  "Constantine",
  "Médéa",
  "Mostaganem",
  "M'Sila",
  "Mascara",
  "Ouargla",
  "Oran",
  "El Bayadh",
  "Illizi",
  "Bordj Bou Arréridj",
  "Boumerdès",
  "El Tarf",
  "Tindouf",
  "Tissemsilt",
  "El Oued",
  "Khenchela",
  "Souk Ahras",
  "Tipaza",
  "Mila",
  "Aïn Defla",
  "Naâma",
  "Aïn Témouchent",
  "Ghardaïa",
  "Relizane",
  "Timimoun",
  "Bordj Badji Mokhtar",
  "Ouled Djellal",
  "Béni Abbès",
  "In Salah",
  "In Guezzam",
  "Touggourt",
  "Djanet",
  "El M'Ghair",
  "El Meniaa",
] as const;

export type AlgerianWilaya = (typeof ALGERIAN_WILAYAS)[number];

export function isAlgerianWilaya(value: string): value is AlgerianWilaya {
  return (ALGERIAN_WILAYAS as readonly string[]).includes(value);
}

export function getWilayaOptions(currentValue?: string) {
  if (currentValue && !isAlgerianWilaya(currentValue)) {
    return [currentValue, ...ALGERIAN_WILAYAS];
  }

  return [...ALGERIAN_WILAYAS];
}

export function sortWilayas(wilayas: string[]) {
  const order = new Map(ALGERIAN_WILAYAS.map((wilaya, index) => [wilaya, index]));

  return [...wilayas].sort((a, b) => {
    const indexA = order.get(a as AlgerianWilaya) ?? 999;
    const indexB = order.get(b as AlgerianWilaya) ?? 999;

    if (indexA !== indexB) {
      return indexA - indexB;
    }

    return a.localeCompare(b, "fr");
  });
}

export function getUniqueWilayas(values: (string | null | undefined)[]) {
  return sortWilayas(
    Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))))
  );
}
