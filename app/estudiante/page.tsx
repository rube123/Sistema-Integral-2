"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/auth";
import {
  Mail,
  CalendarDays,
  ShieldCheck,
  BookOpenCheck,
  LogOut,
  Gauge,
  Award,
  Layers3,
  CircleCheck,
  OctagonX,
} from "lucide-react";

type EstudianteData = {
  numero_control: string;
  persona: string;
  email: string;
  semestre: number;
  creditos_acumulados: string;
  promedio_ponderado: string;
  promedio_aritmetico: string;
  materias_cursadas: string;
  materias_reprobadas: string;
  materias_aprobadas: string;
  creditos_complementarios: number;
  porcentaje_avance: number;
  percentaje_avance_cursando: number;
  foto: string;
};

export default function EstudiantePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EstudianteData | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setError(null);
      const token = getToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch("/api/estudiante", {
          headers: { "x-auth-token": token, Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            clearToken();
            setError("Tu sesión expiró. Vuelve a iniciar sesión.");
          } else {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.message || j?.error || `HTTP ${res.status}`);
          }
        } else {
          const j = await res.json();
          setData(j?.data);
        }
      } catch (e: any) {
        setError(e?.message || "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const onLogout = () => {
    clearToken();
    router.replace("/login");
  };

  const goCalificaciones = () => router.push("/calificaciones");
  const goKardex = () => router.push("/kardex");
  const goHorario = () => router.push("/horario");

  return (
    <main className="bg-zinc-50 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header card (nombre + logout) */}
        <div className="grid gap-6 md:grid-cols-[1fr,360px]">
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">
                  {data?.persona ?? "—"}
                </h2>
                <p className="text-sm text-zinc-500">
                  Numero De Control: {data?.numero_control ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoIcon label={data?.email ?? "—"} text="Correo" icon={Mail} />
              <InfoIcon
                label={String(data?.semestre ?? "—")}
                text="Semestre"
                icon={CalendarDays}
              />
              <InfoIcon
                label="Ingeniería en Sistemas Computacionales"
                text="Carrera"
                icon={BookOpenCheck}
              />
              <InfoIcon label="Activo" text="Status" icon={ShieldCheck} />
            </div>
          </section>

          {/* Profile panel */}
          <aside className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-col items-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-zinc-200">
                {data?.foto ? (
                  <img
                    className="h-full w-full object-cover"
                    alt="Student"
                    src={`data:image/jpeg;base64,${data.foto}`}
                  />
                ) : (
                  <div className="h-full w-full bg-zinc-100" />
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={goHorario}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800"
              >
                <Layers3 className="h-4 w-4" />
                Horario
              </button>
              <button
                onClick={goCalificaciones}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-100 text-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-200"
              >
                <Award className="h-4 w-4" />
                Calificaciones
              </button>
            </div>
          </aside>
        </div>

        {/* Academic Progress */}
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
          <h4 className="mb-4 text-base font-semibold text-zinc-900">
            Academic Progress
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              value={data?.promedio_ponderado ?? "—"}
              label="Promedio Ponderado"
              icon={Gauge}
            />
            <StatCard
              value={data?.creditos_acumulados ?? "—"}
              label="Creditos Acumulados"
              icon={Layers3}
            />
            <StatCard
              value={`${data?.porcentaje_avance ?? 0}%`}
              label="Avance"
              icon={Award}
            />
            <StatCard
              value={data?.materias_cursadas ?? "—"}
              label="Materias Cursadas"
              icon={BookOpenCheck}
            />
          </div>
        </section>

        {/* Course Status */}
        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
          <h4 className="mb-4 text-base font-semibold text-zinc-900">
            Materias
          </h4>

          <div className="flex items-center justify-between rounded-lg border bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-2 text-zinc-700">
              <CircleCheck className="h-4 w-4 text-emerald-600" />
              <span>Número de materias aprobadas</span>
            </div>
            <span className="font-semibold text-zinc-900">
              {data?.materias_aprobadas ?? "—"}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <OctagonX className="h-4 w-4" />
              <span>Número de materias reprobadas</span>
            </div>
            <span className="font-semibold text-red-700">
              {data?.materias_reprobadas ?? "—"}
            </span>
          </div>
        </section>
      </div>

      {/* estados de carga/errores (discretos, arriba de todo) */}
      {loading && (
        <div className="fixed inset-x-0 top-14 mx-auto max-w-2xl px-4">
          <div className="mt-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm">
            Cargando información del estudiante...
          </div>
        </div>
      )}
      {error && (
        <div className="fixed inset-x-0 top-14 mx-auto max-w-2xl px-4">
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
            {error}{" "}
            <button
              onClick={() => location.reload()}
              className="underline ml-1"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: string | number;
  label: string;
  icon: any;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-zinc-900">{value}</div>
          <div className="text-xs text-zinc-500">{label}</div>
        </div>
        <Icon className="h-5 w-5 text-zinc-500" />
      </div>
    </div>
  );
}

function InfoIcon({
  label,
  text,
  icon: Icon,
}: {
  label: string;
  text: string;
  icon: any;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <Icon className="h-4 w-4 text-zinc-600" />
      <div className="flex-1">
        <div className="text-sm text-zinc-600">{text}</div>
        <div className="text-sm font-medium text-zinc-900">{label}</div>
      </div>
    </div>
  );
}
