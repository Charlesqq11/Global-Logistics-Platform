"use client";

import { FormEvent, useState } from "react";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to sign in.");
      }

      const params = new URLSearchParams(window.location.search);
      const requestedPath = params.get("returnTo");

      const destination =
        requestedPath &&
        requestedPath.startsWith("/customer/") &&
        !requestedPath.startsWith("//")
          ? requestedPath
          : "/customer";

      window.location.assign(destination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#172033]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-[#101d32] p-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-white/10" />
          <div className="absolute -bottom-48 -left-32 h-[500px] w-[500px] rounded-full border border-white/10" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-[#101d32]">
              GL
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.18em]">
                GLOBAL LOGISTICS
              </p>
              <p className="text-xs text-white/50">
                International shipment services
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-5 text-xs font-bold tracking-[0.28em] text-[#9bb8df]">
              YOUR SHIPMENTS. YOUR CONTROL.
            </p>

            <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight">
              Your logistics,
              <br />
              all in one place.
            </h1>

            <p className="mt-7 max-w-md text-base leading-8 text-white/65">
              Access shipment updates, customs information, important
              documents and payment requests through your secure customer
              account.
            </p>

            <div className="mt-12 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">Shipment visibility</p>
                <p className="mt-2 text-xs leading-5 text-white/50">
                  Follow your shipment progress.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold">Secure access</p>
                <p className="mt-2 text-xs leading-5 text-white/50">
                  Your account and documents stay protected.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/40">
            © {new Date().getFullYear()} Global Logistics Platform
          </p>
        </section>

        <section className="flex items-center justify-center px-6 py-14 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-12 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#101d32] font-black text-white">
                  GL
                </div>
                <div>
                  <p className="text-sm font-bold tracking-[0.16em]">
                    GLOBAL LOGISTICS
                  </p>
                  <p className="text-xs text-slate-500">
                    Customer portal
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-9">
              <p className="mb-3 text-xs font-bold tracking-[0.22em] text-[#5477a5]">
                CUSTOMER PORTAL
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to access your shipments and logistics information.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="h-13 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#5477a5] focus:ring-4 focus:ring-[#5477a5]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-13 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#5477a5] focus:ring-4 focus:ring-[#5477a5]/10"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-13 w-full items-center justify-center rounded-xl bg-[#14243d] px-5 text-sm font-semibold text-white transition hover:bg-[#203b60] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to your account"}
              </button>
            </form>

            <div className="mt-9 border-t border-slate-200 pt-6">
              <p className="text-center text-xs leading-6 text-slate-500">
                Secure customer access
                <br />
                Your shipment information is available only to authorized
                accounts.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
