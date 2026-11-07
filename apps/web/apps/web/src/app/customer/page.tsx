"use client";

import { useCallback, useEffect, useState } from "react";

type Shipment = Record<string, unknown>;

function readText(value: unknown, fallback = ""): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return readText(
      item.name ?? item.label ?? item.city ?? item.country,
      fallback
    );
  }

  return fallback;
}

function getShipments(data: unknown): Shipment[] {
  if (Array.isArray(data)) return data as Shipment[];

  if (data && typeof data === "object") {
    const result = data as Record<string, unknown>;

    for (const key of ["shipments", "items", "results", "data"]) {
      if (Array.isArray(result[key])) {
        return result[key] as Shipment[];
      }
    }
  }

  return [];
}

function statusStyle(status: string) {
  const value = status.toLowerCase();

  if (value.includes("deliver")) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (value.includes("hold") || value.includes("cancel")) {
    return "bg-red-50 text-red-700";
  }

  if (value.includes("custom")) {
    return "bg-amber-50 text-amber-700";
  }

  if (value.includes("transit")) {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatDate(value: unknown): string {
  const text = readText(value);
  if (!text) return "Not available";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CustomerDashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customer/shipments", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        window.location.assign("/customer/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load your shipments.");
      }

      const data: unknown = await response.json();
      setShipments(getShipments(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your shipments."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      window.location.assign("/customer/login");
    }
  }

  const activeCount = shipments.filter((shipment) => {
    const status = readText(shipment.status).toLowerCase();
    return !status.includes("deliver") && !status.includes("cancel");
  }).length;

  const deliveredCount = shipments.filter((shipment) =>
    readText(shipment.status).toLowerCase().includes("deliver")
  ).length;

  return (
    <main className="min-h-screen bg-[#f4f6fa] text-[#172238]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14243d] text-sm font-black text-white">
              GL
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.14em]">
                GLOBAL LOGISTICS
              </p>
              <p className="text-[11px] text-slate-500">
                Customer portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-slate-500 sm:inline">
              Secure customer access
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-9 sm:px-8 lg:px-10 lg:py-12">
        <section className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-[11px] font-bold tracking-[0.24em] text-[#5477a5]">
              CUSTOMER OVERVIEW
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your shipments
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Monitor shipment progress and stay informed about your
              logistics operations.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadShipments()}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh shipments"}
          </button>
        </section>

        <section className="mb-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total shipments
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm text-blue-700">
                ↗
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold">
              {loading ? "—" : shipments.length}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Shipments linked to your account
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                In progress
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-sm text-amber-700">
                ◷
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold">
              {loading ? "—" : activeCount}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Not yet marked as delivered or cancelled
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Delivered
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-sm text-emerald-700">
                ✓
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold">
              {loading ? "—" : deliveredCount}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Successfully delivered shipments
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold">
                Shipment activity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Your shipment records and current progress
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {shipments.length} records
            </span>
          </div>

          {error && (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                Unable to load shipments
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={() => void loadShipments()}
                className="mt-3 text-sm font-semibold text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : !error && shipments.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
                ◇
              </div>
              <h3 className="mt-5 text-base font-semibold">
                No shipments yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Shipments assigned to your customer account will appear here.
                Contact your logistics representative if you expected to see
                a shipment.
              </p>
            </div>
          ) : !error ? (
            <div className="divide-y divide-slate-100">
              {shipments.map((shipment, index) => {
                const tracking = readText(
                  shipment.tracking_number ?? shipment.trackingNumber,
                  "Tracking number unavailable"
                );

                const status = readText(shipment.status, "Processing");
                const shipmentType = readText(
                  shipment.shipment_type ?? shipment.type,
                  "Shipment"
                );

                const origin = readText(
                  shipment.origin ?? shipment.origin_address ?? shipment.origin_country,
                  "Origin unavailable"
                );

                const destination = readText(
                  shipment.destination ??
                    shipment.destination_address ??
                    shipment.destination_country,
                  "Destination unavailable"
                );

                const date = formatDate(
                  shipment.estimated_delivery ??
                    shipment.estimated_delivery_at
                );

                return (
                  <article
                    key={readText(shipment.id, `${tracking}-${index}`)}
                    className="grid gap-5 px-6 py-6 transition hover:bg-slate-50/70 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"
                  >
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                        TRACKING NUMBER
                      </p>
                      <p className="mt-2 break-all text-sm font-bold text-[#1c3556]">
                        {tracking}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {shipmentType}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                        ROUTE
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {origin}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        To {destination}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                        ESTIMATED DELIVERY
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {date}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle(status)}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>

        <footer className="mt-8 flex flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
          <p>Global Logistics Platform · Customer portal</p>
          <p>Shipment information is provided through your secure account.</p>
        </footer>
      </div>
    </main>
  );
}
