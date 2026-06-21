"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Logo from "@/components/Logo";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const { user, loading, isAdmin } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = useMemo(
    () => [
      { href: "/", label: t.nav.home },
      { href: "/biens", label: t.nav.properties },
      { href: "/#atouts", label: t.nav.whyUs },
      { href: "/#contact", label: t.nav.contact },
    ],
    [t]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/80 bg-white/90 backdrop-blur-md"
          : "border-b border-transparent bg-white"
      }`}
    >
      <div className="container flex h-16 items-center justify-between gap-3">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {loading ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-slate-100" />
          ) : isAdmin && user ? (
            <>
              <Link href="/admin" className="btn-secondary">
                {t.nav.dashboard}
              </Link>
              <button type="button" onClick={handleLogout} className="btn-ghost">
                {t.nav.logout}
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-secondary">
              {t.nav.adminSpace}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-ink"
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-slate-100 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-slate-100 pt-3">
              {isAdmin && user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/admin" className="btn-primary w-full">
                    {t.nav.dashboard}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-secondary w-full"
                  >
                    {t.nav.logout}
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-secondary w-full">
                  {t.nav.adminSpace}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
