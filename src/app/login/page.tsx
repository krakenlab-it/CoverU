import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
