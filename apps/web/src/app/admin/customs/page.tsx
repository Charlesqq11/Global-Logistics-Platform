"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Shipment = {
  id: string;
  tracking_number: string;
  shipment_type: string;
  status: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  declared_value: number | string | null;
  declared_currency: string | null;
};

type CustomsCase = {
  id: string;
  shipment_id: string;
  status: string;
  customs_reference: string | null;
  hold_reason: string | null;
  required_action: string | null;
  authority_name: string | null;
  opened_at: string;
  cleared_at: string | null;
  created_at: string;
  updated_at: string;
  shipment?: Shipment;
};

const statusLabels: Record<string, string> = {
  not_required: "Not Required",
  pending_review: "Pending Review",
  under_clearance: "Under Clearance",
  information_required: "Information Required",
  payment_required: "Payment Required",
  on_hold: "On Hold",
  cleared: "Cleared",
  rejected: "Rejected",
};

const statusStyles: Record<string, string> = {
  not_required:
    "border-slate-700 bg-slate-800/70 text-slate-300",
  pending_review:
    "border-amber-500/20 bg-amber-500/10 text-amber-300",
  under_clearance:
    "border-blue-500/20 bg-blue-500/10 text-blue-300",
  information_required:
    "border-violet-500/20 bg-violet-500/10 text-violet-300",
  payment_required:
    "border-orange-500/20 bg-orange-500/10 text-orange-300",
  on_hold:
    "border-red-500/20 bg-red-500/10 text-red-300",
  cleared:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  rejected:
    "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return (
    statusLabels[status] ??
    status.replaceAll("_", " ")
  );
}

function formatCurrency(
  value: number | string | null,
  currency: string | null,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "—";
  }

  return `${currency ?? ""} ${numericValue.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`.trim();
}

export default function CustomsControlPage() {
  const [cases, setCases] = useState<CustomsCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCases() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/customs",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ??
              "Unable to load customs cases.",
          );
        }

        if (active) {
          setCases(
            Array.isArray(data)
              ? data
              : [],
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load customs cases.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCases();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const activeCases = cases.filter(
      (item) =>
        ![
          "cleared",
          "not_required",
          "rejected",
        ].includes(item.status),
    );

    const holds = cases.filter(
      (item) =>
        item.status === "on_hold" ||
        item.status === "information_required",
    );

    const paymentCases = cases.filter(
      (item) =>
        item.status === "payment_required",
    );

    const exposure = activeCases.reduce(
      (total, item) => {
        const value = Number(
          item.shipment?.declared_value ?? 0,
        );

        return Number.isNaN(value)
          ? total
          : total + value;
      },
      0,
    );

    return {
      total: cases.length,
      active: activeCases.length,
      holds: holds.length,
      payments: paymentCases.length,
      exposure,
    };
  }, [cases]);

  const filteredCases = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesStatus =
        filter === "all" ||
        item.status === filter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const values = [
        item.customs_reference,
        item.authority_name,
        item.hold_reason,
        item.required_action,
        item.shipment?.tracking_number,
        item.shipment?.origin_country,
        item.shipment?.destination_country,
      ];

      return values.some((value) =>
        value
          ?.toLowerCase()
          .includes(normalizedSearch),
      );
    });
  }, [cases, filter, search]);

  return (
    <main className="min-h-screen bg-[#070b12] text-white">
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Compliance Operations
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Customs Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Monitor customs exposure, clearance activity,
              operational holds, and shipment compliance
              across the logistics network.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/shipments"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              Shipment Operations
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/15"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Total Cases"
            value={metrics.total}
            description="All recorded customs cases"
            icon="◈"
          />

          <MetricCard
            label="Active Cases"
            value={metrics.active}
            description="Currently requiring attention"
            icon="↗️"
            accent="blue"
          />

          <MetricCard
            label="Operational Holds"
            value={metrics.holds}
            description="Holds or information requests"
            icon="!"
            accent="red"
          />

          <MetricCard
            label="Payment Required"
            value={metrics.payments}
            description="Cases awaiting customs payment"
            icon="$"
            accent="amber"
          />

          <MetricCard
            label="Declared Exposure"
            value={metrics.exposure.toLocaleString(
              "en-US",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
            description="Aggregate active shipment value"
            icon="◉"
            accent="emerald"
            prefix="$"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b111b] shadow-2xl shadow-black/20">
          <div className="border-b border-white/[0.07] p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Customs Cases
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredCases.length} case
                  {filteredCases.length === 1
                    ? ""
                    : "s"} displayed
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    ⌕
                  </span>

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search tracking or reference..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40 md:w-[280px]"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  className="rounded-xl border border-white/10 bg-[#101722] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-blue-500/40"
                >
                  <option value="all">
                    All statuses
                  </option>

                  {Object.entries(statusLabels).map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl bg-white/[0.03]"
                />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl text-slate-500">
                ◈
              </div>

              <h3 className="text-sm font-semibold text-white">
                No customs cases found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                There are no customs cases matching the
                current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left">
                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Shipment
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Customs Case
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Route
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Declared Value
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Updated
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCases.map((item) => {
                    const shipment = item.shipment;

                    const caseHref = `/admin/customs/${encodeURIComponent(
                      item.shipment_id,
                    )}`;

                    const shipmentHref =
                      shipment?.tracking_number
                        ? `/admin/shipments/${encodeURIComponent(
                            shipment.tracking_number,
                          )}`
                        : null;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          window.location.href =
                            caseHref;
                        }}
                        className="cursor-pointer border-b border-white/[0.05] transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-5">
                          <div className="font-mono text-sm font-semibold text-white">
                            {shipment?.tracking_number ??
                              "Unknown"}
                          </div>

                          <div className="mt-1 text-xs capitalize text-slate-500">
                            {shipment?.shipment_type ??
                              "Shipment"}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="text-sm text-slate-200">
                            {item.customs_reference ??
                              "No reference"}
                          </div>

                          <div className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                            {item.authority_name ??
                              "Authority not specified"}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="text-sm text-slate-300">
                            {shipment?.origin_city ??
                              shipment?.origin_country ??
                              "—"}
                          </div>

                          <div className="my-1 text-[10px] text-slate-600">
                            ↓
                          </div>

                          <div className="text-sm text-slate-300">
                            {shipment?.destination_city ??
                              shipment?.destination_country ??
                              "—"}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                              statusStyles[item.status] ??
                              "border-white/10 bg-white/5 text-slate-300"
                            }`}
                          >
                            {formatStatus(item.status)}
                          </span>

                          {item.hold_reason && (
                            <p className="mt-2 max-w-[190px] truncate text-xs text-red-400/80">
                              {item.hold_reason}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-sm font-medium text-slate-200">
                            {formatCurrency(
                              shipment?.declared_value ??
                                null,
                              shipment?.declared_currency ??
                                null,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-xs text-slate-400">
                            {formatDate(item.updated_at)}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={caseHref}
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                              className="inline-flex items-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-500/15 hover:text-blue-200"
                            >
                              View Case
                            </Link>

                            {shipmentHref ? (
                              <Link
                                href={shipmentHref}
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                              >
                                Shipment
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-600">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  accent = "slate",
  prefix = "",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: string;
  accent?: "slate" | "blue" | "red" | "amber" | "emerald";
  prefix?: string;
}) {
  const accentStyles = {
    slate: "text-slate-400 bg-slate-400/10",
    blue: "text-blue-400 bg-blue-400/10",
    red: "text-red-400 bg-red-400/10",
    amber: "text-amber-400 bg-amber-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b111b] p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>

          <div className="mt-3 flex items-baseline gap-1">
            {prefix && (
              <span className="text-sm text-slate-500">
                {prefix}
              </span>
            )}

            <span className="text-2xl font-semibold tracking-tight text-white">
              {value}
            </span>
          </div>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}