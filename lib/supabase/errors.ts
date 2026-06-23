type SupabaseErrorLike = {
  code?: string;
  message?: string;
} | null;

export function isMissingRelationError(
  error: SupabaseErrorLike,
  relation: string
) {
  if (!error) return false;

  if (error.code === "PGRST205" || error.code === "PGRST200") {
    return error.message?.includes(relation) ?? false;
  }

  return (
    error.message?.includes(relation) ??
    error.message?.includes("schema cache") ??
    false
  );
}
