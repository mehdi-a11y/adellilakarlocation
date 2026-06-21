"use client";

import "react-day-picker/dist/style.css";
import { differenceInCalendarDays } from "date-fns";
import { ar as arLocale, fr as frLocale } from "date-fns/locale";
import { useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { useLocale } from "@/components/providers/LocaleProvider";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import {
  dateKeysToDates,
  expandRangesToDateKeys,
  getNightsInRange,
  toDateKey,
} from "@/lib/dates";
import { formatPrice } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Range = { date_debut: string; date_fin: string };

type BookingWidgetProps = {
  propertyId: string;
  titre: string;
  ville: string;
  prixNuit: number;
  capacite: number;
  bookings: Range[];
  blocks: Range[];
};

function formatDateLabel(date: Date, locale: "fr" | "ar") {
  return date.toLocaleDateString(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingWidget({
  propertyId,
  titre,
  ville,
  prixNuit,
  capacite,
  bookings,
  blocks,
}: BookingWidgetProps) {
  const { locale, t } = useLocale();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contact, setContact] = useState({
    nom: "",
    telephone: "",
    email: "",
    message: "",
  });

  const unavailableKeys = useMemo(() => {
    const merged = new Set<string>();
    expandRangesToDateKeys(bookings).forEach((key) => merged.add(key));
    expandRangesToDateKeys(blocks).forEach((key) => merged.add(key));
    return merged;
  }, [bookings, blocks]);

  const unavailableDates = useMemo(
    () => dateKeysToDates(unavailableKeys),
    [unavailableKeys]
  );

  const nights =
    range?.from && range?.to
      ? Math.max(differenceInCalendarDays(range.to, range.from), 0)
      : 0;
  const total = nights * prixNuit;
  const nightLabel = nights > 1 ? t.common.nights : t.common.night;

  function handleSelect(next: DateRange | undefined) {
    setError(null);

    if (next?.from && next?.to) {
      const selectedNights = getNightsInRange(
        toDateKey(next.from),
        toDateKey(next.to)
      );
      const hasConflict = selectedNights.some((key) =>
        unavailableKeys.has(key)
      );

      if (hasConflict) {
        setError(t.booking.errorDates);
        setRange({ from: next.from, to: undefined });
        return;
      }
    }

    setRange(next);
  }

  function buildWhatsAppLink() {
    const lines = [`${t.booking.whatsappIntro} « ${titre} » (${ville}).`];

    if (range?.from && range?.to) {
      lines.push(
        `${t.booking.whatsappDates} : ${formatDateLabel(range.from, locale)} - ${formatDateLabel(range.to, locale)} (${nights} ${nightLabel}).`
      );
      lines.push(`${t.booking.whatsappGuests} : ${guests} ${t.common.persons}.`);
      lines.push(`${t.booking.whatsappTotal} : ${formatPrice(total, locale)}.`);
    } else {
      lines.push(`${t.booking.whatsappGuests} : ${guests} ${t.common.persons}.`);
    }

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const canReserve = Boolean(range?.from && range?.to && nights > 0);

  async function submitRequest() {
    if (!range?.from || !range?.to) return;
    setError(null);

    if (!contact.nom.trim() || !contact.telephone.trim()) {
      setError(t.booking.errorRequired);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("booking_requests").insert({
      property_id: propertyId,
      nom: contact.nom.trim(),
      telephone: contact.telephone.trim(),
      email: contact.email.trim() || null,
      date_debut: toDateKey(range.from),
      date_fin: toDateKey(range.to),
      nb_personnes: guests,
      prix_total: total,
      message: contact.message.trim() || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(t.booking.errorSubmit);
      return;
    }

    setSubmitted(true);
    setShowForm(false);
  }

  return (
    <div className="card-surface p-6">
      <div className="flex items-baseline justify-between">
        <p>
          <span className="text-2xl font-bold text-ink">
            {formatPrice(prixNuit, locale)}
          </span>
          <span className="text-sm text-ink-muted"> {t.booking.perNight}</span>
        </p>
        {nights > 0 && (
          <span className="text-sm text-ink-muted">
            {nights} {nightLabel}
          </span>
        )}
      </div>

      <div className="booking-calendar mt-4 flex justify-center rounded-xl border border-slate-100 p-2">
        <DayPicker
          mode="range"
          locale={locale === "ar" ? arLocale : frLocale}
          selected={range}
          onSelect={handleSelect}
          disabled={[{ before: new Date() }, ...unavailableDates]}
          modifiers={{ unavailable: unavailableDates }}
          modifiersClassNames={{ unavailable: "day-unavailable" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-emerald-500" />{" "}
          {t.booking.available}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-300" />{" "}
          {t.booking.unavailable}
        </span>
      </div>

      <div className="mt-4">
        <label htmlFor="guests" className="mb-1.5 block text-sm font-medium text-ink-soft">
          {t.booking.guests}
        </label>
        <select
          id="guests"
          value={guests}
          onChange={(event) => setGuests(Number(event.target.value))}
          className="input-field"
        >
          {Array.from({ length: capacite }).map((_, index) => {
            const value = index + 1;
            return (
              <option key={value} value={value}>
                {value} {t.common.persons}
              </option>
            );
          })}
        </select>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {canReserve && (
        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>
              {formatPrice(prixNuit, locale)} × {nights} {nightLabel}
            </span>
            <span>{formatPrice(total, locale)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-ink">
            <span>{t.booking.total}</span>
            <span>{formatPrice(total, locale)}</span>
          </div>
        </div>
      )}

      {submitted ? (
        <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-4 text-sm text-brand-800">
          <p className="font-semibold">{t.booking.successTitle}</p>
          <p className="mt-1">
            {t.booking.successMessage} {contact.nom ? `(${contact.nom})` : ""}
          </p>
        </div>
      ) : showForm ? (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder={t.booking.name}
            value={contact.nom}
            onChange={(e) => setContact({ ...contact, nom: e.target.value })}
            className="input-field"
          />
          <input
            type="tel"
            placeholder={t.booking.phone}
            value={contact.telephone}
            onChange={(e) => setContact({ ...contact, telephone: e.target.value })}
            className="input-field"
          />
          <input
            type="email"
            placeholder={t.booking.email}
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
            className="input-field"
          />
          <textarea
            placeholder={t.booking.message}
            rows={3}
            value={contact.message}
            onChange={(e) => setContact({ ...contact, message: e.target.value })}
            className="input-field"
          />
          <button
            type="button"
            onClick={submitRequest}
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? t.booking.sending : t.booking.sendRequest}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="btn-ghost w-full"
          >
            {t.booking.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (canReserve ? setShowForm(true) : undefined)}
          disabled={!canReserve}
          className={`btn mt-4 w-full ${
            canReserve
              ? "bg-brand-700 text-white hover:bg-brand-800"
              : "cursor-not-allowed bg-slate-200 text-ink-muted"
          }`}
        >
          {canReserve ? t.booking.bookNow : t.booking.chooseDates}
        </button>
      )}

      <a
        href={buildWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="btn mt-2 w-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
        {t.booking.whatsapp}
      </a>
    </div>
  );
}
