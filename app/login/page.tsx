import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-73px)] items-center justify-center bg-slate-50">
          <p className="text-slate-500">Chargement...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
