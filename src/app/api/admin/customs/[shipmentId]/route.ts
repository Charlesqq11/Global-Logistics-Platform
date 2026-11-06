import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL || "http://localhost:8000";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
  }>;
};

async function getAccessToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return cookieStore.get("gl_access_token")?.value ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { shipmentId } = await params;
    const token = await getAccessToken();

    if (!token) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 },
      );
    }

    const response = await fetch(
      `${API_URL}/api/v1/admin/customs/${shipmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "application/json",
      },
    });
  } catch (error) {
    console.error(
      "GET /api/admin/customs/[shipmentId] failed:",
      error,
    );

    return NextResponse.json(
      {
        detail: "Unable to load customs case.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { shipmentId } = await params;
    const token = await getAccessToken();

    if (!token) {
      return NextResponse.json(
        { detail: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.text();

    const response = await fetch(
      `${API_URL}/api/v1/admin/customs/${shipmentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
        cache: "no-store",
      },
    );

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "application/json",
      },
    });
  } catch (error) {
    console.error(
      "POST /api/admin/customs/[shipmentId] failed:",
      error,
    );

    return NextResponse.json(
      {
        detail: "Unable to create customs case.",
      },
      { status: 500 },
    );
  }
}