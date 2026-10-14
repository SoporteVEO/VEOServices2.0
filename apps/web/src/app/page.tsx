"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isPortalOnlyRole, type UserRole } from "@/api/users/users.types";
import { authClient } from "@/lib/auth-client";
import { portalHome } from "@/lib/portal-access";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Honours the `redirect` set by the proxy (typically a QR deep link), and
 * otherwise sends portal-only roles straight to their portal since they have
 * no dashboard.
 */
function resolveLandingPath(role: UserRole | undefined): string {
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (redirect?.startsWith("/")) return redirect;
  return isPortalOnlyRole(role) ? portalHome() : "/dashboard";
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Credenciales inválidas");
      setLoading(false);
      return;
    }

    const user = data?.user as { role?: UserRole } | undefined;
    router.push(resolveLandingPath(user?.role));
  }

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col justify-between gap-10 p-6 sm:p-10">
        <BrandLogo priority className="h-7 w-auto self-start" />

        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow flex items-center gap-2 text-muted-foreground">
              <span aria-hidden className="size-2 bg-veo-lime" />
              VEO Services
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-muted-foreground">
              Inicie sesión con su cuenta corporativa para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div
                role="alert"
                className="border-l-2 border-destructive bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive"
              >
                {error}
              </div>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              sizeVariant="lg"
              className="mt-2 w-full"
              disabled={loading}
              loading={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} VEO · Publicidad exterior
        </p>
      </div>

      <div className="relative hidden overflow-hidden bg-veo-dark lg:block">
        <Image
          src="/brand/billboard-structure.jpg"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover object-[78%_center]"
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-veo-dark/90 p-10 text-white">
          <span aria-hidden className="h-0.5 w-12 bg-veo-lime" />
          <p className="max-w-md font-heading text-2xl font-semibold leading-snug">
            La operación de cada valla, en un solo lugar.
          </p>
          <p className="max-w-md text-sm text-veo-ice/80">
            Inventario, producción, instalación y reportes para todo el equipo.
          </p>
        </div>
      </div>
    </div>
  );
}
