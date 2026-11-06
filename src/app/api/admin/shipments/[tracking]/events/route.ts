import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    tracking: string;
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
      {
        detail: "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  const { tracking } = await context.params;

  const trackingNumber =
    decodeURIComponent(tracking);

  if (!trackingNumber) {
    return NextResponse.json(
      {
        detail: "Tracking number is required.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const body = await request.json();

    /*
     * Resolve the human-facing tracking number
     * to the shipment UUID used by the backend.
     */
    const listResponse = await fetch(
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

    const listData =
      await listResponse.json();

    if (!listResponse.ok) {
      return NextResponse.json(
        listData,
        {
          status: listResponse.status,
        },
      );
    }

    const shipments = Array.isArray(listData)
      ? listData
      : Array.isArray(listData?.shipments)
        ? listData.shipments
        : Array.isArray(listData?.items)
          ? listData.items
          : [];

    const shipment = shipments.find(
      (item: {
        tracking_number?: string;
      }) =>
        item?.tracking_number?.toLowerCase() ===
        trackingNumber.toLowerCase(),
    );

    if (!shipment?.id) {
      return NextResponse.json(
        {
          detail:
            "Shipment not found for this tracking number.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * Forward the event to the real authenticated
     * FastAPI operation.
     */
    const eventResponse = await fetch(
      `${API_URL}/api/v1/admin/shipments/${encodeURIComponent(
        shipment.id,
      )}/events`,
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

    const eventData =
      await eventResponse.json();

    return NextResponse.json(
      eventData,
      {
        status: eventResponse.status,
      },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "Shipment event service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}