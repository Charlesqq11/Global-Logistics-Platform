import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    paymentRequestId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const token = request.cookies.get("gl_access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required." },
      { status: 401 },
    );
  }

  const { paymentRequestId } = await context.params;

  if (!paymentRequestId) {
    return NextResponse.json(
      { detail: "Payment request ID is required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/customer/payments/${encodeURIComponent(paymentRequestId)}`,
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

    if (!response.ok) {
      return NextResponse.json(
        {
          detail:
            data?.detail ??
            "Unable to retrieve payment request.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Customer service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
