"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";

/* =================== Tipos =================== */
type Calificacion = {
  id_calificacion: number | string | null;
  numero_calificacion: number | string | null;
  calificacion: string | number | null;
};

type MateriaInfo = {
  id_grupo: number;
  nombre_materia: string;
  clave_materia: string;
  letra_grupo: string;
};

type MateriaItem = {
  materia: MateriaInfo;
  // el backend a veces manda "calificaiones" (typo). Lo toleramos.
  calificaiones?: Calificacion[];
  calificaciones?: Calificacion[];
};

type Periodo = {
  clave_periodo: string;
  anio: number;
  descripcion_periodo: string;
};

type PeriodoBlock = {
  periodo: Periodo;
  materias: MateriaItem[];
};

type ApiResponse = {
  code: number;
  message: string;
  flag: boolean;
  data: PeriodoBlock[];
};

/* =================== Página =================== */
export default function CalificacionesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoBlock[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      setError(null);
      setPeriodos(null);

      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch("/api/calificaciones", {
          method: "GET",
          headers: {
            "x-auth-token": token,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            clearToken();
            setError("Tu sesión expiró o es inválida. Vuelve a iniciar sesión.");
            return;
          }
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            msg = (j?.message as string) ?? (j?.error as string) ?? msg;
          } catch {}
          throw new Error(msg);
        }

        const j: ApiResponse = await res.json();
        setPeriodos(Array.isArray(j?.data) ? j.data : []);
      } catch (e: any) {
        setError(e?.message ?? "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [router]);

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-semibold text-zinc-900">Calificaciones</h1>
          
        </header>

        {loading && (
          <p className="text-sm text-zinc-600">Cargando calificaciones…</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error} <a className="underline ml-2" href="/login">Ir al login</a>
          </div>
        )}

        {!loading && !error && (!periodos || periodos.length === 0) && (
          <p className="text-sm text-zinc-600">Sin datos de calificaciones.</p>
        )}

        {periodos && periodos.map((blk, i) => (
          <PeriodoCard key={i} blk={blk} />
        ))}
      </div>
    </main>
  );
}

/* =================== Secciones =================== */

function PeriodoCard({ blk }: { blk: PeriodoBlock }) {
  const { periodo, materias } = blk;
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3 text-zinc-900">
        {periodo.descripcion_periodo} • {periodo.anio} • {periodo.clave_periodo}
      </h2>

      {/* Dos columnas en md+ */}
      <div className="grid gap-4 md:grid-cols-2">
        {materias.map((m, idx) => (
          <MateriaCard key={idx} item={m} />
        ))}
      </div>
    </section>
  );
}

function MateriaCard({ item }: { item: MateriaItem }) {
  const rows = (item.calificaciones || item.calificaiones || []) as Calificacion[];

  // Calcula promedio, máximo y estado (ignora nulos/guiones)
  const nums = rows
    .map((c) => toNumber(c.calificacion))
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  const avg = nums.length
    ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2))
    : null;
  const max = nums.length ? Math.max(...nums) : null;

  // Cambia 70 por tu umbral real
  const aprobado = avg !== null ? avg >= 70 : null;

  const title =
    item.materia.nombre_materia?.toUpperCase() || "MATERIA";
  const subtitle = `${item.materia.clave_materia} • Grupo ${item.materia.letra_grupo} • #${item.materia.id_grupo}`;

  return (
    <article className="rounded-xl border border-zinc-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
            <p className="text-xs text-zinc-600">{subtitle}</p>
          </div>

          {/* Pill de estado */}
          {aprobado !== null && (
            <span
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium " +
                (aprobado
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200")
              }
            >
              <span
                className={
                  "h-2 w-2 rounded-full " + (aprobado ? "bg-emerald-600" : "bg-red-600")
                }
              />
              {aprobado ? "Aprobado" : "Reprobado"}
            </span>
          )}
        </div>

        {/* Mini stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center">
            <div className="text-xs text-zinc-600">Parciales</div>
            <div className="text-sm font-semibold text-zinc-900">
              {rows.length || "—"}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center">
            <div className="text-xs text-zinc-600">Promedio</div>
            <div className="text-sm font-semibold text-zinc-900">
              {avg ?? "—"}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center">
            <div className="text-xs text-zinc-600">Calif. máx</div>
            <div className="text-sm font-semibold text-zinc-900">
              {max ?? "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla compacta */}
      <div className="border-t border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-zinc-700">
              <th className="text-left p-2 font-medium"># Parcial</th>
              <th className="text-left p-2 font-medium">Calificación</th>
            </tr>
          </thead>
          <tbody className="text-zinc-900">
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-zinc-600">
                  Sin calificaciones registradas
                </td>
              </tr>
            )}
            {rows.map((c, i) => (
              <tr key={`${c.id_calificacion ?? i}`} className="border-t">
                <td className="p-2">{toText(c.numero_calificacion)}</td>
                <td className="p-2">{toText(c.calificacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

/* =================== Helpers =================== */
function toText(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === "—" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
