"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, getToken } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // rutas públicas donde no queremos navbar
  const isPublicRoute = pathname === "/login" || pathname === "/";

  useEffect(() => {
    const syncAuth = () => {
      const token = getToken();
      const logged = !!token;
      setIsLoggedIn(logged);

      // si ya no hay token y estamos en ruta protegida -> mandar a login
      if (!logged && !isPublicRoute) {
        router.replace("/login");
        router.refresh();
      }
    };

    // leer token al montar
    syncAuth();

    // escuchar cambios de auth_token en otras pestañas
    if (typeof window !== "undefined") {
      const handler = (e: StorageEvent) => {
        if (e.key === "auth_token") {
          syncAuth();
        }
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }
  }, [router, pathname, isPublicRoute]);

  if (isPublicRoute || !isLoggedIn) {
    return null;
  }

  const links = [
    { href: "/estudiante", label: "Inicio" },
    { href: "/horario", label: "Horario" },
    { href: "/calificaciones", label: "Calificaciones" },
    { href: "/kardex", label: "Kardex" },
  ];

  const onLogout = () => {
    clearToken();
    setIsLoggedIn(false);
    router.replace("/login");
    router.refresh();
  };

  return (
    <nav className="bg-white text-zinc-900 p-4 shadow-md flex items-center justify-between">
      <h1 className="text-lg font-semibold">SII2</h1>

      <ul className="flex items-center gap-6">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`hover:text-zinc-600 ${
                pathname === link.href ? "underline font-bold" : ""
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <button
            onClick={onLogout}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            Salir
          </button>
        </li>
      </ul>
    </nav>
  );
}
