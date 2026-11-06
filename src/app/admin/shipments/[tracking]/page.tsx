"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  MapPin,
  Package,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";

import EditShipmentForm from "./EditShipmentForm";
import TrackingEventForm from "./TrackingEventForm";
import ArchiveShipmentModal from "./ArchiveShipmentModal";
import CreateCustomsCaseModal from "./CreateCustomsCaseModal";

type ShipmentStatus =
  | "created"
  | "waiting_for_pickup"
  | "pickup_scheduled"
  | "picked_up"
  | "pickup_failed"
  | "received"
  | "processing"
  | "departed_facility"
  | "in_transit"
  | "arrived_at_facility"
  | "arrived_at_destination"
  | "customs_clearance"
  | "customs_inspection"
  | "customs_hold"
  | "customs_cleared"
  | "released_from_customs"
  | "out_for_delivery"
  | "delivery_attempted"
  | "delivery_failed"
  | "ready_for_collection"
  | "delivered"
  | "on_hold"
  | "damaged"
  | "lost"
  | "returned_to_sender"
  | "return_delivered"
  | "cancelled";

type ShipmentType =
  | "parcel"
  | "document"
  | "freight"
  | "vehicle"
  | "other";

type TrackingEvent = {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  event_time: string;
  created_at: string;
};

type Customer = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
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
};

type Shipment = {
  id: string;
  tracking_number: string;
  shipment_type: ShipmentType;
  status: ShipmentStatus;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  description: string | null;
  weight_kg: number | string | null;
  declared_value: number | string | null;
  declared_currency: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  customer: Customer | null;
  tracking_events: TrackingEvent[];
  customs_case: CustomsCase | null;
};

const STATUS_META: Record<
  ShipmentStatus,
  {
    label: string;
    description: string;
    icon: typeof Package;
  }
> = {
  created: {
    label: "Created",
    description: "Shipment record created",
    icon: Package,
  },
  waiting_for_pickup: {
    label: "Waiting for Pickup",
    description: "Shipment is awaiting collection",
    icon: Clock3,
  },
  pickup_scheduled: {
    label: "Pickup Scheduled",
    description: "Collection has been scheduled",
    icon: CalendarDays,
  },
  picked_up: {
    label: "Picked Up",
    description: "Shipment has been collected",
    icon: CheckCircle2,
  },
  pickup_failed: {
    label: "Pickup Failed",
    description: "The scheduled collection was unsuccessful",
    icon: XCircle,
  },
  received: {
    label: "Received",
    description: "Shipment received by operations",
    icon: CheckCircle2,
  },
  processing: {
    label: "Processing",
    description: "Shipment is being processed",
    icon: Clock3,
  },
  departed_facility: {
    label: "Departed Facility",
    description: "Shipment has departed an operational facility",
    icon: Truck,
  },
  in_transit: {
    label: "In Transit",
    description: "Shipment is moving through the logistics network",
    icon: Truck,
  },
  arrived_at_facility: {
    label: "Arrived at Facility",
    description: "Shipment has arrived at a logistics facility",
    icon: MapPin,
  },
  arrived_at_destination: {
    label: "Arrived at Destination",
    description: "Shipment has reached its destination location",
    icon: MapPin,
  },
  customs_clearance: {
    label: "Customs Clearance",
    description: "Shipment is undergoing customs clearance",
    icon: ShieldCheck,
  },
  customs_inspection: {
    label: "Customs Inspection",
    description: "Shipment is undergoing customs inspection",
    icon: ShieldCheck,
  },
  customs_hold: {
    label: "Customs Hold",
    description: "Shipment is being held by customs",
    icon: ShieldCheck,
  },
  customs_cleared: {
    label: "Customs Cleared",
    description: "Customs clearance has been completed",
    icon: CheckCircle2,
  },
  released_from_customs: {
    label: "Released from Customs",
    description: "Shipment has been released by customs",
    icon: CheckCircle2,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    description: "Shipment is on its final delivery route",
    icon: Truck,
  },
  delivery_attempted: {
    label: "Delivery Attempted",
    description: "A delivery attempt has been made",
    icon: Truck,
  },
  delivery_failed: {
    label: "Delivery Failed",
    description: "The delivery attempt was unsuccessful",
    icon: XCircle,
  },
  ready_for_collection: {
    label: "Ready for Collection",
    description: "Shipment is ready for recipient collection",
    icon: Package,
  },
  delivered: {
    label: "Delivered",
    description: "Shipment delivered successfully",
    icon: CheckCircle2,
  },
  on_hold: {
    label: "On Hold",
    description: "Shipment is temporarily on hold",
    icon: Clock3,
  },
  damaged: {
    label: "Damaged",
    description: "Shipment has been reported as damaged",
    icon: XCircle,
  },
  lost: {
    label: "Lost",
    description: "Shipment has been reported as lost",
    icon: XCircle,
  },
  returned_to_sender: {
    label: "Returned to Sender",
    description: "Shipment is being returned to its sender",
    icon: Truck,
  },
  return_delivered: {
    label: "Return Delivered",
    description: "Shipment has been returned to its sender",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    description: "Shipment has been cancelled",
    icon: XCircle,
  },
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  switch (status) {
    case "delivered":
    case "return_delivered":
    case "customs_cleared":
    case "released_from_customs":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "customs_hold":
    case "on_hold":
    case "cancelled":
    case "pickup_failed":
    case "delivery_failed":
    case "damaged":
    case "lost":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";

    case "customs_clearance":
    case "customs_inspection":
    case "delivery_attempted":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "in_transit":
    case "departed_facility":
    case "out_for_delivery":
    case "picked_up":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";

    case "arrived_at_facility":
    case "arrived_at_destination":
    case "ready_for_collection":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

    case "returned_to_sender":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    default:
      return "border-white/10 bg-white/[0.05] text-white/60";
  }
}

function getShipmentLocation(shipment: Shipment) {
  const origin = [shipment.origin_city, shipment.origin_country]
    .filter(Boolean)
    .join(", ");

  const destination = [
    shipment.destination_city,
    shipment.destination_country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    origin: origin || "Origin not specified",
    destination: destination || "Destination not specified",
  };
}

export default function ShipmentDetailPage() {
  const params = useParams<{ tracking: string }>();
  const router = useRouter();

  const trackingParam = params?.tracking;

  const [tracking, setTracking] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editingShipment, setEditingShipment] = useState(false);
  const [archivingShipment, setArchivingShipment] = useState(false);
  const [creatingCustomsCase, setCreatingCustomsCase] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);

  const resolvedTracking = useMemo(() => {
    if (!trackingParam) return "";

    if (Array.isArray(trackingParam)) {
      return trackingParam[0] ?? "";
    }

    return decodeURIComponent(trackingParam);
  }, [trackingParam]);

  const loadShipment = useCallback(
    async (refresh = false) => {
      if (!resolvedTracking) return;

      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setError(null);

        const response = await fetch(
          `/api/admin/shipments/${encodeURIComponent(resolvedTracking)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              data?.message ||
              "Unable to load shipment details.",
          );
        }

        setShipment(data);
        setTracking(data.tracking_number ?? resolvedTracking);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load shipment details.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [resolvedTracking],
  );

  const handleArchived = () => {
    setArchivingShipment(false);
    router.push("/admin/shipments");
    router.refresh();
  };

  useEffect(() => {
    void loadShipment();
  }, [loadShipment]);

  const location = shipment
    ? getShipmentLocation(shipment)
    : {
        origin: "Origin not specified",
        destination: "Destination not specified",
      };

  const statusMeta = shipment
    ? STATUS_META[shipment.status]
    : STATUS_META.created;

  const StatusIcon = statusMeta.icon;

  const sortedEvents = useMemo(() => {
    if (!shipment?.tracking_events) return [];

    return [...shipment.tracking_events].sort(
      (a, b) =>
        new Date(b.event_time).getTime() -
        new Date(a.event_time).getTime(),
    );
  }, [shipment]);

  const canCreateCustomsCase =
    shipment &&
    !shipment.customs_case &&
    !["delivered", "return_delivered", "cancelled", "lost"].includes(shipment.status);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090d] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4">
            <RefreshCw className="h-4 w-4 animate-spin text-white/50" />
            <span className="text-sm text-white/50">
              Loading shipment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-[#07090d] text-white">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10">
              <XCircle className="h-6 w-6 text-rose-300" />
            </div>

            <h1 className="mt-5 text-xl font-semibold">
              Shipment unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/45">
              {error || "The requested shipment could not be found."}
            </p>

            <Link
              href="/admin/shipments"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shipments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[18%] top-[-15%] h-[420px] w-[420px] rounded-full bg-sky-500/[0.035] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-5%] h-[500px] w-[500px] rounded-full bg-indigo-500/[0.025] blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 border-r border-white/[0.07] bg-black/20 lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-white/[0.07] px-6">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                <Globe2 className="h-4 w-4 text-white/80" />
              </div>

              <div>
                <div className="text-sm font-semibold tracking-tight">
                  Global Logistics
                </div>

                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
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
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Globe2 className="h-4 w-4" />
              Overview
            </Link>

            <Link
              href="/admin/shipments"
              className="mt-1 flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-3 text-sm font-medium text-white"
            >
              <Package className="h-4 w-4" />
              Shipments
            </Link>

            <div className="mt-7 mb-3 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
              Operations
            </div>

            <Link
              href="/admin/shipments"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Package className="h-4 w-4" />
              Shipment Operations
            </Link>

            <Link
              href="/admin/customs"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <ShieldCheck className="h-4 w-4" />
              Customs Control
            </Link>

            <Link
              href="/admin/payments"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <WalletCards className="h-4 w-4" />
              Payments
            </Link>

            <Link
              href="/admin/documents"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Documents
            </Link>

            <Link
              href="/admin/customers"
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/[0.04] hover:text-white"
            >
              <Globe2 className="h-4 w-4" />
              Customers
            </Link>
          </nav>

          <div className="border-t border-white/[0.07] p-5">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-white/70">
                  Operations Online
                </span>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-white/30">
                Global logistics control environment.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-white/[0.07] bg-black/10">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-5 sm:px-8">
              <div className="min-w-0">
                <Link
                  href="/admin/shipments"
                  className="mb-3 inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white/70"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Shipments
                </Link>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                    {shipment.tracking_number}
                  </h1>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusClass(
                      shipment.status,
                    )}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {formatStatus(shipment.status)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/35">
                  Shipment operations and lifecycle control
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadShipment(true)}
                  disabled={isRefreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingShipment(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setArchivingShipment(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-400/15 bg-rose-400/[0.04] px-3.5 text-sm text-rose-300 transition hover:bg-rose-400/[0.08]"
                >
                  <Archive className="h-4 w-4" />
                  <span className="hidden sm:inline">Archive</span>
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/30">
                    Shipment Type
                  </span>
                  <Package className="h-4 w-4 text-white/25" />
                </div>

                <div className="mt-3 text-lg font-semibold">
                  {formatStatus(shipment.shipment_type)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/30">
                    Weight
                  </span>
                  <Package className="h-4 w-4 text-white/25" />
                </div>

                <div className="mt-3 text-lg font-semibold">
                  {shipment.weight_kg != null
                    ? `${shipment.weight_kg} kg`
                    : "Not specified"}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/30">
                    Created
                  </span>
                  <CalendarDays className="h-4 w-4 text-white/25" />
                </div>

                <div className="mt-3 text-lg font-semibold">
                  {formatShortDate(shipment.created_at)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-white/30">
                    Estimated Delivery
                  </span>
                  <Truck className="h-4 w-4 text-white/25" />
                </div>

                <div className="mt-3 text-lg font-semibold">
                  {formatShortDate(shipment.estimated_delivery_at)}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="space-y-6">
                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
                    <div>
                      <h2 className="font-semibold">Route</h2>
                      <p className="mt-1 text-xs text-white/30">
                        Current shipment corridor
                      </p>
                    </div>

                    <Truck className="h-5 w-5 text-white/25" />
                  </div>

                  <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
                        <MapPin className="h-3.5 w-3.5" />
                        Origin
                      </div>

                      <div className="mt-2 text-base font-medium">
                        {location.origin}
                      </div>
                    </div>

                    <div className="hidden h-px w-20 bg-gradient-to-r from-white/10 via-white/30 to-white/10 md:block" />

                    <div className="md:text-right">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/25 md:justify-end">
                        <MapPin className="h-3.5 w-3.5" />
                        Destination
                      </div>

                      <div className="mt-2 text-base font-medium">
                        {location.destination}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
                    <div>
                      <h2 className="font-semibold">
                        Tracking Timeline
                      </h2>

                      <p className="mt-1 text-xs text-white/30">
                        Operational events recorded against this shipment
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddingEvent(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Add Event
                    </button>
                  </div>

                  <div className="p-6">
                    {sortedEvents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] px-5 py-10 text-center">
                        <Clock3 className="mx-auto h-6 w-6 text-white/20" />

                        <p className="mt-3 text-sm text-white/45">
                          No tracking events yet.
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          Add the first operational event to begin the
                          shipment timeline.
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute bottom-3 left-[15px] top-3 w-px bg-white/[0.08]" />

                        <div className="space-y-7">
                          {sortedEvents.map((event, index) => (
                            <div
                              key={event.id}
                              className="relative flex gap-4"
                            >
                              <div
                                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${statusClass(
                                  event.status,
                                )}`}
                              >
                                {index === 0 ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Clock3 className="h-3.5 w-3.5" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-medium">
                                    {formatStatus(event.status)}
                                  </div>

                                  <div className="text-xs text-white/25">
                                    {formatDate(event.event_time)}
                                  </div>
                                </div>

                                {event.location && (
                                  <div className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </div>
                                )}

                                {event.description && (
                                  <p className="mt-2 text-sm leading-6 text-white/45">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="border-b border-white/[0.07] px-6 py-5">
                    <h2 className="font-semibold">
                      Shipment Information
                    </h2>

                    <p className="mt-1 text-xs text-white/30">
                      Core operational data
                    </p>
                  </div>

                  <div className="grid gap-6 p-6 sm:grid-cols-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                        Description
                      </div>

                      <div className="mt-2 text-sm leading-6 text-white/65">
                        {shipment.description ||
                          "No description provided."}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                        Declared Value
                      </div>

                      <div className="mt-2 text-sm font-medium text-white/75">
                        {shipment.declared_value != null
                          ? `${shipment.declared_currency || ""} ${shipment.declared_value}`
                          : "Not specified"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                        Last Updated
                      </div>

                      <div className="mt-2 text-sm text-white/65">
                        {formatDate(shipment.updated_at)}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                        Delivered At
                      </div>

                      <div className="mt-2 text-sm text-white/65">
                        {formatDate(shipment.delivered_at)}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="border-b border-white/[0.07] px-6 py-5">
                    <h2 className="font-semibold">Current Status</h2>

                    <p className="mt-1 text-xs text-white/30">
                      Shipment lifecycle state
                    </p>
                  </div>

                  <div className="p-6">
                    <div
                      className={`rounded-2xl border p-4 ${statusClass(
                        shipment.status,
                      )}`}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5" />

                        <div>
                          <div className="text-sm font-semibold">
                            {statusMeta.label}
                          </div>

                          <div className="mt-1 text-xs opacity-70">
                            {statusMeta.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="border-b border-white/[0.07] px-6 py-5">
                    <h2 className="font-semibold">Customer</h2>

                    <p className="mt-1 text-xs text-white/30">
                      Shipment owner
                    </p>
                  </div>

                  <div className="p-6">
                    {shipment.customer ? (
                      <>
                        <div className="text-base font-medium">
                          {shipment.customer.name}
                        </div>

                        {shipment.customer.company && (
                          <div className="mt-1 text-sm text-white/40">
                            {shipment.customer.company}
                          </div>
                        )}

                        <div className="mt-5 space-y-3">
                          {shipment.customer.email && (
                            <div className="text-sm text-white/55">
                              {shipment.customer.email}
                            </div>
                          )}

                          {shipment.customer.phone && (
                            <div className="text-sm text-white/55">
                              {shipment.customer.phone}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/[0.08] p-4 text-sm text-white/35">
                        No customer is assigned to this shipment.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="border-b border-white/[0.07] px-6 py-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">
                          Customs Control
                        </h2>

                        <p className="mt-1 text-xs text-white/30">
                          Clearance and exception management
                        </p>
                      </div>

                      <ShieldCheck className="h-5 w-5 text-white/25" />
                    </div>
                  </div>

                  <div className="p-6">
                    {shipment.customs_case ? (
                      <>
                        <div
                          className={`rounded-2xl border p-4 ${statusClass(
                            shipment.customs_case.status,
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-[0.14em] opacity-60">
                                Case Status
                              </div>

                              <div className="mt-1 text-sm font-semibold">
                                {formatStatus(
                                  shipment.customs_case.status,
                                )}
                              </div>
                            </div>

                            <ShieldCheck className="h-5 w-5 opacity-70" />
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                              Customs Reference
                            </div>

                            <div className="mt-1 text-sm text-white/60">
                              {shipment.customs_case
                                .customs_reference ||
                                "Not assigned"}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                              Authority
                            </div>

                            <div className="mt-1 text-sm text-white/60">
                              {shipment.customs_case.authority_name ||
                                "Not specified"}
                            </div>
                          </div>

                          {shipment.customs_case.hold_reason && (
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                                Hold Reason
                              </div>

                              <div className="mt-1 text-sm leading-6 text-white/55">
                                {shipment.customs_case.hold_reason}
                              </div>
                            </div>
                          )}

                          {shipment.customs_case.required_action && (
                            <div>
                              <div className="text-[10px] uppercase tracking-[0.16em] text-white/25">
                                Required Action
                              </div>

                              <div className="mt-1 text-sm leading-6 text-white/55">
                                {shipment.customs_case.required_action}
                              </div>
                            </div>
                          )}

                          <Link
                            href={`/admin/customs/${shipment.id}`}
                            className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <span>Open Customs Case</span>
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="rounded-2xl border border-dashed border-white/[0.08] p-5 text-center">
                          <ShieldCheck className="mx-auto h-6 w-6 text-white/20" />

                          <div className="mt-3 text-sm font-medium text-white/60">
                            No customs case
                          </div>

                          <p className="mt-1 text-xs leading-5 text-white/30">
                            Create a customs case when this shipment
                            requires clearance or customs intervention.
                          </p>
                        </div>

                        {canCreateCustomsCase && (
                          <button
                            type="button"
                            onClick={() =>
                              setCreatingCustomsCase(true)
                            }
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Create Customs Case
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/[0.07] bg-white/[0.025]">
                  <div className="border-b border-white/[0.07] px-6 py-5">
                    <h2 className="font-semibold">
                      Record Metadata
                    </h2>
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs text-white/30">
                        Shipment ID
                      </span>

                      <span className="max-w-[220px] break-all text-right text-xs text-white/50">
                        {shipment.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/30">
                        Created
                      </span>

                      <span className="text-right text-xs text-white/50">
                        {formatDate(shipment.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/30">
                        Updated
                      </span>

                      <span className="text-right text-xs text-white/50">
                        {formatDate(shipment.updated_at)}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </section>
      </div>

      {editingShipment && shipment && (
        <EditShipmentForm
          shipment={shipment}
          tracking={tracking}
          onClose={() => setEditingShipment(false)}
          onSaved={async () => {
            setEditingShipment(false);
            await loadShipment(true);
          }}
        />
      )}

      {addingEvent && shipment && (
        <TrackingEventForm
          tracking={tracking}
          currentStatus={shipment.status}
          onCreated={async () => {
            setAddingEvent(false);
            await loadShipment(true);
          }}
        />
      )}

      {archivingShipment && shipment && (
        <ArchiveShipmentModal
          tracking={tracking}
          onClose={() => setArchivingShipment(false)}
          onArchived={handleArchived}
        />
      )}

      {creatingCustomsCase && shipment && (
        <CreateCustomsCaseModal
          shipmentId={shipment.id}
          tracking={shipment.tracking_number}
          onClose={() => setCreatingCustomsCase(false)}
          onCreated={async () => {
            setCreatingCustomsCase(false);
            await loadShipment(true);
          }}
        />
      )}
    </div>
  );
}