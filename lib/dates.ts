import {
  addDays,
  eachDayOfInterval,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(value: string): Date {
  return parseISO(value);
}

export function getNightsInRange(dateDebut: string, dateFin: string): string[] {
  const start = parseDateKey(dateDebut);
  const end = parseDateKey(dateFin);

  if (isBefore(end, start)) {
    return [];
  }

  return eachDayOfInterval({ start, end: addDays(end, -1) }).map(toDateKey);
}

export function expandRangesToDateKeys(
  ranges: { date_debut: string; date_fin: string }[]
): Set<string> {
  const keys = new Set<string>();

  for (const range of ranges) {
    getNightsInRange(range.date_debut, range.date_fin).forEach((key) =>
      keys.add(key)
    );
  }

  return keys;
}

export function dateKeysToDates(keys: Set<string>): Date[] {
  return Array.from(keys).map((key) => startOfDay(parseDateKey(key)));
}

export function isPastDate(date: Date): boolean {
  const today = startOfDay(new Date());
  return isBefore(startOfDay(date), today);
}
