import { ar } from "./ar";
import { fr } from "./fr";
import type { Dictionary, Locale } from "./types";

const dictionaries: Record<Locale, Dictionary> = { fr, ar };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.fr;
}

export function formatPrice(value: number, locale: Locale = "fr"): string {
  const formatted = new Intl.NumberFormat(
    locale === "ar" ? "ar-DZ" : "fr-DZ",
    { maximumFractionDigits: 0 }
  ).format(Math.round(value));

  return locale === "ar" ? `${formatted} د.ج` : `${formatted} DA`;
}

export function formatPropertyType(
  type: string,
  locale: Locale,
  dict: Dictionary
): string {
  if (type === "villa") return dict.common.villa;
  if (type === "appartement") return dict.common.apartment;
  return type;
}

export * from "./types";
