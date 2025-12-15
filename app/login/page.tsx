"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          msg = (j?.responseCodeTxt || j?.message || msg) as string;
        } catch {}
        throw new Error(msg);
      }

      const data = await res.json();
      const token = data?.message?.login?.token ?? null;
      if (!token) throw new Error("No se recibió token en la respuesta.");

      // ✅ Guarda el token y redirige automáticamente
     setToken(token);
     router.push("/estudiante");
    } catch (err: any) {
      setError(err?.message ?? "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border shadow-sm bg-white dark:bg-zinc-900 p-6">
        <h1 className="text-2xl font-semibold mb-1 text-black dark:text-zinc-50">
          Iniciar sesión
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Ingresa tu correo y contraseña para acceder a tu cuenta.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-black dark:text-zinc-50">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-black text-black dark:text-zinc-50"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-black dark:text-zinc-50">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-black text-black dark:text-zinc-50"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border px-4 py-2 font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
