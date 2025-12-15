"use client";
import { useEffect, useMemo, useState } from "react";
import { getToken, clearToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

type Materia = {
  id_grupo: number | string;
  nombre_materia: string;
  clave_materia: string;
  lunes?: string | null;
  lunes_clave_salon?: string | null;
  martes?: string | null;
  martes_clave_salon?: string | null;
  miercoles?: string | null;
  miercoles_clave_salon?: string | null;
  jueves?: string | null;
  jueves_clave_salon?: string | null;
  viernes?: string | null;
  viernes_clave_salon?: string | null;
  sabado?: string | null;
  sabado_clave_salon?: string | null;
};

export default function HorarioPage() {
  const router = useRouter();

  const [horario, setHorario] = useState<Materia[]>([]);
  const [periodo, setPeriodo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHorario = async () => {
      const token = getToken();

      // ⛔️ Sin token → redirige a login
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch("/api/horarios", {
          headers: { "x-auth-token": token },
          cache: "no-store",
        });

        // ⛔️ Token inválido/expirado → limpia y redirige
        if (res.status === 401 || res.status === 403) {
          clearToken();
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (res.ok) {
          const materias = (data.data?.[0]?.horario || []) as Materia[];
          const periodoInfo = data.data?.[0]?.periodo || null;
          setHorario(materias);
          setPeriodo(periodoInfo);
        } else {
          setError(data.error || "Error al obtener el horario.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHorario();
  }, [router]);

  // ---- helpers de ordenamiento por hora ----
  const days: (keyof Materia)[] = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

  function parseStartMinutes(range?: string | null): number | null {
    if (!range) return null;
    const head = String(range).split("(")[0].trim(); // "18:00-19:00"
    const time = head.split("-")[0]?.trim(); // "18:00"
    const m = /^(\d{1,2}):(\d{2})$/.exec(time || "");
    if (!m) return null;
    const hh = Number(m[1]), mm = Number(m[2]);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  }
  function parseRange(range?: string | null): { startMin: number; endMin: number } | null {
    if (!range) return null;
    const head = String(range).split("(")[0].trim(); // "15:00-17:00"
    const [a, b] = head.split("-").map((s) => s.trim());
    const ma = /^(\d{1,2}):(\d{2})$/.exec(a || "");
    const mb = /^(\d{1,2}):(\d{2})$/.exec(b || "");
    if (!ma || !mb) return null;
    const aMin = Number(ma[1]) * 60 + Number(ma[2]);
    const bMin = Number(mb[1]) * 60 + Number(mb[2]);
    return { startMin: aMin, endMin: bMin };
  }
  function firstStart(m: Materia): number {
    let best = Infinity;
    for (const d of days) {
      const mins = parseStartMinutes(m[d] as any);
      if (mins !== null && mins < best) best = mins;
    }
    return best;
  }

  const horarioOrdenado = useMemo(() => {
    const arr = [...horario];
    arr.sort((a, b) => {
      const sa = firstStart(a);
      const sb = firstStart(b);
      if (sa === sb) return String(a.nombre_materia).localeCompare(String(b.nombre_materia));
      return sa - sb;
    });
    return arr;
  }, [horario]);

  // ---- GENERAR PDF con tarjetas por día ----
  function descargarPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const paddingX = 36;
    const paddingY = 36;

    const titleFont = 16;
    const dayFont = 14;
    const textFont = 11;

    const palettes: [number, number, number][] = [
      [243, 156, 18],  // naranja
      [52, 152, 219],  // azul
      [231, 76, 60],   // rojo
      [46, 204, 113],  // verde
      [155, 89, 182],  // morado
      [26, 188, 156],  // turquesa
    ];

    function parseRangeLocal(range?: string | null): { startMin: number; endMin: number } | null {
      if (!range) return null;
      const head = String(range).split("(")[0].trim();
      const [a, b] = head.split("-").map((s) => s.trim());
      const ma = /^(\d{1,2}):(\d{2})$/.exec(a || "");
      const mb = /^(\d{1,2}):(\d{2})$/.exec(b || "");
      if (!ma || !mb) return null;
      const aMin = Number(ma[1]) * 60 + Number(ma[2]);
      const bMin = Number(mb[1]) * 60 + Number(mb[2]);
      return { startMin: aMin, endMin: bMin };
    }
    function time12(mins: number) {
      let h = Math.floor(mins / 60);
      const m = mins % 60;
      const am = h < 12 ? "a. m." : "p. m.";
      if (h === 0) h = 12;
      if (h > 12) h -= 12;
      const mm = String(m).padStart(2, "0");
      return `${h}:${mm} ${am}`;
    }
    function addPageIfNeeded(nextY: number) {
      if (nextY > pageH - paddingY) {
        doc.addPage();
        y = paddingY;
      }
    }

    type Slot = { nombre: string; range: string; start: number; end: number };
    const map: Record<string, Slot[]> = {
      Lunes: [], Martes: [], Miércoles: [], Jueves: [], Viernes: [], Sábado: [],
    };

    (horario || []).forEach((m: any) => {
      ([
        ["Lunes", "lunes", "lunes_clave_salon"],
        ["Martes", "martes", "martes_clave_salon"],
        ["Miércoles", "miercoles", "miercoles_clave_salon"],
        ["Jueves", "jueves", "jueves_clave_salon"],
        ["Viernes", "viernes", "viernes_clave_salon"],
        ["Sábado", "sabado", "sabado_clave_salon"],
      ] as const).forEach(([dia, key, keySalon]) => {
        const rango = m[key] as string | null | undefined;
        if (!rango) return;
        const parsed = parseRangeLocal(rango);
        if (!parsed) return;

        const salon = m[keySalon] ? ` ${m[keySalon]}` : "";
        map[dia].push({
          nombre: `${m.nombre_materia}${salon}`,
          range: rango.split("(")[0].trim(),
          start: parsed.startMin,
          end: parsed.endMin,
        });
      });
    });
    Object.keys(map).forEach((d) => map[d].sort((a, b) => a.start - b.start));

    let y = paddingY;

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(titleFont);
    doc.text("Horario del estudiante", paddingX, y);

    if (periodo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const sub = `${periodo?.descripcion_periodo ?? ""} — ${periodo?.clave_periodo ?? ""} (${periodo?.anio ?? ""})`;
      doc.text(sub, paddingX, y + 18);
      y += 32;
    } else {
      y += 18;
    }

    const dayOrder = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"] as const;

    for (const dia of dayOrder) {
      const slots = map[dia];
      if (!slots.length) continue;

      addPageIfNeeded(y + 30);

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(dayFont);
      doc.text(dia, paddingX, y);
      y += 10;

      const cardH = 52, gap = 8;

      for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        const color = palettes[i % palettes.length];

        addPageIfNeeded(y + cardH + gap);

        const rx = paddingX, ry = y, rw = pageW - paddingX * 2, rh = cardH;

        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(rx, ry, rw, rh, 8, 8, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(textFont);
        doc.text(time12(s.start), rx + 10, ry + 18);
        doc.text(time12(s.end), rx + 10, ry + 36);

        const contentX = rx + 140;
        const maxW = rw - 150;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(s.nombre, contentX, ry + 20, { maxWidth: maxW });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(s.range, contentX, ry + 36);

        y += rh + gap;
      }

      y += 6;
    }

    const nombre = `horario_${periodo?.clave_periodo ?? "periodo"}.pdf`;
    doc.save(nombre);
  }

  // ---- UI ----
  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <p className="text-gray-600">Cargando horario…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
          <div className="rounded-lg border border-red-300 bg-red-50 text-red-700 p-4">
            {error}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-2xl font-semibold mb-1 text-zinc-900">Horario del estudiante</h2>
          {periodo && (
            <p className="text-sm text-zinc-600 mb-4">
              <span className="font-semibold text-zinc-800">{periodo.descripcion_periodo}</span>{" "}
              — {periodo.clave_periodo} ({periodo.anio})
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left rounded-lg overflow-hidden">
              <thead className="bg-zinc-100 text-zinc-700">
                <tr>
                  <th className="p-3 border border-zinc-200">Materia</th>
                  <th className="p-3 border border-zinc-200">Clave</th>
                  <th className="p-3 border border-zinc-200">Lunes</th>
                  <th className="p-3 border border-zinc-200">Martes</th>
                  <th className="p-3 border border-zinc-200">Miércoles</th>
                  <th className="p-3 border border-zinc-200">Jueves</th>
                  <th className="p-3 border border-zinc-200">Viernes</th>
                  <th className="p-3 border border-zinc-200">Sábado</th>
                </tr>
              </thead>
              <tbody className="text-zinc-900">
                {horarioOrdenado.map((materia) => (
                  <tr key={String(materia.id_grupo)} className="hover:bg-zinc-50">
                    <td className="p-3 border border-zinc-200 font-medium">{materia.nombre_materia}</td>
                    <td className="p-3 border border-zinc-200 text-zinc-700">{materia.clave_materia}</td>
                    <td className="p-3 border border-zinc-200">
                      {materia.lunes ? (
                        <>
                          {materia.lunes}{" "}
                          {materia.lunes_clave_salon && <span className="text-zinc-500">({materia.lunes_clave_salon})</span>}
                        </>
                      ) : (<span className="text-zinc-500">—</span>)}
                    </td>
                    <td className="p-3 border border-zinc-200">
                      {materia.martes ? (
                        <>
                          {materia.martes}{" "}
                          {materia.martes_clave_salon && <span className="text-zinc-500">({materia.martes_clave_salon})</span>}
                        </>
                      ) : (<span className="text-zinc-500">—</span>)}
                    </td>
                    <td className="p-3 border border-zinc-200">
                      {materia.miercoles ? (
                        <>
                          {materia.miercoles}{" "}
                          {materia.miercoles_clave_salon && <span className="text-zinc-500">({materia.miercoles_clave_salon})</span>}
                        </>
                      ) : (<span className="text-zinc-500">—</span>)}
                    </td>
                    <td className="p-3 border border-zinc-200">
                      {materia.jueves ? (
                        <>
                          {materia.jueves}{" "}
                          {materia.jueves_clave_salon && <span className="text-zinc-500">({materia.jueves_clave_salon})</span>}
                        </>
                      ) : (<span className="text-zinc-500">—</span>)}
                    </td>
                    <td className="p-3 border border-zinc-200">
                      {materia.viernes ? (
                        <>
                          {materia.viernes}{" "}
                          {materia.viernes_clave_salon && <span className="text-zinc-500">({materia.viernes_clave_salon})</span>}
                        </>
                      ) : (<span className="text-zinc-500">—</span>)}
                    </td>
                    <td className="p-3 border border-zinc-200">
                      {materia.sabado ? (
                        <>
                          {materia.sabado}{" "}
                          {materia.sabado_clave_salon && <span className="text-zinc-500">({materia.sabado_clave_salon})</span>}
                        </>
                      ) : (<span className="text-zinc-500">—</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón descargar PDF */}
          <div className="mt-4">
            <button
              onClick={descargarPDF}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Descargar PDF
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
