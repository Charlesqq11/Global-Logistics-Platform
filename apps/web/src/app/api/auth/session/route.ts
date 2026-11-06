import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(
    "gl_access_token",
  )?.value;

  if (!token) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 401,
      },
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/api/v1/auth/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const nextResponse = NextResponse.json(
        {
          authenticated: false,
        },
        {
          status: 401,
        },
      );

      nextResponse.cookies.delete(
        "gl_access_token",
      );

      return nextResponse;
    }

    const user = await response.json();

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 503,
      },
    );
  }
}