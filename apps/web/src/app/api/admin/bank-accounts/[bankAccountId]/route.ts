import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

type Context = {
  params: Promise<{ bankAccountId: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  const token = request.cookies.get("gl_access_token")?.value;
  if (!token) return NextResponse.json({ detail: "Authentication required." }, { status: 401 });

  const { bankAccountId } = await context.params;
  if (!bankAccountId) return NextResponse.json({ detail: "Bank account ID is required." }, { status: 400 });

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/bank-accounts/${encodeURIComponent(bankAccountId)}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
      },
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Bank account service is unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  const token = request.cookies.get("gl_access_token")?.value;
  if (!token) return NextResponse.json({ detail: "Authentication required." }, { status: 401 });

  const { bankAccountId } = await context.params;
  if (!bankAccountId) return NextResponse.json({ detail: "Bank account ID is required." }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid request body." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/bank-accounts/${encodeURIComponent(bankAccountId)}`,
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
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Bank account service is unavailable." }, { status: 503 });
  }
}
