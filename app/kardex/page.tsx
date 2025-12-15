"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";

type MateriaKardex = {
  nombre_materia: string;
  clave_materia: string;
  periodo: string;
  creditos: string;
  calificacion: string;
  descripcion: string;
  semestre: number;
};

type KardexResponse = {
  code: number;
  message: string;
  flag: boolean;
  data: {
    porcentaje_avance: number;
    kardex: MateriaKardex[];
  };
};

export default function KardexPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kardex, setKardex] = useState<MateriaKardex[] | null>(null);
  const [avance, setAvance] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [inputSemester, setInputSemester] = useState<string>("");
  // estado del filtro por semestre (null = todos)

  const router = useRouter();

  useEffect(() => {
    async function cargar() {
      setError(null);
      setKardex(null);

      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch("/api/kardex", {
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

        const j: KardexResponse = await res.json();
        setKardex(j?.data?.kardex ?? []);
        setAvance(j?.data?.porcentaje_avance ?? null);
      } catch (e: any) {
        setError(e?.message ?? "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [router]);

  const grupos = useMemo(() => {
    const bySem: Record<number, MateriaKardex[]> = {};
    for (const m of kardex ?? []) {
      const s = Number(m.semestre ?? 0) || 0;
      if (!bySem[s]) bySem[s] = [];
      bySem[s].push(m);
    }
    const sortedSems = Object.keys(bySem)
      .map((k) => Number(k))
      .sort((a, b) => a - b);
    return sortedSems.map((sem) => ({
      semestre: sem,
      materias: bySem[sem],
    }));
  }, [kardex]);



  // Semestres disponibles para el combo

  const semesterOptions = useMemo(
    () => grupos.map((g) => g.semestre),
    [grupos]
  );



  // Grupos filtrados por el combo

  const gruposFiltrados = useMemo(() => {
    if (selectedSemester === null) return grupos;
    return grupos.filter((g) => g.semestre === selectedSemester);
  }, [grupos, selectedSemester]);


  // handlers buscador
  const applyInputSearch = () => {
    const n = Number(inputSemester);
    if (Number.isFinite(n) && n > 0) {
      setSelectedSemester(n);
    }
  };
  const clearSearch = () => {
    setSelectedSemester(null);
    setInputSemester("");
  };



  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Kardex del estudiante
          </h1>
        </header>

        {loading && (
          <p className="text-sm text-zinc-600">Cargando kardex...</p>
        )}

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error} <a href="/login" className="underline ml-2">Ir al login</a>
          </div>
        )}

        {avance !== null && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
              <span className="text-sm text-zinc-600">Porcentaje de avance</span>
              <span className="text-sm font-semibold text-zinc-900">{avance}%</span>
            </div>

            {/* Combobox de semestres */}
            <div className="flex items-center gap-2">
              <label htmlFor="semCombo" className="text-sm text-zinc-700">
                Filtrar por semestre:
              </label>
              <select
                id="semCombo"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                value={selectedSemester ?? ""}
                onChange={(e) =>
                  setSelectedSemester(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Todos</option>
                {semesterOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Buscador por semestre */}
        

        {!loading && !error && (!kardex || kardex.length === 0) && (
          <p className="text-sm text-zinc-600">Sin datos en el kardex.</p>
        )}

        {/* Secciones por semestre (filtradas) */}
        {gruposFiltrados.map((g) => (
          <SemestreSection key={g.semestre} semestre={g.semestre} materias={g.materias} />
        ))}

        {/* Si hay filtro activo pero no hay resultados */}
        {selectedSemester !== null && gruposFiltrados.length === 0 && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
            No hay materias registradas para el semestre {selectedSemester}.
          </div>
        )}
      </div>
    </main>
  );
}

function SemestreSection({
  semestre,
  materias,
}: {
  semestre: number;
  materias: MateriaKardex[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3 text-zinc-900">
        Semestre {semestre || "—"}
      </h2>

      {/* Dos columnas en md+ */}
      <div className="grid gap-4 md:grid-cols-2">
        {materias.map((m, idx) => (
          <MateriaKardexCard key={idx} m={m} />
        ))}
      </div>
    </section>
  );
}

function MateriaKardexCard({ m }: { m: MateriaKardex }) {
  const cal = toNumber(m.calificacion);
  const aprobado = cal !== null ? cal >= 70 : null; // cambia 70 por tu umbral
  const title = (m.nombre_materia || "Materia").toUpperCase();
  const subtitle = `${m.clave_materia} • ${m.periodo}`;

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
            <div className="text-xs text-zinc-600">Créditos</div>
            <div className="text-sm font-semibold text-zinc-900">
              {toText(m.creditos)}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center">
            <div className="text-xs text-zinc-600">Calificación</div>
            <div className="text-sm font-semibold text-zinc-900">
              {cal ?? "—"}
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center">
            <div className="text-xs text-zinc-600">Descripción</div>
            <div className="text-sm font-semibold text-zinc-900 truncate" title={m.descripcion}>
              {toText(m.descripcion)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

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
