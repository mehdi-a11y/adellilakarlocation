import type { Metadata } from "next";
import { Cairo, Inter, Playfair_Display } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { getLocale } from "@/lib/i18n/locale-server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["600", "700"],
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Adel Immobilier — Location de villas & appartements",
    template: "%s · Adel Immobilier",
  },
  description:
    "Villas avec piscine, appartements en bord de mer. Réservez votre location saisonnière en Algérie avec Adel Immobilier.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${playfair.variable} ${cairo.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-white font-sans text-ink antialiased">
        <LocaleProvider initialLocale={locale}>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
