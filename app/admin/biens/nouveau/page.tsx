import Link from "next/link";
import PropertyForm from "@/components/admin/PropertyForm";

export default function NewPropertyPage() {
  return (
    <main>
      <Link
        href="/admin/biens"
        className="text-sm text-brand-700 hover:underline"
      >
        ← Retour à la liste
      </Link>
      <h1 className="mt-4 heading-display text-3xl">Nouveau bien</h1>
      <p className="mt-2 text-ink-muted">
        Remplissez les informations et publiez ou enregistrez en brouillon.
      </p>
      <div className="mt-8">
        <PropertyForm mode="create" />
      </div>
    </main>
  );
}
