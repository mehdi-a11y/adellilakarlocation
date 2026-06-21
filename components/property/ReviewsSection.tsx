import Stars from "@/components/property/Stars";

type Review = {
  id: string;
  note: number;
  commentaire: string;
  created_at: string;
  profiles?: { nom: string | null } | null;
};

type ReviewsSectionProps = {
  reviews: Review[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });
}

export default function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((sum, review) => sum + review.note, 0) / count
      : 0;

  return (
    <div>
      <div className="flex items-center gap-4">
        <h2 className="heading-display text-2xl">Avis clients</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={average} />
            <span className="text-sm text-ink-muted">
              {average.toFixed(1)} · {count} avis
            </span>
          </div>
        )}
      </div>

      {count === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          Aucun avis pour le moment. Soyez le premier à séjourner ici !
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="card-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink">
                  {review.profiles?.nom || "Client"}
                </p>
                <Stars value={review.note} size={15} />
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {formatDate(review.created_at)}
              </p>
              {review.commentaire && (
                <p className="mt-3 text-sm text-ink-soft">{review.commentaire}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
