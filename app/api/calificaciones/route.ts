import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("x-auth-token");
    if (!token) {
      return NextResponse.json({ error: "Falta token (x-auth-token)" }, { status: 401 });
    }

    const upstream = process.env.CALIFICACIONES_UPSTREAM_URL;
    if (!upstream) {
      return NextResponse.json({ error: "CALIFICACIONES_UPSTREAM_URL no está definida" }, { status: 500 });
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
    // console.log("[CALIFICACIONES]", r.status, r.statusText, text.slice(0, 200));
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Proxy error" }, { status: 500 });
  }
}
