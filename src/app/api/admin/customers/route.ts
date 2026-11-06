import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

async function readBackendResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      detail: text,
    };
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("gl_access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/customers`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await readBackendResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("CUSTOMER GET PROXY ERROR:", error);

    return NextResponse.json(
      { detail: "Unable to connect to customer service." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("gl_access_token")?.value;

  if (!token) {
    return NextResponse.json(
      { detail: "Authentication required." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/admin/customers`,
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

    const data = await readBackendResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("CUSTOMER POST PROXY ERROR:", error);

    return NextResponse.json(
      { detail: "Unable to connect to customer service." },
      { status: 503 },
    );
  }
}