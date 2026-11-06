import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? "http://127.0.0.1:8000";

export async function middleware(
  request: NextRequest,
) {
  const { pathname } = request.nextUrl;

  const isCustomerRoute =
    pathname.startsWith("/customer");

  const loginPath = isCustomerRoute
    ? "/customer/login"
    : "/admin/login";

  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname === "/customer/login" ||
    pathname.startsWith("/customer/login/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(
    "gl_access_token",
  )?.value;

  if (!token) {
    return redirectToLogin(request, loginPath);
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
      return redirectToLogin(
        request,
        loginPath,
        true,
      );
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request, loginPath);
  }
}

function redirectToLogin(
  request: NextRequest,
  loginPath: string,
  clearCookie = false,
) {
  const loginUrl = new URL(
    loginPath,
    request.url,
  );

  loginUrl.searchParams.set(
    "returnTo",
    request.nextUrl.pathname,
  );

  const response =
    NextResponse.redirect(loginUrl);

  if (clearCookie) {
    response.cookies.delete(
      "gl_access_token",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/customer/:path*",
  ],
};
