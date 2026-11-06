import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    proofId: string;
  }>;
};

export async function POST(
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
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/api/v1/admin/payment-proofs/${encodeURIComponent(proofId)}/reject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Payment rejection service is unavailable." },
      { status: 503 },
    );
  }
}
