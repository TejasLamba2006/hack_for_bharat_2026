import { NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.BACKEND_API_URL || "http://207.244.225.17:9001"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      // Add timeout to avoid hanging
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: "connected",
        backend: BACKEND_URL,
        backendHealth: data,
      });
    } else {
      return NextResponse.json({
        status: "error",
        backend: BACKEND_URL,
        error: `Backend returned ${response.status}`,
      }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({
      status: "disconnected",
      backend: BACKEND_URL,
      error: String(error),
    }, { status: 502 });
  }
}
