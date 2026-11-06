import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      customsCaseId: string;
    }>;
  },
) {
  const token = request.cookies.get(
    "gl_access_token",
  )?.value;

  if (!token) {
    return NextResponse.json(
      {
        detail: "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  const { customsCaseId } = await context.params;

  if (!customsCaseId) {
    return NextResponse.json(
      {
        detail: "Customs case ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        detail: "Invalid request body.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/payments/customs/${encodeURIComponent(
        customsCaseId,
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        detail: "Payment service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}