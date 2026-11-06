"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Globe2,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Truck,
} from "lucide-react";

type ApiShipment = {
  id: string;
  tracking_number: string;
  shipment_type: string;
  status: string;
  origin_city?: string | null;
  origin_country?: string | null;
  destination_city?: string | null;
  destination_country?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  customer?: {
    id?: string;
    name?: string;
    reference?: string;
  } | null;
};

type Shipment = {
  id: string;
  tracking: string;
  type: string;
  route: string;
  status: string;
  updated: string;
};

const statusStyles: Record<string, string> = {
  created:
    "border-white/10 bg-white/[0.04] text-white/60",

  waiting_for_pickup:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  pickup_scheduled:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  picked_up:
    "border-sky-400/20 bg-sky-400/10 text-sky-300",
  pickup_failed:
    "border-rose-400/20 bg-rose-400/10 text-rose-300",

  received:
    "border-sky-400/20 bg-sky-400/10 text-sky-300",
  processing:
    "border-sky-400/20 bg-sky-400/10 text-sky-300",

  departed_facility:
    "border-blue-400/20 bg-blue-400/10 text-blue-300",
  in_transit:
    "border-blue-400/20 bg-blue-400/10 text-blue-300",
  arrived_at_facility:
    "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  arrived_at_destination:
    "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",

  customs_clearance:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  customs_inspection:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  customs_hold:
    "border-orange-400/20 bg-orange-400/10 text-orange-300",
  customs_cleared:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  released_from_customs:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

  out_for_delivery:
    "border-violet-400/20 bg-violet-400/10 text-violet-300",
  delivery_attempted:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",
  delivery_failed:
    "border-rose-400/20 bg-rose-400/10 text-rose-300",
  ready_for_collection:
    "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  delivered:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

  on_hold:
    "border-orange-400/20 bg-orange-400/10 text-orange-300",
  damaged:
    "border-rose-400/20 bg-rose-400/10 text-rose-300",
  lost:
    "border-red-400/20 bg-red-400/10 text-red-300",

  returned_to_sender:
    "border-orange-400/20 bg-orange-400/10 text-orange-300",
  return_delivered:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

  cancelled:
    "border-red-400/20 bg-red-400/10 text-red-300",

  pending:
    "border-white/10 bg-white/[0.04] text-white/50",
};

const statusLabels: Record<string, string> = {
  created: "Created",

  waiting_for_pickup: "Waiting for Pickup",
  pickup_scheduled: "Pickup Scheduled",
  picked_up: "Picked Up",
  pickup_failed: "Pickup Failed",

  received: "Received",
  processing: "Processing",

  departed_facility: "Departed Facility",
  in_transit: "In Transit",
  arrived_at_facility: "Arrived at Facility",
  arrived_at_destination: "Arrived at Destination",

  customs_clearance: "Customs Clearance",
  customs_inspection: "Customs Inspection",
  customs_hold: "Customs Hold",
  customs_cleared: "Customs Cleared",
  released_from_customs: "Released from Customs",

  out_for_delivery: "Out for Delivery",
  delivery_attempted: "Delivery Attempted",
  delivery_failed: "Delivery Failed",
  ready_for_collection: "Ready for Collection",
  delivered: "Delivered",

  on_hold: "On Hold",
  damaged: "Damaged",
  lost: "Lost",

  returned_to_sender: "Returned to Sender",
  return_delivered: "Return Delivered",

  cancelled: "Cancelled",
  canceled: "Cancelled",
  pending: "Pending",
};

const typeLabels: Record<string, string> = {
  parcel: "Parcel",
  logistics: "Logistics",
  freight: "Freight",
  cargo: "Cargo",
  shipment: "Shipment",
  vehicle: "Vehicle",
};

function formatStatus(status: string) {
  return (
    statusLabels[status.toLowerCase()] ??
    status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  );
}

function formatType(type: string) {
  return (
    typeLabels[type.toLowerCase()] ??
    type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  );
}

function formatRoute(
  city?: string | null,
  country?: string | null,
) {
  if (!city && !country) {
    return "—";
  }

  if (city && country) {
    return `${city}, ${country}`;
  }

  return city ?? country ?? "—";
}

function formatUpdated(date?: string | null) {
  if (!date) {
    return "—";
  }

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "—";
  }

  const seconds = Math.floor(
    (Date.now() - timestamp) / 1000,
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function normalizeShipment(
  shipment: ApiShipment,
): Shipment {
  const origin = formatRoute(
    shipment.origin_city,
    shipment.origin_country,
  );

  const destination = formatRoute(
    shipment.destination_city,
    shipment.destination_country,
  );

  return {
    id: shipment.id,
    tracking: shipment.tracking_number,
    type: formatType(shipment.shipment_type),
    route: `${origin} → ${destination}`,
    status: formatStatus(shipment.status),
    updated: formatUpdated(
      shipment.updated_at ?? shipment.created_at,
    ),
  };
}

export default function ShipmentOperationsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");
  const [showFilters, setShowFilters] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadShipments() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/admin/shipments",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ??
              "Unable to load shipments.",
          );
        }

        const records = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.shipments)
              ? data.shipments
              : [];

        if (!cancelled) {
          setShipments(
            records.map(
              (shipment: ApiShipment) =>
                normalizeShipment(shipment),
            ),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load shipments.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadShipments();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableStatuses = useMemo(() => {
    return Array.from(
      new Set(
        shipments.map(
          (shipment) => shipment.status,
        ),
      ),
    ).sort();
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesSearch =
        !query ||
        shipment.tracking
          .toLowerCase()
          .includes(query) ||
        shipment.type
          .toLowerCase()
          .includes(query) ||
        shipment.route
          .toLowerCase()
          .includes(query) ||
        shipment.status
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        shipment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shipments, search, statusFilter]);

  const inTransitCount = shipments.filter(
    (shipment) =>
      shipment.status === "In Transit",
  ).length;

  const deliveredCount = shipments.filter(
    (shipment) =>
      shipment.status === "Delivered",
  ).length;

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.07] bg-[#080b0f] lg:flex lg:flex-col">
          <div className="border-b border-white/[0.07] px-6 py-6">
            <Link
              href="/admin"
              className="group flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                <Globe2 className="h-5 w-5 text-white" />
              </div>

              <div>
                <div className="text-sm font-semibold tracking-[0.18em]">
                  GL
                </div>

                <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/35">
                  Operations
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-5">
            <div className="mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
              Command Center
            </div>

            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Overview
            </Link>

            <div className="mb-3 mt-7 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
              Operations
            </div>

            <Link
              href="/admin/shipments"
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.07] px-3 py-3 text-sm text-white"
            >
              <Truck className="h-4 w-4" />
              Shipment Operations
            </Link>

            <Link
              href="/admin/customs"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Package className="h-4 w-4" />
              Customs Control
            </Link>

            <Link
              href="/admin/payments"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Package className="h-4 w-4" />
              Payments
            </Link>

            <Link
              href="/admin/documents"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Package className="h-4 w-4" />
              Documents
            </Link>
          </nav>

          <div className="border-t border-white/[0.07] p-5">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <span className="text-xs font-medium text-white/70">
                  Operations online
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-white/30">
                Shipment control center is ready for
                operational activity.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/[0.07] bg-[#07090d]/90 px-5 py-5 backdrop-blur-xl sm:px-8">
            <div className="mx-auto max-w-[1500px]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/30">
                    <Link
                      href="/admin"
                      className="transition hover:text-white/60"
                    >
                      Operations
                    </Link>

                    <ChevronRight className="h-3 w-3" />

                    <span>Shipments</span>
                  </div>

                  <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                    Shipment Operations
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
                    Manage global shipments, tracking
                    identifiers, routes, statuses and
                    operational movement from one workspace.
                  </p>
                </div>

                {/* Corrected Create Shipment navigation */}
                <Link
                  href="/admin/shipments/create"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                >
                  <Plus className="h-4 w-4" />
                  Create Shipment
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Total Shipments
                </div>

                <div className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {isLoading ? "—" : shipments.length}
                </div>

                <div className="mt-2 text-xs text-white/30">
                  Registered in platform
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  In Transit
                </div>

                <div className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {isLoading ? "—" : inTransitCount}
                </div>

                <div className="mt-2 text-xs text-white/30">
                  Currently moving
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Delivered
                </div>

                <div className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                  {isLoading ? "—" : deliveredCount}
                </div>

                <div className="mt-2 text-xs text-white/30">
                  Completed shipments
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                  Operational View
                </div>

                <div className="mt-3 flex items-center gap-2 text-lg font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live
                </div>

                <div className="mt-2 text-xs text-white/30">
                  Control center active
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025]">
              <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative min-w-0 flex-1 lg:max-w-xl">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search tracking number, shipment or destination..."
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-black/20 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/[0.18]"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setShowFilters(
                          (current) => !current,
                        )
                      }
                      className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-xs text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Status
                    </button>

                    {showFilters && (
                      <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-white/[0.1] bg-[#0b0f14] p-2 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusFilter("All");
                            setShowFilters(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                            statusFilter === "All"
                              ? "bg-white/[0.08] text-white"
                              : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                          }`}
                        >
                          All statuses
                        </button>

                        {availableStatuses.map(
                          (status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                setStatusFilter(
                                  status,
                                );
                                setShowFilters(false);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                                statusFilter === status
                                  ? "bg-white/[0.08] text-white"
                                  : "text-white/45 hover:bg-white/[0.04] hover:text-white"
                              }`}
                            >
                              {status}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("All");
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-xs text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5">
                <div>
                  <p className="text-sm font-medium">
                    Shipment Registry
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Global shipment records and operational
                    status.
                  </p>
                </div>

                <div className="hidden items-center gap-2 text-xs text-white/30 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {isLoading
                    ? "Synchronizing"
                    : `${filteredShipments.length} visible`}
                </div>
              </div>

              {error && (
                <div className="border-b border-red-400/10 bg-red-400/[0.04] px-5 py-4">
                  <p className="text-sm text-red-300">
                    Unable to load shipment records.
                  </p>

                  <p className="mt-1 text-xs text-red-300/60">
                    {error}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25">
                        Tracking
                      </th>

                      <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25">
                        Type
                      </th>

                      <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25">
                        Route
                      </th>

                      <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25">
                        Status
                      </th>

                      <th className="px-5 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/25">
                        Updated
                      </th>

                      <th className="px-5 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center"
                        >
                          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/70" />

                          <p className="mt-4 text-sm text-white/45">
                            Loading shipment registry...
                          </p>
                        </td>
                      </tr>
                    ) : filteredShipments.length ===
                      0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center"
                        >
                          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
                            <Package className="h-5 w-5 text-white/35" />
                          </div>

                          <p className="mt-4 text-sm font-medium text-white/70">
                            No shipments found
                          </p>

                          <p className="mt-1 text-xs text-white/30">
                            {search ||
                            statusFilter !== "All"
                              ? "Try adjusting your search or filters."
                              : "No shipment records are currently available."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredShipments.map(
                        (shipment) => (
                          <tr
                            key={shipment.id}
                            className="border-b border-white/[0.05] transition hover:bg-white/[0.025]"
                          >
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035]">
                                  <Truck className="h-4 w-4 text-white/45" />
                                </div>

                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {shipment.tracking}
                                  </div>

                                  <div className="mt-1 text-[11px] text-white/25">
                                    Shipment record
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 text-sm text-white/55">
                              {shipment.type}
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex items-center gap-2 text-sm text-white/55">
                                <Globe2 className="h-3.5 w-3.5 text-white/25" />
                                {shipment.route}
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                  statusStyles[
                                    shipment.status
                                  ] ??
                                  statusStyles.Pending
                                }`}
                              >
                                {shipment.status}
                              </span>
                            </td>

                            <td className="px-5 py-5 text-xs text-white/35">
                              {shipment.updated}
                            </td>

                            <td className="px-5 py-5 text-right">
                              <Link
                                href={`/admin/shipments/${encodeURIComponent(
                                  shipment.tracking,
                                )}`}
                                className="inline-flex items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
                              >
                                Open
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
                  <Package className="h-4 w-4 text-white/45" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Shipment control layer
                  </p>

                  <p className="mt-1 max-w-3xl text-xs leading-5 text-white/30">
                    This workspace is connected to the
                    platform shipment service and is designed
                    to support shipment creation, routing,
                    status transitions, tracking events,
                    customs relationships and customer
                    visibility.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}