"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  Globe2,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
  Users,
  MapPin,
  Clock3,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Laptop,
  BarChart3,
} from "lucide-react";

type Overview = {
  period_days: number;
  total_visits: number;
  unique_visitors: number;
  countries_reached: number;
  cities_reached: number;
  devices: { device: string; visits: number }[];
  browsers: { browser: string; visits: number }[];
  countries: {
    country: string;
    country_code: string | null;
    visits: number;
  }[];
};

type Visit = {
  id: string;
  tracking_number: string;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  browser: string | null;
  operating_system: string | null;
  device_type: string | null;
  visited_at: string;
};

type VisitsResponse = {
  total: number;
  limit: number;
  offset: number;
  visits: Visit[];
};

const PERIODS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "12 months", value: 365 },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0b1018] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/45">{label}</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5">
          <Icon className="h-4 w-4 text-cyan-300" />
        </div>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">
        {formatNumber(value)}
      </p>

      <p className="mt-2 text-xs text-white/35">
        {description}
      </p>
    </div>
  );
}

function Breakdown({
  title,
  icon: Icon,
  items,
  nameKey,
  total,
}: {
  title: string;
  icon: typeof Activity;
  items: Record<string, string | number>[];
  nameKey: string;
  total: number;
}) {
  const maximum = Math.max(
    ...items.map((item) => Number(item.visits)),
    1,
  );

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0b1018] p-5">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-white/[0.04] p-2.5">
          <Icon className="h-4 w-4 text-cyan-300" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">
            {title}
          </h2>
          <p className="mt-1 text-xs text-white/35">
            Distribution by recorded visits
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-sm text-white/35">
          No data recorded for this period.
        </p>
      ) : (
        <div className="space-y-5">
          {items.slice(0, 8).map((item, index) => {
            const count = Number(item.visits);
            const width = (count / maximum) * 100;
            const name = String(item[nameKey] ?? "Unknown");

            return (
              <div key={`${name}-${index}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-white/70">
                    {name}
                  </span>

                  <span className="shrink-0 text-xs text-white/45">
                    {formatNumber(count)} · {percentage(count, total)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-cyan-400/80 transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DeviceIcon({ device }: { device: string | null }) {
  const value = (device ?? "").toLowerCase();

  if (value.includes("mobile")) {
    return <Smartphone className="h-4 w-4" />;
  }

  if (value.includes("tablet")) {
    return <Tablet className="h-4 w-4" />;
  }

  if (value.includes("desktop")) {
    return <Monitor className="h-4 w-4" />;
  }

  return <Laptop className="h-4 w-4" />;
}

export default function VisitorAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [visitData, setVisitData] = useState<VisitsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [exporting, setExporting] = useState(false);

  const limit = 20;

  const loadAnalytics = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const [overviewResponse, visitsResponse] =
          await Promise.all([
            fetch(`/api/admin/analytics/overview?days=${days}`, {
              cache: "no-store",
            }),
            fetch(
              `/api/admin/analytics/visits?days=${days}&limit=${limit}&offset=${offset}`,
              { cache: "no-store" },
            ),
          ]);

        const overviewData = await overviewResponse.json();
        const visitsData = await visitsResponse.json();

        if (!overviewResponse.ok) {
          throw new Error(
            overviewData?.detail ?? "Unable to load analytics overview.",
          );
        }

        if (!visitsResponse.ok) {
          throw new Error(
            visitsData?.detail ?? "Unable to load visitor records.",
          );
        }

        setOverview(overviewData);
        setVisitData(visitsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load visitor analytics.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [days, offset],
  );
  
  async function exportVisitorsCsv() {
    setExporting(true);
    setError("");

    try {
      const allVisits: Visit[] = [];
      let nextOffset = 0;
      let expectedTotal = 0;

      do {
        const response = await fetch(
          `/api/admin/analytics/visits?days=${days}&limit=200&offset=${nextOffset}`,
          { cache: "no-store" },
        );

        const data: VisitsResponse & { detail?: string } =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ?? "Unable to export visitor records.",
          );
        }

        expectedTotal = data.total;
        allVisits.push(...data.visits);
        nextOffset += data.visits.length;

        if (data.visits.length === 0) break;
      } while (nextOffset < expectedTotal);

      if (allVisits.length === 0) {
        throw new Error("There are no visitor records to export.");
      }

      const headers = [
        "Visit ID",
        "Tracking Reference",
        "IP Address",
        "Country",
        "Country Code",
        "Region",
        "City",
        "Timezone",
        "Browser",
        "Operating System",
        "Device",
        "Visit Time",
      ];

      const safeCell = (value: unknown) => {
        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
          text = `'${text}`;
        }

        return `"${text.replace(/"/g, '""')}"`;
      };

      const rows = allVisits.map((visit) => [
        visit.id,
        visit.tracking_number,
        visit.ip_address,
        visit.country,
        visit.country_code,
        visit.region,
        visit.city,
        visit.timezone,
        visit.browser,
        visit.operating_system,
        visit.device_type,
        visit.visited_at,
      ]);

      const csv = [
        headers.map(safeCell).join(","),
        ...rows.map((row) => row.map(safeCell).join(",")),
      ].join("\r\n");

      const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `visitor-analytics-${days}-days-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to export visitor records.",
      );
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  

  function changePeriod(value: number) {
    setDays(value);
    setOffset(0);
  }

  const totalPages = visitData
    ? Math.max(1, Math.ceil(visitData.total / limit))
    : 1;

  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="mx-auto max-w-[1600px] p-5 sm:p-8 lg:p-10">
        <header className="mb-9 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-300/70">
              <Activity className="h-4 w-4" />
              Intelligence & Analytics
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Visitor Analytics
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Understand tracking-page traffic, visitor locations,
              devices and browsing activity across your logistics platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={days}
              onChange={(event) =>
                changePeriod(Number(event.target.value))
              }
              className="min-h-11 rounded-xl border border-white/10 bg-[#0b1018] px-4 text-sm text-white outline-none focus:border-cyan-400/50"
              aria-label="Analytics date range"
            >
              {PERIODS.map((period) => (
                <option key={period.value} value={period.value}>
                  Last {period.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              disabled={refreshing || loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/75 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && !overview ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b1018] p-10 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-300" />
            <p className="mt-4 text-sm text-white/45">
              Loading visitor intelligence...
            </p>
          </div>
        ) : overview ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Visits"
                value={overview.total_visits}
                description={`Tracking visits in the last ${days} days`}
                icon={Eye}
              />

              <StatCard
                label="Unique Visitors"
                value={overview.unique_visitors}
                description="Distinct privacy-preserving visitor identifiers"
                icon={Users}
              />

              <StatCard
                label="Countries Reached"
                value={overview.countries_reached}
                description="Countries identified from visitor IPs"
                icon={Globe2}
              />

              <StatCard
                label="Cities Reached"
                value={overview.cities_reached}
                description="Approximate visitor city coverage"
                icon={MapPin}
              />
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-3">
              <Breakdown
                title="Top Countries"
                icon={Globe2}
                items={overview.countries as unknown as Record<string, string | number>[]}
                nameKey="country"
                total={overview.total_visits}
              />

              <Breakdown
                title="Devices"
                icon={Monitor}
                items={overview.devices as unknown as Record<string, string | number>[]}
                nameKey="device"
                total={overview.total_visits}
              />

              <Breakdown
                title="Browsers"
                icon={BarChart3}
                items={overview.browsers as unknown as Record<string, string | number>[]}
                nameKey="browser"
                total={overview.total_visits}
              />
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1018]">
              <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-base font-semibold">
                    Visitor Activity
                  </h2>
                  <p className="mt-1 text-xs text-white/35">
                    Individual tracking-page visits and approximate locations
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                     type="button"
                     onClick={exportVisitorsCsv}
                     disabled={exporting || !visitData || visitData.total === 0}
                     className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] px-3.5 text-xs font-medium text-cyan-200 transition hover:bg-cyan-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
                >
                 <ArrowDownToLine className={`h-4 w-4 ${exporting ? "animate-bounce" : ""}`} />
                 {exporting ? "Exporting..." : "Export CSV"}
              </button>

              <div className="flex items-center gap-2 text-xs text-white/40">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Authorized admin access
             </div>
            </div>
          </div>

              {!visitData || visitData.visits.length === 0 ? (
                <div className="p-12 text-center">
                  <Activity className="mx-auto h-8 w-8 text-white/20" />
                  <p className="mt-4 text-sm text-white/50">
                    No visitor records found for this period.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.16em] text-white/30">
                          <th className="px-5 py-4 font-medium">Visitor</th>
                          <th className="px-5 py-4 font-medium">Location</th>
                          <th className="px-5 py-4 font-medium">Tracking Reference</th>
                          <th className="px-5 py-4 font-medium">Device</th>
                          <th className="px-5 py-4 font-medium">Browser / OS</th>
                          <th className="px-5 py-4 font-medium">Visit Time</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visitData.visits.map((visit) => (
                          <tr
                            key={visit.id}
                            className="border-b border-white/[0.045] transition hover:bg-white/[0.025]"
                          >
                            <td className="px-5 py-4">
                              <p className="text-sm font-medium text-white/75">
                                {visit.ip_address ?? "Unavailable"}
                              </p>
                              <p className="mt-1 text-[11px] text-white/30">
                                IP address
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-300/60" />
                                <div>
                                  <p className="text-sm text-white/70">
                                    {[visit.city, visit.region]
                                      .filter(Boolean)
                                      .join(", ") || "Unknown"}
                                  </p>
                                  <p className="mt-1 text-xs text-white/35">
                                    {visit.country ?? "Unknown country"}
                                    {visit.country_code
                                      ? ` (${visit.country_code})`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-1.5 font-mono text-xs text-cyan-200/80">
                                {visit.tracking_number}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-white/60">
                                <DeviceIcon device={visit.device_type} />
                                {visit.device_type ?? "Unknown"}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <p className="text-sm text-white/65">
                                {visit.browser ?? "Unknown"}
                              </p>
                              <p className="mt-1 text-xs text-white/35">
                                {visit.operating_system ?? "Unknown"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-white/60">
                                <Clock3 className="h-3.5 w-3.5 text-white/30" />
                                {formatDate(visit.visited_at)}
                              </div>
                              {visit.timezone && (
                                <p className="mt-1 text-[11px] text-white/30">
                                  {visit.timezone}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-t border-white/[0.07] p-5 sm:flex-row sm:items-center">
                    <p className="text-xs text-white/40">
                      Showing {offset + 1}–
                      {Math.min(offset + visitData.visits.length, visitData.total)}
                      {" "}of {formatNumber(visitData.total)} visits
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setOffset(Math.max(0, offset - limit))
                        }
                        disabled={offset === 0}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-white/65 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>

                      <span className="text-xs text-white/40">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= visitData.total}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-white/65 hover:bg-white/[0.05] disabled:opacity-30"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.035] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/60" />
              <p className="text-xs leading-5 text-white/40">
                Location information is approximate and derived from IP
                geolocation. It does not identify a visitor&apos;s exact
                physical address. Access to visitor records is restricted
                by the analytics permission.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}