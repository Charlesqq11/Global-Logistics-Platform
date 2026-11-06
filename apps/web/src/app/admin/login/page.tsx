"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.detail ??
            "Unable to sign in. Please check your credentials.",
        );
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError(
        "The authentication service is unavailable. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-3xl" />

        <div className="absolute bottom-[-18rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-cyan-500/[0.04] blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">

          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
                <span className="text-sm font-black tracking-tight">
                  GL
                </span>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure operations access
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
              Operations Command Center
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Sign in to manage shipments, customs,
              payments, documents, and global logistics
              operations.
            </p>
          </div>

          <div className="rounded-3xl border border-white/[0.09] bg-white/[0.035] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Work email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="name@company.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-white/25 focus:bg-black/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-medium text-slate-400"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-white/25 focus:bg-black/30"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-600 transition hover:text-slate-300"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm leading-5 text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in to operations
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Protected operations environment
          </div>

          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.18em] text-slate-700">
            Global Logistics Platform
          </p>
        </div>
      </div>
    </main>
  );
}