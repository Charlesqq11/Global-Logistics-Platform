import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
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

  const { shipmentId } = await context.params;

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/shipments/${encodeURIComponent(shipmentId)}/documents`,
      {
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
      { detail: "Document service is unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(
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

  const { shipmentId } = await context.params;

  try {
    const formData = await request.formData();

    const response = await fetch(
      `${API_URL}/api/v1/admin/shipments/${encodeURIComponent(shipmentId)}/documents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { detail: "Document upload service is unavailable." },
      { status: 503 },
    );
  }
}