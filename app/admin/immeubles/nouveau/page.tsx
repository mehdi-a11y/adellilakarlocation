import Link from "next/link";
import BuildingForm from "@/components/admin/BuildingForm";

export default function NewBuildingPage() {
  return (
    <main>
      <Link href="/admin/immeubles" className="text-sm text-brand-700 hover:underline">
        ← Retour à la liste
      </Link>
      <h1 className="mt-4 heading-display text-3xl">Nouvel immeuble</h1>
      <p className="mt-2 text-ink-muted">
        Créez l&apos;immeuble puis ajoutez les appartements à l&apos;étape suivante.
      </p>
      <div className="mt-8">
        <BuildingForm mode="create" />
      </div>
    </main>
  );
}
