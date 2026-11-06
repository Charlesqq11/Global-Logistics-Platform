import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

type RouteContext = {
  params: Promise<{ paymentRequestId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
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
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { detail: "A payment proof file is required." },
        { status: 400 },
      );
    }

    const uploadData = new FormData();
    uploadData.append("file", file, file.name);

    const response = await fetch(
      `${API_URL}/api/v1/customer/payments/${encodeURIComponent(paymentRequestId)}/proofs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: uploadData,
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Payment proof upload service is unavailable." },
      { status: 503 },
    );
  }
}
