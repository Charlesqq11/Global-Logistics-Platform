import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    proofId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const token = request.cookies.get(
    "gl_access_token",
  )?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required." },
      { status: 401 },
    );
  }

  const { proofId } = await context.params;

  if (!proofId) {
    return NextResponse.json(
      { detail: "Payment proof ID is required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/payment-proofs/${encodeURIComponent(proofId)}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({
        detail: "Unable to download payment proof.",
      }));

      return NextResponse.json(data, {
        status: response.status,
      });
    }

    const file = await response.arrayBuffer();

    return new NextResponse(file, {
      status: response.status,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition":
          response.headers.get("Content-Disposition") ??
          "attachment",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Payment proof download service is unavailable." },
      { status: 503 },
    );
  }
}
