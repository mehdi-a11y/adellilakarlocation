import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/compte");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Mon compte</h1>
      <p className="mt-2 text-slate-600">
        Bienvenue {profile?.nom || user.email}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Profil</h2>
          <p className="mt-2 text-sm text-slate-600">Email : {user.email}</p>
          <p className="text-sm text-slate-600">
            Téléphone : {profile?.telephone || "Non renseigné"}
          </p>
        </div>

        <Link
          href="/compte/reservations"
          className="rounded-xl border border-slate-200 bg-white p-6 hover:border-emerald-300"
        >
          <h2 className="font-semibold text-slate-900">Mes réservations</h2>
          <p className="mt-2 text-sm text-slate-600">
            Consultez vos demandes de réservation.
          </p>
        </Link>
      </div>
    </main>
  );
}
