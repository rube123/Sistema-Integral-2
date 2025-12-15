"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black text-center p-8">
      <div className="w-full max-w-lg rounded-2xl border shadow-sm bg-white dark:bg-zinc-900 p-8">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50 mb-4">
          Bienvenido al Sistema SII2
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Accede a tu cuenta para continuar con tus actividades académicas.
        </p>

        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl font-medium bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-300 transition"
        >
          Iniciar sesión
        </Link>
      </div>

      <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-400">
        © {new Date().getFullYear()} TecNM – Campus Celaya
      </footer>
    </main>
  );
}
