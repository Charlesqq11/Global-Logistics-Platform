import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/api/v1/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          detail:
            data?.detail ??
            "Unable to authenticate.",
        },
        {
          status: response.status,
        },
      );
    }

    const nextResponse = NextResponse.json({
      user: data.user,
    });

    nextResponse.cookies.set(
      "gl_access_token",
      data.access_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      },
    );

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        detail:
          "Authentication service is unavailable.",
      },
      {
        status: 503,
      },
    );
  }
}