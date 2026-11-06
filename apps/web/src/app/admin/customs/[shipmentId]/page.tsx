"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import CreatePaymentRequestModal from "./CreatePaymentRequestModal";

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
  shipment_type: string;
  status: string;
  origin_country: string;
  origin_city: string | null;
  destination_country: string;
  destination_city: string | null;
  description: string | null;
  weight_kg: number | string | null;
  declared_value: number | string | null;
  declared_currency: string | null;
  estimated_delivery_at: string | null;
};

type Payment = {
  id: string;
  provider: string;
  provider_transaction_id: string | null;
  amount: number | string;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type PaymentRequest = {
  id: string;
  customs_case_id: string;
  reference: string;
  description: string;
  amount: number | string;
  currency: string;
  status: string;
  provider: string;
  due_at: string | null;
  created_at: string;
  updated_at: string;
  payments?: Payment[];
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

const paymentStatusStyles: Record<string, string> = {
  pending:
    "border-amber-500/20 bg-amber-500/10 text-amber-300",
  processing:
    "border-blue-500/20 bg-blue-500/10 text-blue-300",
  paid:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  failed:
    "border-red-500/20 bg-red-500/10 text-red-300",
  cancelled:
    "border-slate-600 bg-slate-800/60 text-slate-400",
  expired:
    "border-rose-500/20 bg-rose-500/10 text-rose-300",
};

const transitionOptions = [
  {
    value: "under_clearance",
    label: "Under Clearance",
  },
  {
    value: "information_required",
    label: "Information Required",
  },
  {
    value: "payment_required",
    label: "Payment Required",
  },
  {
    value: "on_hold",
    label: "On Hold",
  },
  {
    value: "cleared",
    label: "Cleared",
  },
];

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  return (
    statusLabels[status] ??
    status.replaceAll("_", " ")
  );
}

function formatPaymentStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatProvider(provider: string) {
  const labels: Record<string, string> = {
    manual: "Manual",
    stripe: "Stripe",
    paypal: "PayPal",
  };

  return labels[provider] ?? provider;
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

export default function CustomsCasePage() {
  const params = useParams<{
    shipmentId: string;
  }>();

  const shipmentId = params.shipmentId;

  const [customsCase, setCustomsCase] =
    useState<CustomsCase | null>(null);

  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [paymentRequests, setPaymentRequests] =
    useState<PaymentRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState("");
  const [creatingPayment, setCreatingPayment] =
    useState(false);

  const [newStatus, setNewStatus] =
    useState("under_clearance");

  const [holdReason, setHoldReason] =
    useState("");

  const [requiredAction, setRequiredAction] =
    useState("");

  const currentStatus = customsCase?.status ?? "";

  const canUpdate = useMemo(() => {
    if (!customsCase) {
      return false;
    }

    return ![
      "cleared",
      "rejected",
    ].includes(customsCase.status);
  }, [customsCase]);

  const canCreatePayment = useMemo(() => {
    if (!customsCase) {
      return false;
    }

    return [
      "payment_required",
      "on_hold",
      "under_clearance",
    ].includes(customsCase.status);
  }, [customsCase]);

  const loadData = useCallback(async () => {
    if (!shipmentId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/customs/${encodeURIComponent(
          shipmentId,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to load customs case.",
        );
      }

      const loadedCase =
        data as CustomsCase;

      setCustomsCase(loadedCase);

      /*
       * The customs case stores shipment_id as a UUID,
       * while the shipment detail page is addressed by
       * tracking number. Resolve the UUID through the
       * shipment list before loading the shipment record.
       */
      const shipmentListResponse =
        await fetch(
          "/api/admin/shipments",
          {
            method: "GET",
            cache: "no-store",
          },
        );

      if (shipmentListResponse.ok) {
        const shipmentList =
          await shipmentListResponse.json();

        const shipments: Shipment[] =
          Array.isArray(shipmentList)
            ? shipmentList
            : shipmentList?.items ??
              shipmentList?.data ??
              [];

        const matchedShipment =
          shipments.find(
            (item) =>
              item.id ===
              loadedCase.shipment_id,
          );

        if (matchedShipment) {
          setShipment(matchedShipment);
        } else {
          setShipment(null);
        }
      }

      /*
       * Load payment requests and keep only requests
       * belonging to this customs case.
       */
      const paymentResponse =
        await fetch(
          "/api/admin/payments",
          {
            method: "GET",
            cache: "no-store",
          },
        );

      if (paymentResponse.ok) {
        const paymentData =
          await paymentResponse.json();

        const requests: PaymentRequest[] =
          Array.isArray(paymentData)
            ? paymentData
            : paymentData?.items ??
              paymentData?.data ??
              [];

        setPaymentRequests(
          requests.filter(
            (request) =>
              request.customs_case_id ===
              loadedCase.id,
          ),
        );
      } else {
        setPaymentRequests([]);
      }

      /*
       * Keep the status selector synchronized with the
       * backend after loading or refreshing the case.
       */
      setNewStatus(
        loadedCase.status === "cleared" ||
          loadedCase.status === "rejected"
          ? "under_clearance"
          : loadedCase.status,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load customs case.",
      );
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateStatus() {
    if (!customsCase || updating) {
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/customs/${encodeURIComponent(
          customsCase.shipment_id,
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            hold_reason:
              holdReason.trim() || null,
            required_action:
              requiredAction.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ??
            "Unable to update customs status.",
        );
      }

      setCustomsCase(data);

      setHoldReason("");
      setRequiredAction("");

      setSuccess(
        `Customs status updated to ${formatStatus(
          newStatus,
        )}.`,
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update customs status.",
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b12] p-8 text-white">
        <div className="mx-auto max-w-[1400px] space-y-5">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-white/[0.05]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
          <div className="h-72 animate-pulse rounded-2xl bg-white/[0.04]" />
        </div>
      </main>
    );
  }

  if (error && !customsCase) {
    return (
      <main className="min-h-screen bg-[#070b12] p-8 text-white">
        <div className="mx-auto max-w-[1400px]">
          <Link
            href="/admin/customs"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Back to Customs Control
          </Link>

          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-300">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!customsCase) {
    return null;
  }

  const paidPaymentRequests =
    paymentRequests.filter(
      (request) =>
        request.status === "paid",
    );

  const outstandingPaymentRequests =
    paymentRequests.filter(
      (request) =>
        ![
          "paid",
          "cancelled",
          "expired",
        ].includes(request.status),
    );

  const paymentExposure =
    outstandingPaymentRequests.reduce(
      (total, request) =>
        total + Number(request.amount || 0),
      0,
    );

  return (
    <main className="min-h-screen bg-[#070b12] text-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <div className="mb-8">
          <Link
            href="/admin/customs"
            className="text-sm text-slate-500 transition hover:text-white"
          >
            ← Customs Control
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
                Customs Case
              </div>

              <h1 className="font-mono text-2xl font-semibold tracking-tight">
                {shipment?.tracking_number ??
                  customsCase.shipment_id}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Case opened{" "}
                {formatDate(
                  customsCase.opened_at,
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {canCreatePayment && (
                <button
                  type="button"
                  onClick={() =>
                    setCreatingPayment(true)
                  }
                  className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/15"
                >
                  Create Payment Request
                </button>
              )}

              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-medium ${
                  statusStyles[
                    customsCase.status
                  ] ??
                  "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {formatStatus(
                  customsCase.status,
                )}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[#0b111b] p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Customs Information
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Regulatory and clearance information
                  associated with this shipment.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Info
                  label="Customs Reference"
                  value={
                    customsCase.customs_reference ??
                    "Not assigned"
                  }
                />

                <Info
                  label="Authority"
                  value={
                    customsCase.authority_name ??
                    "Not specified"
                  }
                />

                <Info
                  label="Current Status"
                  value={formatStatus(
                    customsCase.status,
                  )}
                />

                <Info
                  label="Last Updated"
                  value={formatDate(
                    customsCase.updated_at,
                  )}
                />

                <Info
                  label="Hold Reason"
                  value={
                    customsCase.hold_reason ??
                    "No active hold"
                  }
                />

                <Info
                  label="Required Action"
                  value={
                    customsCase.required_action ??
                    "No action specified"
                  }
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#0b111b] p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-base font-semibold">
                    Payment Control
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Payment requests associated with this
                    customs case.
                  </p>
                </div>

                {canCreatePayment && (
                  <button
                    type="button"
                    onClick={() =>
                      setCreatingPayment(true)
                    }
                    className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/15"
                  >
                    + Create Request
                  </button>
                )}
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Requests"
                  value={String(
                    paymentRequests.length,
                  )}
                />

                <Metric
                  label="Outstanding"
                  value={String(
                    outstandingPaymentRequests.length,
                  )}
                />

                <Metric
                  label="Exposure"
                  value={
                    paymentExposure > 0
                      ? formatCurrency(
                          paymentExposure,
                          paymentRequests[0]
                            ?.currency ?? null,
                        )
                      : "—"
                  }
                />
              </div>

              {paymentRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <div className="text-sm font-medium text-slate-300">
                    No payment requests
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    Create a payment request when customs
                    requires a financial action.
                  </p>

                  {canCreatePayment && (
                    <button
                      type="button"
                      onClick={() =>
                        setCreatingPayment(true)
                      }
                      className="mt-4 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-slate-200"
                    >
                      Create Payment Request
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentRequests.map(
                    (paymentRequest) => (
                      <Link
                        key={paymentRequest.id}
                        href={`/admin/payments/${encodeURIComponent(
                          paymentRequest.id,
                        )}`}
                        className="block rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-white">
                                {
                                  paymentRequest.reference
                                }
                              </span>

                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                                  paymentStatusStyles[
                                    paymentRequest
                                      .status
                                  ] ??
                                  "border-white/10 bg-white/5 text-slate-300"
                                }`}
                              >
                                {formatPaymentStatus(
                                  paymentRequest.status,
                                )}
                              </span>
                            </div>

                            <p className="mt-2 truncate text-sm text-slate-400">
                              {
                                paymentRequest.description
                              }
                            </p>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                              <span>
                                Provider:{" "}
                                {formatProvider(
                                  paymentRequest.provider,
                                )}
                              </span>

                              <span>
                                Created:{" "}
                                {formatDate(
                                  paymentRequest.created_at,
                                )}
                              </span>

                              {paymentRequest.due_at && (
                                <span>
                                  Due:{" "}
                                  {formatDate(
                                    paymentRequest.due_at,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            <div className="text-base font-semibold text-white">
                              {formatCurrency(
                                paymentRequest.amount,
                                paymentRequest.currency,
                              )}
                            </div>

                            <div className="mt-1 text-xs text-slate-600">
                              Open payment record →
                            </div>
                          </div>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              )}

              {paidPaymentRequests.length > 0 && (
                <div className="mt-5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3 text-xs text-emerald-300">
                  {paidPaymentRequests.length} payment{" "}
                  {paidPaymentRequests.length === 1
                    ? "request"
                    : "requests"}{" "}
                  recorded as paid.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#0b111b] p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Shipment Overview
                </h2>
              </div>

              {shipment ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Info
                    label="Tracking Number"
                    value={
                      shipment.tracking_number
                    }
                    mono
                  />

                  <Info
                    label="Shipment Type"
                    value={
                      shipment.shipment_type
                    }
                  />

                  <Info
                    label="Origin"
                    value={`${shipment.origin_city ?? shipment.origin_country}`}
                  />

                  <Info
                    label="Destination"
                    value={`${shipment.destination_city ?? shipment.destination_country}`}
                  />

                  <Info
                    label="Declared Value"
                    value={formatCurrency(
                      shipment.declared_value,
                      shipment.declared_currency,
                    )}
                  />

                  <Info
                    label="Weight"
                    value={
                      shipment.weight_kg !==
                        null &&
                      shipment.weight_kg !==
                        undefined
                        ? `${shipment.weight_kg} kg`
                        : "—"
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Shipment information unavailable.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#0b111b] p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold">
                  Case Timeline
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Customs case lifecycle timestamps.
                </p>
              </div>

              <div className="space-y-5">
                <TimelineItem
                  label="Case Created"
                  date={customsCase.created_at}
                />

                <TimelineItem
                  label="Case Opened"
                  date={customsCase.opened_at}
                />

                <TimelineItem
                  label="Last Updated"
                  date={customsCase.updated_at}
                />

                {customsCase.cleared_at && (
                  <TimelineItem
                    label="Customs Cleared"
                    date={
                      customsCase.cleared_at
                    }
                    completed
                  />
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-6">
              <div className="mb-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Case Control
                </div>

                <h2 className="mt-2 text-lg font-semibold">
                  Update Status
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Status changes are validated by the
                  backend customs workflow.
                </p>
              </div>

              {!canUpdate ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                  This customs case is{" "}
                  <span className="font-medium text-white">
                    {formatStatus(
                      customsCase.status,
                    )}
                  </span>{" "}
                  and is no longer available for
                  operational status changes.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      New Status
                    </label>

                    <select
                      value={newStatus}
                      onChange={(event) =>
                        setNewStatus(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#101722] px-3 py-3 text-sm text-white outline-none focus:border-blue-500/40"
                    >
                      {transitionOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  {(newStatus === "on_hold" ||
                    newStatus ===
                      "information_required") && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-400">
                        Hold / Information Reason
                      </label>

                      <textarea
                        value={holdReason}
                        onChange={(event) =>
                          setHoldReason(
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="Explain why the shipment requires attention..."
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
                      />
                    </div>
                  )}

                  {(newStatus ===
                    "payment_required" ||
                    newStatus ===
                      "information_required") && (
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-400">
                        Required Action
                      </label>

                      <textarea
                        value={requiredAction}
                        onChange={(event) =>
                          setRequiredAction(
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="Describe what must happen next..."
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500/40"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={updating}
                    onClick={updateStatus}
                    className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : "Apply Status Change"}
                  </button>
                </div>
              )}
            </section>

            {canCreatePayment && (
              <section className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.035] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
                  Financial Action
                </div>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  Customs Payment
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  If customs requires a financial settlement,
                  create a controlled payment request. The
                  request remains linked to this customs case
                  throughout its lifecycle.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setCreatingPayment(true)
                  }
                  className="mt-5 w-full rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/15"
                >
                  Create Payment Request
                </button>
              </section>
            )}

            {shipment && (
              <Link
                href={`/admin/shipments/${encodeURIComponent(
                  shipment.tracking_number,
                )}`}
                className="block rounded-2xl border border-white/[0.08] bg-[#0b111b] p-6 transition hover:border-white/15 hover:bg-[#0d1420]"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Shipment Operations
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Open Shipment Record
                  </span>

                  <span className="text-slate-500">
                    →
                  </span>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Review the complete shipment record,
                  tracking timeline, documents, and
                  operational actions.
                </p>
              </Link>
            )}
          </aside>
        </div>
      </div>

      {creatingPayment && (
        <CreatePaymentRequestModal
          customsCaseId={customsCase.id}
          onClose={() =>
            setCreatingPayment(false)
          }
          onCreated={async () => {
            setCreatingPayment(false);
            setSuccess(
              "Payment request created successfully.",
            );
            await loadData();
          }}
        />
      )}
    </main>
  );
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </div>

      <div
        className={`mt-2 break-words text-sm text-slate-200 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </div>

      <div className="mt-1.5 text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  completed = false,
}: {
  label: string;
  date: string;
  completed?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="relative flex w-3 justify-center">
        <span
          className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
            completed
              ? "bg-emerald-400"
              : "bg-blue-400"
          }`}
        />
      </div>

      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">
          {label}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          {formatDate(date)}
        </div>
      </div>
    </div>
  );
}