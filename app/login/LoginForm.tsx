"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthForm, { FormField, inputClassName } from "@/components/AuthForm";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError(
          "Profil introuvable. Demandez à un responsable de vous créer un compte admin dans Supabase (voir supabase/create-admin.sql)."
        );
        setLoading(false);
        return;
      }

      if (profile.role !== "admin") {
        await supabase.auth.signOut();
        setError(
          "Accès réservé aux administrateurs. Votre compte existe mais le rôle est « client ». Changez-le en « admin » dans Supabase → Table Editor → profiles."
        );
        setLoading(false);
        return;
      }

      router.push(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 px-4 py-16">
      <AuthForm
        title="Espace administrateur"
        subtitle="Connexion réservée à l'équipe Adel Immobilier. Les visiteurs peuvent consulter les biens sans compte."
        error={error}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" id="email">
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
            />
          </FormField>

          <FormField label="Mot de passe" id="password">
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
            />
          </FormField>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </AuthForm>
    </div>
  );
}
