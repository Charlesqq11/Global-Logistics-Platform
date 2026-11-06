import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

async function getToken(
  request: NextRequest,
): Promise<string | null> {
  return (
    request.cookies.get("gl_access_token")?.value ??
    null
  );
}

export async function GET(
  request: NextRequest,
) {
  const token = await getToken(request);

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

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/shipments`,
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
        detail: "Shipment service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const token = await getToken(request);

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
      `${API_URL}/api/v1/admin/shipments`,
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
        detail: "Shipment service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}