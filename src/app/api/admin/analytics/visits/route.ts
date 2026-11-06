import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(
    "gl_access_token",
  )?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required." },
      { status: 401 },
    );
  }

  const params = request.nextUrl.searchParams;
  const days = params.get("days") ?? "30";
  const limit = params.get("limit") ?? "50";
  const offset = params.get("offset") ?? "0";

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/analytics/visits?days=${encodeURIComponent(days)}&limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { detail: "Analytics service is unavailable." },
      { status: 503 },
    );
  }
}