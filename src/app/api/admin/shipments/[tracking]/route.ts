import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{
    tracking: string;
  }>;
};

async function resolveShipmentId(
  trackingNumber: string,
  token: string,
) {
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

  if (!response.ok) {
    return {
      error: NextResponse.json(data, {
        status: response.status,
      }),
    };
  }

  const shipments = Array.isArray(data)
    ? data
    : Array.isArray(data?.shipments)
      ? data.shipments
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const shipment = shipments.find(
    (item: { tracking_number?: string }) =>
      item?.tracking_number?.toLowerCase() ===
      trackingNumber.toLowerCase(),
  );

  if (!shipment?.id) {
    return {
      error: NextResponse.json(
        {
          detail:
            "Shipment not found for this tracking number.",
        },
        {
          status: 404,
        },
      ),
    };
  }

  return {
    shipmentId: shipment.id as string,
  };
}

export async function GET(
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

  const { tracking } = await context.params;
  const trackingNumber =
    decodeURIComponent(tracking);

  try {
    const resolved =
      await resolveShipmentId(
        trackingNumber,
        token,
      );

    if ("error" in resolved) {
      return resolved.error;
    }

    const response = await fetch(
      `${API_URL}/api/v1/admin/shipments/${encodeURIComponent(
        resolved.shipmentId,
      )}`,
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
      {
        detail:
          "Shipment service is unavailable.",
      },
      { status: 503 },
    );
  }
}

export async function PATCH(
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

  const { tracking } = await context.params;
  const trackingNumber =
    decodeURIComponent(tracking);

  try {
    const body = await request.json();

    const resolved =
      await resolveShipmentId(
        trackingNumber,
        token,
      );

    if ("error" in resolved) {
      return resolved.error;
    }

    const response = await fetch(
      `${API_URL}/api/v1/admin/shipments/${encodeURIComponent(
        resolved.shipmentId,
      )}`,
      {
        method: "PATCH",
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
        detail:
          "Shipment update service is unavailable.",
      },
      { status: 503 },
    );
  }
}

export async function DELETE(
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

  const { tracking } = await context.params;
  const trackingNumber =
    decodeURIComponent(tracking);

  try {
    const resolved =
      await resolveShipmentId(
        trackingNumber,
        token,
      );

    if ("error" in resolved) {
      return resolved.error;
    }

    const response = await fetch(
      `${API_URL}/api/v1/admin/shipments/${encodeURIComponent(
        resolved.shipmentId,
      )}`,
      {
        method: "DELETE",
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
          "Shipment archive service is unavailable.",
      },
      { status: 503 },
    );
  }
}