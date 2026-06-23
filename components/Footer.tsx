"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useLocale } from "@/components/providers/LocaleProvider";
import { WHATSAPP_NUMBER } from "@/lib/constants";

const year = new Date().getFullYear();

export default function Footer() {
  const pathname = usePathname();
  const { t } = useLocale();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer id="contact" className="border-t border-slate-200 bg-slate-50">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-ink-muted">{t.footer.tagline}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">{t.footer.navigation}</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li>
                <Link href="/" className="transition hover:text-brand-700">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/biens" className="transition hover:text-brand-700">
                  {t.nav.properties}
                </Link>
              </li>
              <li>
                <Link href="/#atouts" className="transition hover:text-brand-700">
                  {t.nav.whyUs}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">{t.footer.categories}</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li>
                <Link
                  href="/biens?type=villa"
                  className="transition hover:text-brand-700"
                >
                  {t.footer.villas}
                </Link>
              </li>
              <li>
                <Link
                  href="/biens?type=appartement"
                  className="transition hover:text-brand-700"
                >
                  {t.footer.apartments}
                </Link>
              </li>
              <li>
                <Link
                  href="/biens?piscine=true"
                  className="transition hover:text-brand-700"
                >
                  {t.footer.withPool}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink">{t.nav.contact}</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  className="transition hover:text-brand-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@adel-immobilier.com"
                  className="transition hover:text-brand-700"
                >
                  contact@adel-immobilier.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-ink-muted sm:flex-row">
          <p>
            © {year} Adel Immobilier. {t.footer.rights}
          </p>
          <p>{t.footer.subtitle}</p>
        </div>
      </div>
    </footer>
  );
}
