import Link from "next/link";
import dynamic from "next/dynamic";
import {
  addDays,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/Skeleton";
import { getNightsInRange, parseDateKey } from "@/lib/dates";
import { formatPrice } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types";

const ReservationsChart = dynamic(
  () => import("@/components/admin/ReservationsChart"),
  {
    loading: () => (
      <div className="card-surface p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    ),
    ssr: false,
  }
);

type RequestRow = {
  id: string;
  property_id: string;
  prix_total: number;
  statut: BookingStatus;
  date_debut: string;
  created_at: string;
  nom: string;
  properties: { titre: string; ville: string } | null;
};

type StatCardProps = {
  label: string;
  value: string;
  accent?: boolean;
  icon: React.ReactNode;
  href?: string;
};

function StatCard({ label, value, accent, icon, href }: StatCardProps) {
  const inner = (
    <div className="card-surface flex h-full items-center gap-4 p-6 transition hover:shadow-glow-blue">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          accent
            ? "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
            : "bg-brand-50 text-brand-700"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          {icon}
        </svg>
      </span>
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);
  const monthStartKey = format(monthStart, "yyyy-MM-dd");
  const chartStart = subMonths(today, 5);
  const chartStartKey = format(startOfMonth(chartStart), "yyyy-MM-dd");

  const [
    { count: activeProperties },
    { count: pendingBookings },
    { data: revenueRows },
    { data: requestRows },
    { data: blockRows },
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif"),
    supabase
      .from("booking_requests")
      .select("*", { count: "exact", head: true })
      .eq("statut", "en_attente"),
    supabase
      .from("booking_requests")
      .select("prix_total")
      .eq("statut", "confirmee")
      .gte("date_debut", monthStartKey)
      .lte("date_debut", format(addDays(monthStart, 31), "yyyy-MM-dd")),
    supabase
      .from("booking_requests")
      .select(
        "id, property_id, prix_total, statut, date_debut, created_at, nom, properties(titre, ville)"
      )
      .gte("created_at", `${chartStartKey}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("availability_blocks").select("date_debut, date_fin"),
  ]);

  const requests = (requestRows ?? []) as unknown as RequestRow[];
  const blocks = (blockRows ?? []) as { date_debut: string; date_fin: string }[];

  const revenue = (revenueRows ?? []).reduce(
    (sum, row) => sum + Number(row.prix_total),
    0
  );

  // Taux d'occupation sur les 30 prochains jours
  const windowEnd = addDays(today, 30);
  let bookedNights = 0;
  for (const block of blocks) {
    for (const key of getNightsInRange(block.date_debut, block.date_fin)) {
      const day = parseDateKey(key);
      if (isWithinInterval(day, { start: today, end: windowEnd })) {
        bookedNights += 1;
      }
    }
  }
  const capacityNights = (activeProperties ?? 0) * 30;
  const occupancy =
    capacityNights > 0 ? Math.round((bookedNights / capacityNights) * 100) : 0;

  // Graphique : réservations par mois (6 derniers mois)
  const chartData = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = subMonths(today, 5 - index);
    const label = format(monthDate, "MMM", { locale: fr });
    const monthKey = format(monthDate, "yyyy-MM");
    const total = requests.filter(
      (r) => format(parseDateKey(r.created_at.slice(0, 10)), "yyyy-MM") === monthKey
    ).length;
    return { month: label, total };
  });

  // Biens les plus demandés
  const countByProperty = new Map<string, { titre: string; count: number }>();
  for (const r of requests) {
    const current = countByProperty.get(r.property_id);
    if (current) {
      current.count += 1;
    } else {
      countByProperty.set(r.property_id, {
        titre: r.properties?.titre ?? "Bien supprimé",
        count: 1,
      });
    }
  }
  const topProperties = Array.from(countByProperty.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const latestRequests = requests.slice(0, 5);

  const statusStyles: Record<BookingStatus, string> = {
    en_attente: "bg-amber-100 text-amber-800",
    confirmee: "bg-brand-50 text-brand-700",
    annulee: "bg-red-100 text-red-700",
    terminee: "bg-slate-100 text-slate-600",
  };
  const statusLabels: Record<BookingStatus, string> = {
    en_attente: "En attente",
    confirmee: "Confirmée",
    annulee: "Annulée",
    terminee: "Terminée",
  };

  return (
    <div>
      <h1 className="heading-display text-3xl">Tableau de bord</h1>
      <p className="mt-2 text-ink-muted">Vue d&apos;ensemble de votre activité.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Biens actifs"
          value={String(activeProperties ?? 0)}
          icon={
            <path
              d="M3 11.5 12 4l9 7.5M5 10v9h14v-9"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        />
        <StatCard
          label="Réservations en attente"
          value={String(pendingBookings ?? 0)}
          href="/admin/reservations?statut=en_attente"
          icon={
            <path
              d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        />
        <StatCard
          label="Revenus du mois"
          value={`${formatPrice(revenue)}`}
          accent
          icon={
            <path
              d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        />
        <StatCard
          label="Taux d'occupation (30j)"
          value={`${occupancy} %`}
          icon={
            <path
              d="M3 3v18h18M7 14l3-3 3 3 5-6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReservationsChart data={chartData} />
        </div>

        <div className="card-surface p-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            Biens les plus demandés
          </h2>
          {topProperties.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">Aucune donnée.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProperties.map((item, index) => (
                <li
                  key={item.titre + index}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-ink-soft">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                      {index + 1}
                    </span>
                    <span className="line-clamp-1">{item.titre}</span>
                  </span>
                  <span className="font-semibold text-ink">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card-surface mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Dernières réservations
          </h2>
          <Link
            href="/admin/reservations"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Tout voir
          </Link>
        </div>

        {latestRequests.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            Aucune demande de réservation pour l&apos;instant.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {latestRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    {request.properties?.titre ?? "Bien supprimé"}
                  </p>
                  <p className="text-sm text-ink-muted">{request.nom}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">
                    {formatPrice(Number(request.prix_total))}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[request.statut]}`}
                  >
                    {statusLabels[request.statut]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
