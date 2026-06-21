import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Paramètre q requis." }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "dz");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "AdelImmobilier/1.0 (contact@adellilakarlocation.site)",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Impossible de géolocaliser cette adresse." },
      { status: 502 }
    );
  }

  const results = (await response.json()) as {
    lat: string;
    lon: string;
    display_name: string;
  }[];

  if (!results.length) {
    return NextResponse.json(
      { error: "Adresse introuvable. Ajustez l'adresse ou placez le marqueur sur la carte." },
      { status: 404 }
    );
  }

  const [result] = results;

  return NextResponse.json({
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    label: result.display_name,
  });
}
