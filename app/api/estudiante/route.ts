import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // El token llega del cliente en este header
    const token = req.headers.get("x-auth-token");
    if (!token) {
      return NextResponse.json({ error: "Falta token (x-auth-token)" }, { status: 401 });
    }

    const upstream = process.env.ESTUDIANTE_UPSTREAM_URL; // https://cetech.roque.tecnm.mx/api/movil/estudiante
    if (!upstream) {
      return NextResponse.json({ error: "ESTUDIANTE_UPSTREAM_URL no está definida" }, { status: 500 });
    }

    const r = await fetch(upstream, {
      method: "GET",
      headers: {
        Accept: "application/json",
       
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const text = await r.text();
   
    console.log("[ESTUDIANTE]", r.status, r.statusText, text.slice(0, 180));

    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Proxy error" }, { status: 500 });
  }
}
