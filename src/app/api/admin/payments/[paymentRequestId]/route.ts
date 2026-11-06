import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      paymentRequestId: string;
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

  const { paymentRequestId } =
    await context.params;

  if (!paymentRequestId) {
    return NextResponse.json(
      {
        detail: "Payment request ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/payments/${encodeURIComponent(
        paymentRequestId,
      )}`,
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
      {
        detail:
          "Payment service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      paymentRequestId: string;
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

  const { paymentRequestId } =
    await context.params;

  const body = await request.json();

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/payments/${encodeURIComponent(
        paymentRequestId,
      )}/paid`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Payment service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      paymentRequestId: string;
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

  const { paymentRequestId } =
    await context.params;

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/payments/${encodeURIComponent(
        paymentRequestId,
      )}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Payment service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}