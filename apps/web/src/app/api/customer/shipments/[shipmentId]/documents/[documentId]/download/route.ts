import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    shipmentId: string;
    documentId: string;
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

  try {
    const { shipmentId, documentId } = await context.params;

    const response = await fetch(
      `${API_URL}/api/v1/customer/shipments/${encodeURIComponent(shipmentId)}/documents/${encodeURIComponent(documentId)}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      return NextResponse.json(
        {
          detail:
            data?.detail ??
            "Unable to download this document.",
        },
        { status: response.status },
      );
    }

    const file = await response.arrayBuffer();

    const headers = new Headers();

    headers.set(
      "Content-Type",
      response.headers.get("Content-Type") ??
        "application/octet-stream",
    );

    const disposition =
      response.headers.get("Content-Disposition");

    if (disposition) {
      headers.set("Content-Disposition", disposition);
    }

    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(file, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.json(
      {
        detail: "Document download service is unavailable.",
      },
      { status: 503 },
    );
  }
}