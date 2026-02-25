import { NextResponse } from "next/server";

// Server-side proxy to WeatherAPI to avoid CORS and keep the API key on the server.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "London";
    const aqi = url.searchParams.get("aqi") ?? "no";

    const key = process.env.WEATHERAPI_KEY;
    if (!key) {
      return NextResponse.json({ error: "Missing server WEATHERAPI_KEY" }, { status: 500 });
    }

    const target = `https://api.weatherapi.com/v1/current.json?key=${encodeURIComponent(
      key
    )}&q=${encodeURIComponent(q)}&aqi=${encodeURIComponent(aqi)}`;

    const res = await fetch(target, { method: "GET" });

    const contentType = res.headers.get("content-type") || "application/json";
    const body = await res.arrayBuffer();

    // Mirror status and content-type back to the client. This is same-origin so CORS not needed.
    return new Response(body, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
