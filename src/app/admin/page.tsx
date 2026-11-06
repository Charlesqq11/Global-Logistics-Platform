"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Box,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Globe2,
  LogOut,
  Landmark,
  MapPin,
  Package,
  RefreshCw,
  Route,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";

type Shipment = {
  id: string;
  tracking_number: string;
  shipment_type?: string;
  status: string;
  origin_country?: string;
  origin_city?: string;
  destination_country?: string;
  destination_city?: string;
  weight_kg?: number | string | null;
  declared_value?: number | string | null;
  declared_currency?: string | null;
  created_at?: string;
  estimated_delivery_at?: string | null;
  delivered_at?: string | null;
  customer?: {
    id?: string;
    name?: string;
    company?: string;
  } | null;
  tracking_events?: TrackingEvent[];
};

type TrackingEvent = {
  id?: string;
  status: string;
  title?: string;
  description?: string;
  location?: string | null;
  country_code?: string | null;
  event_time?: string;
};

const STATUS_LABELS: Record<string, string> = {
  processing: "Processing",
  in_transit: "In Transit",
  customs_clearance: "Customs Clearance",
  customs_hold: "Customs Hold",
  customs_cleared: "Customs Cleared",
  released_from_customs: "Released from Customs",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  on_hold: "On Hold",
  canceled: "Canceled",
};

const STATUS_STYLES: Record<
  string,
  string
> = {
  processing:
    "border-blue-400/20 bg-blue-400/10 text-blue-300",
  in_transit:
    "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  customs_clearance:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  customs_hold:
    "border-red-400/20 bg-red-400/10 text-red-300",
  customs_cleared:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  released_from_customs:
    "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
  out_for_delivery:
    "border-purple-400/20 bg-purple-400/10 text-purple-300",
  delivered:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  on_hold:
    "border-orange-400/20 bg-orange-400/10 text-orange-300",
  canceled:
    "border-red-400/20 bg-red-400/10 text-red-300",
};

export default function AdminOverviewPage() {
  const [shipments, setShipments] = useState<
    Shipment[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  async function loadOverview(
    showRefresh = false,
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        "/api/admin/shipments",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to load operations.",
        );
      }

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.shipments)
            ? data.shipments
            : [];

      setShipments(records);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load operations.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const metrics = useMemo(() => {
    const total = shipments.length;

    const delivered = shipments.filter(
      (shipment) =>
        shipment.status === "delivered",
    ).length;

    const inTransit = shipments.filter(
      (shipment) =>
        shipment.status === "in_transit" ||
        shipment.status ===
          "released_from_customs" ||
        shipment.status === "out_for_delivery",
    ).length;

    const exceptions = shipments.filter(
      (shipment) =>
        shipment.status === "on_hold" ||
        shipment.status === "customs_hold" ||
        shipment.status === "canceled",
    ).length;

    const customs = shipments.filter(
      (shipment) =>
        shipment.status ===
          "customs_clearance" ||
        shipment.status ===
          "customs_hold",
    ).length;

    const processing = shipments.filter(
      (shipment) =>
        shipment.status === "processing",
    ).length;

    const deliveryRate =
      total > 0
        ? Math.round(
            (delivered / total) * 100,
          )
        : 0;

    return {
      total,
      delivered,
      inTransit,
      exceptions,
      customs,
      processing,
      deliveryRate,
    };
  }, [shipments]);

  const recentShipments = useMemo(() => {
    return [...shipments]
      .sort(
        (a, b) =>
          new Date(
            b.created_at ?? 0,
          ).getTime() -
          new Date(
            a.created_at ?? 0,
          ).getTime(),
      )
      .slice(0, 6);
  }, [shipments]);

  const recentEvents = useMemo(() => {
    const events: Array<
      TrackingEvent & {
        tracking_number: string;
      }
    > = [];

    for (const shipment of shipments) {
      for (const event of
        shipment.tracking_events ?? []) {
        events.push({
          ...event,
          tracking_number:
            shipment.tracking_number,
        });
      }
    }

    return events
      .sort(
        (a, b) =>
          new Date(
            b.event_time ?? 0,
          ).getTime() -
          new Date(
            a.event_time ?? 0,
          ).getTime(),
      )
      .slice(0, 7);
  }, [shipments]);

  const exceptionShipments = useMemo(() => {
    return shipments
      .filter(
        (shipment) =>
          shipment.status ===
            "on_hold" ||
          shipment.status ===
            "customs_hold" ||
          shipment.status ===
            "canceled",
      )
      .slice(0, 5);
  }, [shipments]);

  const routeSummary = useMemo(() => {
    const routes = new Map<
      string,
      number
    >();

    for (const shipment of shipments) {
      const origin =
        shipment.origin_country ??
        "Unknown";

      const destination =
        shipment.destination_country ??
        "Unknown";

      const route = `${origin} → ${destination}`;

      routes.set(
        route,
        (routes.get(route) ?? 0) + 1,
      );
    }

    return Array.from(routes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [shipments]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href =
      "/admin/login";
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#07090d] lg:flex lg:flex-col">
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <Truck className="h-5 w-5 text-white/80" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Global Logistics
                </p>
                <p className="text-xs text-white/35">
                  Operations Center
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Command Center
            </p>

            <NavItem
              href="/admin"
              icon={Activity}
              label="Overview"
              active
            />

            <NavItem
              href="/admin/shipments"
              icon={Package}
              label="Shipment Operations"
            />

            <NavItem
              href="/admin/customs"
              icon={ShieldCheck}
              label="Customs Control"
            />

            <NavItem
              href="/admin/payments"
              icon={CreditCard}
              label="Payments"
            />

            <NavItem
              href="/admin/bank-accounts"
              icon={Landmark}
              label="Bank Accounts"
            />

            <NavItem
              href="/admin/documents"
              icon={FileText}
              label="Documents"
            />

            <p className="mt-8 px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Management
            </p>

            <NavItem
              href="/admin/customers"
              icon={Users}
              label="Customers"
            />

            <NavItem
              href="/admin/analytics"
              icon={Globe2}
              label="Visitor Analytics"
            />
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/40 transition hover:bg-red-400/[0.07] hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1700px] px-6 py-8 lg:px-10">
            {/* Header */}
            <header className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs text-white/30">
                  <span>Command Center</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-white/60">
                    Overview
                  </span>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight">
                  Operations Overview
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                  Real-time operational visibility across
                  shipments, delivery performance, customs
                  exposure and exceptions.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />

                  <div>
                    <p className="text-[11px] font-medium text-white/65">
                      Operations Online
                    </p>
                    <p className="text-[10px] text-white/30">
                      Live system
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    loadOverview(true)
                  }
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/65 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />
                  Refresh
                </button>

                <Link
                  href="/admin/shipments/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  <Package className="h-4 w-4" />
                  New Shipment
                </Link>
              </div>
            </header>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

                <div>
                  <p className="text-sm font-medium text-red-300">
                    Operations data unavailable
                  </p>

                  <p className="mt-1 text-xs text-red-200/60">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* KPI */}
            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Package}
                label="Total Shipments"
                value={
                  loading
                    ? "—"
                    : metrics.total.toString()
                }
                detail="All operational records"
              />

              <MetricCard
                icon={Route}
                label="In Transit"
                value={
                  loading
                    ? "—"
                    : metrics.inTransit.toString()
                }
                detail="Currently moving"
                accent="cyan"
              />

              <MetricCard
                icon={CheckCircle2}
                label="Delivered"
                value={
                  loading
                    ? "—"
                    : metrics.delivered.toString()
                }
                detail="Completed shipments"
                accent="green"
              />

              <MetricCard
                icon={AlertTriangle}
                label="Exceptions"
                value={
                  loading
                    ? "—"
                    : metrics.exceptions.toString()
                }
                detail="Requires attention"
                accent="red"
              />
            </section>

            {/* Secondary metrics */}
            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <MiniMetric
                icon={ShieldAlert}
                label="Customs Exposure"
                value={
                  loading
                    ? "—"
                    : metrics.customs.toString()
                }
                description="Clearance or customs hold"
              />

              <MiniMetric
                icon={Clock3}
                label="Processing"
                value={
                  loading
                    ? "—"
                    : metrics.processing.toString()
                }
                description="Awaiting operational movement"
              />

              <MiniMetric
                icon={Activity}
                label="Delivery Rate"
                value={
                  loading
                    ? "—"
                    : `${metrics.deliveryRate}%`
                }
                description="Delivered vs total shipments"
              />
            </section>

            {/* Main command area */}
            <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
              {/* Recent operations */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25">
                      Operations
                    </p>

                    <h2 className="mt-2 text-lg font-semibold">
                      Recent Shipments
                    </h2>
                  </div>

                  <Link
                    href="/admin/shipments"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-white/40 transition hover:text-white"
                  >
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="divide-y divide-white/10">
                  {loading ? (
                    <LoadingRows />
                  ) : recentShipments.length ===
                    0 ? (
                    <EmptyState
                      icon={Package}
                      title="No shipments yet"
                      description="Create your first operational shipment to populate the command center."
                    />
                  ) : (
                    recentShipments.map(
                      (shipment) => (
                        <Link
                          key={shipment.id}
                          href={`/admin/shipments/${encodeURIComponent(
                            shipment.tracking_number,
                          )}`}
                          className="group block p-5 transition hover:bg-white/[0.025]"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                <Box className="h-4 w-4 text-white/50" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-mono text-sm font-medium text-white/85">
                                    {
                                      shipment.tracking_number
                                    }
                                  </p>

                                  <StatusBadge
                                    status={
                                      shipment.status
                                    }
                                  />
                                </div>

                                <p className="mt-1 truncate text-xs text-white/35">
                                  {shipment.origin_city ??
                                    shipment.origin_country ??
                                    "Origin"}{" "}
                                  →
                                  {" "}
                                  {shipment.destination_city ??
                                    shipment.destination_country ??
                                    "Destination"}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-6">
                              <div className="hidden text-right sm:block">
                                <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">
                                  Type
                                </p>

                                <p className="mt-1 text-xs text-white/50">
                                  {formatShipmentType(
                                    shipment.shipment_type,
                                  )}
                                </p>
                              </div>

                              <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:text-white/60" />
                            </div>
                          </div>
                        </Link>
                      ),
                    )
                  )}
                </div>
              </div>

              {/* Exceptions */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl">
                <div className="border-b border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25">
                        Attention Required
                      </p>

                      <h2 className="mt-2 text-lg font-semibold">
                        Exception Queue
                      </h2>
                    </div>

                    <div className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 px-2 text-xs font-semibold text-red-300">
                      {metrics.exceptions}
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="p-6 text-sm text-white/30">
                    Loading exceptions...
                  </div>
                ) : exceptionShipments.length ===
                  0 ? (
                  <div className="p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    </div>

                    <p className="mt-4 text-sm font-medium">
                      No active exceptions
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/30">
                      Current shipment records do not
                      contain an active hold or exception.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {exceptionShipments.map(
                      (shipment) => (
                        <Link
                          key={shipment.id}
                          href={`/admin/shipments/${encodeURIComponent(
                            shipment.tracking_number,
                          )}`}
                          className="block p-5 transition hover:bg-white/[0.025]"
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

                            <div className="min-w-0">
                              <p className="font-mono text-xs font-medium text-white/75">
                                {
                                  shipment.tracking_number
                                }
                              </p>

                              <p className="mt-1 text-xs leading-5 text-white/35">
                                {
                                  STATUS_LABELS[
                                    shipment.status
                                  ] ??
                                    shipment.status
                                }
                              </p>
                            </div>

                            <ChevronRight className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-white/20" />
                          </div>
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Intelligence */}
            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              {/* Recent events */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl">
                <div className="border-b border-white/10 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25">
                    Activity
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Recent Tracking Events
                  </h2>
                </div>

                {loading ? (
                  <div className="p-6 text-sm text-white/30">
                    Loading activity...
                  </div>
                ) : recentEvents.length ===
                  0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No tracking activity"
                    description="Tracking events will appear here as shipments move through the network."
                  />
                ) : (
                  <div className="divide-y divide-white/10">
                    {recentEvents.map(
                      (event, index) => (
                        <div
                          key={`${event.id ?? event.tracking_number}-${index}`}
                          className="flex gap-4 p-5"
                        >
                          <div className="relative flex w-8 shrink-0 justify-center">
                            <div className="mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white/30 bg-white/10" />

                            {index <
                              recentEvents.length -
                                1 && (
                              <div className="absolute top-4 h-full w-px bg-white/10" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-medium text-white/75">
                                {event.title ??
                                  STATUS_LABELS[
                                    event.status
                                  ] ??
                                  event.status}
                              </p>

                              <StatusBadge
                                status={
                                  event.status
                                }
                              />
                            </div>

                            <p className="mt-1 font-mono text-[10px] text-white/25">
                              {
                                event.tracking_number
                              }
                            </p>

                            <p className="mt-1 text-xs leading-5 text-white/35">
                              {event.location ??
                                event.description ??
                                "Operational status update"}
                            </p>

                            {event.event_time && (
                              <p className="mt-2 text-[10px] text-white/20">
                                {formatDate(
                                  event.event_time,
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Network */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl">
                <div className="border-b border-white/10 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25">
                    Network Intelligence
                  </p>

                  <h2 className="mt-2 text-lg font-semibold">
                    Active Routes
                  </h2>
                </div>

                {loading ? (
                  <div className="p-6 text-sm text-white/30">
                    Loading routes...
                  </div>
                ) : routeSummary.length ===
                  0 ? (
                  <EmptyState
                    icon={Globe2}
                    title="No route data"
                    description="Shipment routes will appear here once operational records are created."
                  />
                ) : (
                  <div className="divide-y divide-white/10">
                    {routeSummary.map(
                      ([route, count]) => (
                        <div
                          key={route}
                          className="flex items-center justify-between gap-4 p-5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                              <MapPin className="h-4 w-4 text-white/45" />
                            </div>

                            <p className="truncate text-xs text-white/55">
                              {route}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/55">
                            {count}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                <div className="border-t border-white/10 p-5">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center gap-3">
                      <Globe2 className="h-4 w-4 text-white/40" />

                      <div>
                        <p className="text-xs font-medium text-white/65">
                          Global Network
                        </p>

                        <p className="mt-1 text-[10px] text-white/25">
                          Shipment route visibility
                        </p>
                      </div>
                    </div>

                    <ArrowUpRight className="h-4 w-4 text-white/20" />
                  </div>
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-xl">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/25">
                  Operations
                </p>

                <h2 className="mt-2 text-lg font-semibold">
                  Quick Actions
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <QuickAction
                  href="/admin/shipments/create"
                  icon={Package}
                  title="Create Shipment"
                  description="Register a new shipment"
                />

                <QuickAction
                  href="/admin/shipments"
                  icon={Truck}
                  title="Shipment Operations"
                  description="Manage active shipments"
                />

                <QuickAction
                  href="/admin/customs"
                  icon={ShieldCheck}
                  title="Customs Control"
                  description="Review clearance cases"
                />

                <QuickAction
                  href="/admin/payments"
                  icon={WalletCards}
                  title="Payment Control"
                  description="Manage payment requests"
                />

                <QuickAction
                  href="/admin/bank-accounts"
                  icon={Landmark}
                  title="Bank Accounts"
                  description="Manage customer payment accounts"
                />

                <QuickAction
                  href="/admin/documents"
                  icon={FileText}
                  title="Documents"
                  description="Manage shipment documents"
                />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
        active
          ? "bg-white/[0.08] text-white"
          : "text-white/45 hover:bg-white/[0.05] hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent = "white",
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  detail: string;
  accent?: "white" | "cyan" | "green" | "red";
}) {
  const styles = {
    white: {
      icon: "text-white/55",
      glow: "bg-white/[0.04]",
    },
    cyan: {
      icon: "text-cyan-300",
      glow: "bg-cyan-400/[0.06]",
    },
    green: {
      icon: "text-emerald-300",
      glow: "bg-emerald-400/[0.06]",
    },
    red: {
      icon: "text-red-300",
      glow: "bg-red-400/[0.06]",
    },
  }[accent];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 ${styles.glow}`}
        >
          <Icon
            className={`h-4 w-4 ${styles.icon}`}
          />
        </div>

        <ArrowUpRight className="h-4 w-4 text-white/10" />
      </div>

      <p className="mt-5 text-xs font-medium text-white/35">
        {label}
      </p>

      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-white/25">
        {detail}
      </p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
        <Icon className="h-4 w-4 text-white/45" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-white/35">
          {label}
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-semibold">
            {value}
          </span>

          <span className="truncate text-[10px] text-white/25">
            {description}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const label =
    STATUS_LABELS[status] ?? status;

  const style =
    STATUS_STYLES[status] ??
    "border-white/10 bg-white/[0.04] text-white/45";

  return (
    <span
      className={`rounded-lg border px-2 py-1 text-[9px] font-medium ${style}`}
    >
      {label}
    </span>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          <Icon className="h-4 w-4 text-white/50 transition group-hover:text-white/80" />
        </div>

        <ArrowRight className="h-4 w-4 text-white/15 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
      </div>

      <p className="mt-4 text-xs font-medium text-white/70">
        {title}
      </p>

      <p className="mt-1 text-[10px] leading-5 text-white/25">
        {description}
      </p>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Icon className="h-5 w-5 text-white/30" />
      </div>

      <p className="mt-4 text-sm font-medium text-white/60">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-white/25">
        {description}
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-white/10">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex items-center gap-4 p-5"
        >
          <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.05]" />

          <div className="flex-1">
            <div className="h-3 w-40 animate-pulse rounded bg-white/[0.05]" />

            <div className="mt-2 h-2.5 w-56 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatShipmentType(
  type?: string,
) {
  if (!type) {
    return "Shipment";
  }

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}