"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartPoint = {
  month: string;
  total: number;
};

export default function ReservationsChart({ data }: { data: ChartPoint[] }) {
  const hasData = data.some((point) => point.total > 0);

  return (
    <div className="card-surface p-6">
      <h2 className="font-display text-lg font-semibold text-ink">
        Réservations par mois
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Demandes reçues sur les 6 derniers mois.
      </p>

      <div className="mt-6 h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3366ff" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#54607a" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#54607a" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(51,102,255,0.08)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                }}
                labelStyle={{ color: "#0b1220", fontWeight: 600 }}
              />
              <Bar
                dataKey="total"
                name="Réservations"
                fill="url(#barBlue)"
                radius={[8, 8, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Pas encore de données à afficher.
          </div>
        )}
      </div>
    </div>
  );
}
