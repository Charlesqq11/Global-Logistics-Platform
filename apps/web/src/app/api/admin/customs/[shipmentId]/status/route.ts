import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      shipmentId: string;
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

  const { shipmentId } = await context.params;

  if (!shipmentId) {
    return NextResponse.json(
      {
        detail: "Shipment ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/api/v1/admin/customs/${encodeURIComponent(
        shipmentId,
      )}/status`,
      {
        method: "PATCH",
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
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Customs service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}