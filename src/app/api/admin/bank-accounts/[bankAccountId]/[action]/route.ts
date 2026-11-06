import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bankAccountId: string; action: string }> },
) {
  const token = request.cookies.get("gl_access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  const { bankAccountId, action } = await context.params;

  if (!bankAccountId || !["activate", "deactivate"].includes(action)) {
    return NextResponse.json({ detail: "Invalid bank account action." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/${action}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Bank account service is unavailable." }, { status: 503 });
  }
}
