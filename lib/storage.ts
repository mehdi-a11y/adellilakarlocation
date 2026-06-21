import { STORAGE_BUCKET } from "@/lib/constants";

export function getStoragePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(index + marker.length));
}

export function getPublicImageUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
